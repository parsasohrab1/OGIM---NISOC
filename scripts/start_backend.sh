#!/bin/bash
# Startup script for backend services

echo "======================================"
echo "Starting OGIM Backend Services"
echo "======================================"

cd "$(dirname "$0")/../infrastructure/docker"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Start services
echo "Starting Docker Compose services..."
docker-compose up -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "Checking service health..."

services=(
    "api-gateway:8000"
    "auth-service:8001"
    "data-ingestion-service:8002"
    "ml-inference-service:8003"
    "alert-service:8004"
    "reporting-service:8005"
    "command-control-service:8006"
    "tag-catalog-service:8007"
    "digital-twin-service:8008"
)

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    if curl -s http://localhost:$port/health > /dev/null 2>&1; then
        echo "✓ $name is healthy"
    else
        echo "✗ $name is not responding"
    fi
done

echo ""
echo "======================================"
echo "Backend services started!"
echo "API Gateway: http://localhost:8000"
echo "======================================"

