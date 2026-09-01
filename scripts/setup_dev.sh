#!/bin/bash

echo "================================"
echo "OGIM Development Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

# Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

# Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found${NC}"

# Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠ Node.js not found. Frontend won't be available.${NC}"
else
    echo -e "${GREEN}✓ Node.js found${NC}"
fi

echo ""
echo "================================"
echo "Step 1: Environment Configuration"
echo "================================"

# Copy .env if not exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please edit .env and set your configurations${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""
echo "================================"
echo "Step 2: Start Infrastructure"
echo "================================"

echo "Starting databases and message queue..."
docker-compose -f docker-compose.dev.yml up -d postgres timescaledb redis zookeeper kafka

echo "Waiting for services to be ready..."
sleep 30

echo ""
echo "================================"
echo "Step 3: Initialize Databases"
echo "================================"

echo "Installing Python dependencies..."
cd backend/shared
pip install -r requirements.txt

echo "Running database initialization..."
python init_db.py

cd ../..

echo ""
echo "================================"
echo "Step 4: Generate Sample Data"
echo "================================"

echo "Installing script dependencies..."
cd scripts
pip install -r requirements.txt

echo "Generating sample data..."
python data_generator.py

cd ..

echo ""
echo "================================"
echo "Step 5: Start Backend Services"
echo "================================"

echo "Building and starting backend services..."
docker-compose -f docker-compose.dev.yml up -d --build

echo "Waiting for services to start..."
sleep 20

echo ""
echo "================================"
echo "Step 6: Health Check"
echo "================================"

echo "Testing services..."
python scripts/test_services.py

echo ""
echo "================================"
echo "✓ Development Setup Complete!"
echo "================================"
echo ""
echo "Services are now running:"
echo ""
echo "  Frontend:     http://localhost:3000"
echo "  API Gateway:  http://localhost:8000"
echo "  API Docs:     http://localhost:8000/docs"
echo ""
echo "Default users:"
echo "  admin / Admin@123       (System Admin)"
echo "  operator1 / Operator@123 (Field Operator)"
echo ""
echo "To start frontend:"
echo "  cd frontend/web"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.dev.yml logs -f [service-name]"
echo ""
echo "To stop services:"
echo "  docker-compose -f docker-compose.dev.yml down"
echo ""
echo "================================"

