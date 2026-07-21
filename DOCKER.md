# Docker Deployment Guide

This guide covers deploying the Wordle application using Docker and Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [SSL/TLS Setup](#ssltls-setup)
- [Monitoring and Logs](#monitoring-and-logs)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

## Prerequisites

- Docker 20.10 or later
- Docker Compose 2.0 or later
- For SSL: Valid SSL certificates or Let's Encrypt setup

## Quick Start

### Basic Production Deployment

1. **Build and start the application**:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

2. **Access the application**:

Open your browser to [http://localhost:8080](http://localhost:8080)

3. **Stop the application**:

```bash
docker-compose -f docker-compose.prod.yml down
```

## Production Deployment

### Step-by-Step Production Setup

#### 1. Prepare Environment Variables

Copy the example environment file and customize it:

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` to configure your deployment:

```bash
WORDLE_PORT=8080
VITE_GAME_NAME=Wordle
VITE_GAME_DESCRIPTION=Wordle auf Deutsch
LEADERBOARD_PASSPHRASE=change-me
```

`LEADERBOARD_PASSPHRASE` is the shared secret — anyone who knows it enters it once alongside a display name to use the daily leaderboard; everyone else just plays without it. See [Leaderboard API](#leaderboard-api-optional).

#### 2. Build the Production Image

```bash
docker-compose --env-file .env.docker -f docker-compose.prod.yml build
```

#### 3. Start the Services

```bash
docker-compose --env-file .env.docker -f docker-compose.prod.yml up -d
```

#### 4. Verify the Deployment

Check that the container is running:

```bash
docker-compose -f docker-compose.prod.yml ps
```

Check the application health:

```bash
docker-compose -f docker-compose.prod.yml exec wordle wget -q -O- http://localhost:8080
```

#### 5. View Logs

```bash
docker-compose -f docker-compose.prod.yml logs -f wordle
```

## Configuration

### Port Configuration

By default, the application runs on port 8080. To change it:

1. Edit `.env.docker`:
   ```bash
   WORDLE_PORT=3000
   ```

2. Restart the services:
   ```bash
   docker-compose --env-file .env.docker -f docker-compose.prod.yml up -d
   ```

### Resource Limits

The default configuration sets resource limits:

- CPU: 0.5 cores max, 0.25 cores reserved
- Memory: 256MB max, 128MB reserved

To adjust these, edit `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

### Application Configuration

To change application settings (title, description, etc.):

1. Edit `.env` file in the project root
2. Rebuild the Docker image:
   ```bash
   docker-compose -f docker-compose.prod.yml build --no-cache
   ```
3. Restart services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## SSL/TLS Setup

### Option 1: Traefik / Portainer (Recommended for home servers)

Build the `wordle:prod` image, then run it from your own Portainer/Traefik stack with **no published host ports**. Traefik terminates TLS and sets HSTS; the app nginx still sends CSP and other security headers.

**Build the images**

```bash
docker build --target prod -t wordle:prod \
  --build-arg VITE_GAME_NAME="Wordle" \
  --build-arg VITE_GAME_DESCRIPTION="Wordle auf Deutsch" \
  .

# Only needed if you're using the leaderboard — see below.
docker build -t wordle-leaderboard-api:prod ./server
```

**Example Portainer / Compose stack** (adjust entrypoint and middlewares to match your Traefik):

```yaml
services:
  wordle:
    image: wordle:prod
    container_name: wordle
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - proxy
      - leaderboard-internal
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=proxy"
      - "traefik.http.routers.wordle.rule=Host(`wordle.example.com`)"
      - "traefik.http.routers.wordle.entrypoints=HTTPS"
      - "traefik.http.routers.wordle.tls=true"
      - "traefik.http.routers.wordle.tls.certresolver=letsencrypt"
      - "traefik.http.services.wordle.loadbalancer.server.port=8080"

  # Optional — powers the daily leaderboard folded into the Stats modal.
  # Omit this service entirely and the app keeps working normally; nginx's
  # /api/ proxy just 502s and the frontend fails silently. Must be named
  # "leaderboard-api" and share a network with "wordle" — nginx resolves that name
  # at request time (see docker/etc/nginx/conf.d/default.conf).
  leaderboard-api:
    image: wordle-leaderboard-api:prod
    container_name: leaderboard-api
    restart: unless-stopped
    environment:
      - LEADERBOARD_PASSPHRASE=${LEADERBOARD_PASSPHRASE}
    volumes:
      - leaderboard-data:/data
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    networks:
      - leaderboard-internal

networks:
  proxy:
    external: true
  # Private link between wordle and leaderboard-api only — not exposed to Traefik.
  leaderboard-internal:
    driver: bridge

volumes:
  leaderboard-data:
```

**Firewall checklist**

- [ ] Only ports 80/443 open to the internet (on Traefik)
- [ ] Wordle port 8080 is **not** published on the host
- [ ] Traefik sets `Strict-Transport-Security` (do not duplicate HSTS on the app)
- [ ] Browser DevTools → Network: fonts load from same origin (`/fonts/*.woff2`), no `fonts.googleapis.com`
- [ ] Response headers include `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`

**Verify headers from the app container**

```bash
docker exec wordle wget -q -S -O /dev/null http://localhost:8080/ 2>&1 | head -30
```

### Option 2: Built-in nginx SSL proxy (legacy)

The optional `nginx-proxy` service in `docker-compose.prod.yml` / `docker/etc/nginx/conf.d/wordle.conf` can terminate TLS if you are not using Traefik. Prefer Option 1 for home-lab setups.

#### Prepare certificates

```bash
mkdir -p certs
cp /path/to/fullchain.pem certs/
cp /path/to/privkey.pem certs/
```

Uncomment `nginx-proxy` in compose, set `server_name` in `wordle.conf`, then:

```bash
docker compose --env-file .env.docker -f docker-compose.prod.yml up -d
```

### Option 3: Other reverse proxies (Caddy, etc.)

Proxy to the Wordle container on port **8080** on the Docker network (do not publish 8080 publicly). Example Caddy:

```
wordle.yourdomain.com {
    reverse_proxy wordle:8080
}
```

Let Caddy/Traefik set HSTS; the app image already sends CSP and related headers.

## Leaderboard API (optional)

`server/` is a small Fastify + SQLite service that powers the daily and overall leaderboard folded into the Stats modal. It's entirely optional — the core game works identically with or without it.

- **Auth**: one shared `LEADERBOARD_PASSPHRASE` env var; anyone who knows it enters it once alongside a display name, cached in `localStorage` on their device. There's no per-person account — the passphrase is the only gate.
- **Data**: one SQLite file (`/data/leaderboard.db` inside the container), one row per `(date, name)`, kept forever — never deleted or overwritten across days, only upserted for the same person on the same day.
- **Overall ranking**: calculated by the server from those daily rows. A win awards 6 points for one guess down to 1 point for six guesses; a loss awards 0. Ties are resolved by wins, then lower average guesses.
- **Reveal**: a viewer only sees full guess grids for others once they've submitted their own result for that day; until then they see just name + guess count.
- **Failure mode**: nginx proxies `/api/` to the `leaderboard-api` container using Docker's embedded DNS resolved at request time (not at nginx startup) — so if `leaderboard-api` is stopped, removed, or never deployed, the main app still starts and plays normally; the leaderboard section in Stats just shows nothing or "derzeit nicht verfügbar".
- **Local dev**: `cd server && LEADERBOARD_PASSPHRASE=devsecret npm install && npm start` runs it on `:3001`; `vite.config.ts` already proxies `/api` there for `npm run dev`.

**Backup**: the leaderboard data lives in the `leaderboard-data` Docker volume (SQLite file). Back it up like any other volume:

```bash
docker run --rm -v leaderboard-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/leaderboard-data-backup.tar.gz -C /data .
```

## Monitoring and Logs

### View Logs

**Real-time logs**:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Specific service logs**:
```bash
docker-compose -f docker-compose.prod.yml logs -f wordle
```

**Last 100 lines**:
```bash
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Health Checks

Check container health:
```bash
docker inspect --format='{{.State.Health.Status}}' wordle-app
```

View health check logs:
```bash
docker inspect --format='{{json .State.Health}}' wordle-app | jq
```

### Container Stats

View resource usage:
```bash
docker stats wordle-app
```

## Troubleshooting

### Container Won't Start

1. **Check logs**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs wordle
   ```

2. **Verify port availability**:
   ```bash
   sudo netstat -tulpn | grep 8080
   ```

3. **Remove and recreate**:
   ```bash
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Application Not Accessible

1. **Check if container is running**:
   ```bash
   docker ps | grep wordle
   ```

2. **Test from inside container**:
   ```bash
   docker-compose -f docker-compose.prod.yml exec wordle wget -q -O- http://localhost:8080
   ```

3. **Check firewall rules**:
   ```bash
   sudo ufw status
   sudo ufw allow 8080/tcp
   ```

### SSL Issues

1. **Verify certificate paths**:
   ```bash
   ls -la certs/
   ```

2. **Check nginx configuration**:
   ```bash
   docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -t
   ```

3. **View nginx error logs**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx-proxy
   ```

### Memory Issues

If the application runs out of memory:

1. **Increase memory limits** in `docker-compose.prod.yml`
2. **Check memory usage**:
   ```bash
   docker stats wordle-app
   ```

## Advanced Configuration

### Custom Network Configuration

To use an existing Docker network:

```yaml
networks:
  wordle-network:
    external: true
    name: my-existing-network
```

### Backup and Restore

The Wordle application is stateless, but to backup the Docker image:

```bash
# Save image
docker save wordle:prod | gzip > wordle-backup.tar.gz

# Restore image
docker load < wordle-backup.tar.gz
```

### Multi-Instance Deployment

To run multiple instances with a load balancer:

1. Create `docker-compose.scale.yml`:

```yaml
version: '3.8'

services:
  wordle:
    build:
      context: .
      target: prod
    deploy:
      replicas: 3
    # ... rest of configuration

  nginx-lb:
    image: nginx:1.27-alpine
    ports:
      - "80:80"
    volumes:
      - ./docker/lb/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - wordle
```

2. Start with scale:
```bash
docker-compose -f docker-compose.scale.yml up -d --scale wordle=3
```

### Update Strategy

To update the application with zero downtime:

```bash
# Build new image
docker-compose -f docker-compose.prod.yml build

# Create new container
docker-compose -f docker-compose.prod.yml up -d --no-deps --scale wordle=2 wordle

# Wait for health check
sleep 30

# Remove old container
docker-compose -f docker-compose.prod.yml up -d --no-deps --scale wordle=1 wordle
```

## Performance Optimization

### Gzip Compression

Enabled in `docker/etc/nginx/nginx.conf` for text, JS, CSS, JSON, SVG, and fonts.

### Cache Static Assets

Configured in `docker/etc/nginx/conf.d/default.conf`:

- `/assets/` and `/fonts/`: `Cache-Control: public, max-age=31536000, immutable`
- `index.html`, `sw.js`, manifests: `Cache-Control: no-cache` (so PWA updates are not sticky)

### Optimize Image Size

The production image uses multi-stage builds and Alpine Linux. Build args bake `VITE_*` into the static bundle (`npm ci`).

## Security Best Practices

1. **Non-root nginx user** (`wordle`, UID 1001) in the final image
2. **Security headers** on the app nginx (`default.conf`): CSP, nosniff, frame deny, referrer, permissions-policy, COOP — HSTS belongs on Traefik
3. **Self-hosted fonts** — no Google Fonts egress
4. **Traefik/Portainer**: no host ports for the Wordle container; optional `cap_drop` / `no-new-privileges` / `read_only` + tmpfs in your stack
5. **Firewall**: only 80/443 to Traefik; never expose 8080 publicly
6. **Keep images updated** and scan (`docker scout` / Trivy)
7. **No secrets in the SPA** — `VITE_*` are public build-time strings only
8. **leaderboard-api** (if used): no host ports, `cap_drop: ALL`, non-root user, isolated on its own internal network — never on the Traefik-facing network

## Production Checklist

- [ ] Image built with desired `VITE_*` args (`wordle:prod`)
- [ ] Traefik network / labels configured in your Portainer stack
- [ ] Firewall: 80/443 only; 8080 not published
- [ ] Health check green
- [ ] CSP / nosniff / frame headers verified
- [ ] Fonts served from `/fonts/` (same origin)
- [ ] Log rotation configured
- [ ] Backup / rollback plan ready
- [ ] If using the leaderboard: `LEADERBOARD_PASSPHRASE` set to a real value (not `change-me`), `leaderboard-api` built and reachable as that exact container name, `leaderboard-data` volume included in backups

## Support

For issues related to:
- **Docker setup**: Check this guide and Docker logs
- **Application features**: See main [README.md](README.md)
- **Word lists**: See main [README.md](README.md)

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
