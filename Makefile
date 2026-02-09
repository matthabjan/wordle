.PHONY: help build up down restart logs ps clean build-prod up-prod down-prod logs-prod health

# Default target
help:
	@echo "Wordle Docker Management"
	@echo "========================"
	@echo ""
	@echo "Development Commands:"
	@echo "  make build        - Build development Docker image"
	@echo "  make up           - Start development container"
	@echo "  make down         - Stop development container"
	@echo "  make logs         - View development logs"
	@echo ""
	@echo "Production Commands:"
	@echo "  make build-prod   - Build production Docker image"
	@echo "  make up-prod      - Start production container"
	@echo "  make down-prod    - Stop production container"
	@echo "  make logs-prod    - View production logs"
	@echo "  make restart-prod - Restart production container"
	@echo "  make health       - Check production container health"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make ps           - List running containers"
	@echo "  make clean        - Remove all containers and images"
	@echo ""

# Development targets
build:
	docker build -t wordle:dev --target dev .

up:
	docker run -d -p 3000:3000 --name wordle-dev wordle:dev

down:
	docker stop wordle-dev || true
	docker rm wordle-dev || true

logs:
	docker logs -f wordle-dev

# Production targets with docker-compose
build-prod:
	docker-compose -f docker-compose.prod.yml build

up-prod:
	@if [ -f .env.docker ]; then \
		docker-compose --env-file .env.docker -f docker-compose.prod.yml up -d; \
	else \
		docker-compose -f docker-compose.prod.yml up -d; \
	fi
	@echo ""
	@echo "Production container started!"
	@echo "Access at: http://localhost:8080"
	@echo ""

down-prod:
	docker-compose -f docker-compose.prod.yml down

restart-prod:
	docker-compose -f docker-compose.prod.yml restart

logs-prod:
	docker-compose -f docker-compose.prod.yml logs -f

health:
	@echo "Checking container health..."
	@docker inspect --format='{{.State.Health.Status}}' wordle-app 2>/dev/null || echo "Health check not available or container not running"
	@echo ""
	@echo "Container stats:"
	@docker stats --no-stream wordle-app 2>/dev/null || echo "Container not running"

# Utility targets
ps:
	docker ps -a | grep wordle || echo "No wordle containers found"

clean:
	@echo "Stopping all wordle containers..."
	@docker stop wordle-dev wordle-app 2>/dev/null || true
	@docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
	@echo "Removing containers..."
	@docker rm wordle-dev wordle-app 2>/dev/null || true
	@echo "Removing images..."
	@docker rmi wordle:dev wordle:prod 2>/dev/null || true
	@echo "Cleanup complete!"

# Production deployment with checks
deploy-prod: build-prod
	@echo "Building production image..."
	@make build-prod
	@echo ""
	@echo "Starting production container..."
	@make up-prod
	@echo ""
	@echo "Waiting for health check..."
	@sleep 5
	@make health
	@echo ""
	@echo "Deployment complete!"
