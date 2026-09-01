# OGIM Development Setup Script for Windows

Write-Host "================================" -ForegroundColor Cyan
Write-Host "OGIM Development Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker found" -ForegroundColor Green

# Docker Compose
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Docker Compose not found." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker Compose found" -ForegroundColor Green

# Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Python not found." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Python found" -ForegroundColor Green

# Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "⚠ Node.js not found. Frontend won't be available." -ForegroundColor Yellow
} else {
    Write-Host "✓ Node.js found" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Step 1: Environment Configuration" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Copy .env if not exists
if (!(Test-Path .env)) {
    Write-Host "Creating .env file..."
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "⚠ Please edit .env and set your configurations" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Step 2: Start Infrastructure" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Write-Host "Starting databases and message queue..."
docker-compose -f docker-compose.dev.yml up -d postgres timescaledb redis zookeeper kafka

Write-Host "Waiting for services to be ready..."
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Step 3: Initialize Databases" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Write-Host "Installing Python dependencies..."
Set-Location backend/shared
pip install -r requirements.txt

Write-Host "Running database initialization..."
python init_db.py

Set-Location ../..

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Step 4: Generate Sample Data" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Write-Host "Installing script dependencies..."
Set-Location scripts
pip install -r requirements.txt

Write-Host "Generating sample data..."
python data_generator.py

Set-Location ..

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Step 5: Start Backend Services" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Write-Host "Building and starting backend services..."
docker-compose -f docker-compose.dev.yml up -d --build

Write-Host "Waiting for services to start..."
Start-Sleep -Seconds 20

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Step 6: Health Check" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Write-Host "Testing services..."
python scripts/test_services.py

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✓ Development Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services are now running:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Frontend:     http://localhost:3000"
Write-Host "  API Gateway:  http://localhost:8000"
Write-Host "  API Docs:     http://localhost:8000/docs"
Write-Host ""
Write-Host "Default users:" -ForegroundColor Yellow
Write-Host "  admin / Admin@123       (System Admin)"
Write-Host "  operator1 / Operator@123 (Field Operator)"
Write-Host ""
Write-Host "To start frontend:" -ForegroundColor Yellow
Write-Host "  cd frontend/web"
Write-Host "  npm install"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.dev.yml logs -f [service-name]"
Write-Host ""
Write-Host "To stop services:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.dev.yml down"
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan

