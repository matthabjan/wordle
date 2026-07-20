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
VITE_GAME_NAME=Wordle 2.1
VITE_GAME_DESCRIPTION=Wordle auf Deutsch
# For Traefik:
# WORDLE_HOST=wordle.yourdomain.com
```

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

### Option 1: Traefik (Recommended for home servers)

Use the Traefik overlay so the Wordle container has **no published host ports**. Traefik terminates TLS and sets HSTS; the app nginx still sends CSP and other security headers.

**Prerequisites**

- Traefik on Docker, attached to an external network named `proxy`
- Entrypoints `web` (80) and `websecure` (443)
- Cert resolver named `letsencrypt` (adjust the label in `docker-compose.traefik.yml` if yours differs)

**Deploy**

```bash
cp .env.docker.example .env.docker
# Set WORDLE_HOST=wordle.yourdomain.com and VITE_* as needed

docker network create proxy   # once, if Traefik already uses another name, edit the overlay

docker compose --env-file .env.docker \
  -f docker-compose.prod.yml -f docker-compose.traefik.yml up -d --build
```

Or: `make up-traefik`

**Firewall checklist**

- [ ] Only ports 80/443 open to the internet (on Traefik)
- [ ] Wordle port 8080 is **not** published on the host
- [ ] Traefik sets `Strict-Transport-Security` (do not duplicate HSTS on the app)
- [ ] Browser DevTools → Network: fonts load from same origin (`/fonts/*.woff2`), no `fonts.googleapis.com`
- [ ] Response headers include `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`

**Verify headers from the app container**

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.traefik.yml exec wordle \
  wget -q -S -O /dev/null http://localhost:8080/ 2>&1 | head -30
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
4. **Traefik overlay**: no host ports, `cap_drop: ALL`, `no-new-privileges`, `read_only` + tmpfs
5. **Firewall**: only 80/443 to Traefik; never expose 8080 publicly
6. **Keep images updated** and scan (`docker scout` / Trivy)
7. **No secrets in the SPA** — `VITE_*` are public build-time strings only

## Production Checklist

- [ ] `.env.docker` configured (`WORDLE_HOST`, `VITE_*`)
- [ ] Traefik network `proxy` exists; cert resolver name matches labels
- [ ] Firewall: 80/443 only; 8080 not published
- [ ] Health check green (`make health` or compose health)
- [ ] CSP / nosniff / frame headers verified
- [ ] Fonts served from `/fonts/` (same origin)
- [ ] Log rotation configured
- [ ] Backup / rollback plan ready

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
