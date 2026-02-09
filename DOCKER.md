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
# Change the port if needed
WORDLE_PORT=8080

# Optional: Set a custom project name
COMPOSE_PROJECT_NAME=wordle
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

### Option 1: Using Nginx Reverse Proxy (Recommended)

The docker-compose file includes an optional nginx reverse proxy for SSL termination.

#### 1. Prepare SSL Certificates

Create a `certs` directory and add your certificates:

```bash
mkdir -p certs
# Copy your SSL certificates
cp /path/to/fullchain.pem certs/
cp /path/to/privkey.pem certs/
```

#### 2. Enable Nginx Proxy

Edit `docker-compose.prod.yml` and uncomment the `nginx-proxy` service section and the `volumes` section at the bottom.

#### 3. Configure Domain

Edit `docker/proxy/conf.d/wordle.conf` and replace `server_name _;` with your domain:

```nginx
server_name wordle.yourdomain.com;
```

#### 4. Start with SSL

```bash
docker-compose --env-file .env.docker -f docker-compose.prod.yml up -d
```

Your application will now be available at:
- HTTP: http://yourdomain.com (redirects to HTTPS)
- HTTPS: https://yourdomain.com

### Option 2: Using Let's Encrypt

For automated SSL certificate management:

1. **Install Certbot**:

```bash
# On the host machine
sudo apt-get update
sudo apt-get install certbot
```

2. **Generate Certificates**:

```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

3. **Copy Certificates**:

```bash
mkdir -p certs
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem certs/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem certs/
sudo chown -R $USER:$USER certs/
```

4. **Set Up Auto-Renewal**:

Create a renewal script `scripts/renew-certs.sh`:

```bash
#!/bin/bash
sudo certbot renew --quiet
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /path/to/project/certs/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /path/to/project/certs/
docker-compose -f /path/to/project/docker-compose.prod.yml restart nginx-proxy
```

Add to crontab:
```bash
0 0 * * 0 /path/to/scripts/renew-certs.sh
```

### Option 3: External Reverse Proxy

If you already have a reverse proxy (Traefik, Caddy, etc.), simply proxy traffic to the Wordle container on port 8080.

Example Caddy configuration:

```
wordle.yourdomain.com {
    reverse_proxy localhost:8080
}
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

### Enable HTTP/2

Already enabled in the nginx proxy configuration.

### Enable Gzip Compression

Already enabled in `docker/proxy/nginx.conf`.

### Cache Static Assets

Static assets are cached for 1 year in the nginx proxy configuration.

### Optimize Image Size

The production image uses:
- Multi-stage builds
- Alpine Linux (minimal size)
- Only production dependencies

Current image size: ~50MB

## Security Best Practices

1. **Run as non-root user**: Already configured in Dockerfile
2. **Use security headers**: Configured in nginx proxy
3. **Keep images updated**:
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```
4. **Scan for vulnerabilities**:
   ```bash
   docker scan wordle:prod
   ```
5. **Use secrets for sensitive data**: Use Docker secrets or environment files
6. **Enable firewall**: Only expose necessary ports

## Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed (if using HTTPS)
- [ ] Firewall configured
- [ ] Resource limits set appropriately
- [ ] Health checks verified
- [ ] Logs rotation configured
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] Update procedure documented
- [ ] Emergency rollback plan ready

## Support

For issues related to:
- **Docker setup**: Check this guide and Docker logs
- **Application features**: See main [README.md](README.md)
- **Word lists**: See [COMPLETE_UPDATE_SUMMARY.md](COMPLETE_UPDATE_SUMMARY.md)

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
