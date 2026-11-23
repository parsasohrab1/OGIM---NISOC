# 📋 OGIM Dashboard Execution Guide

## 🚀 Quick Start

### Method 1: Using the PowerShell script (recommended)

```powershell
# In the project root
.\start_dashboard.ps1
```

This script automatically:
- Starts all Backend services
- Installs and runs the Frontend
- Opens everything in separate windows

---

## 📦 Manual Setup

### Prerequisites

```powershell
# Check Python
python --version  # must be Python 3.8+

# Check Node.js
node --version    # must be Node.js 16+

# Check npm
npm --version
```

---

## 🔧 Running Backend Services

### 1. Installing Dependencies

```powershell
# Install dependencies for each service
cd backend/api-gateway
pip install -r requirements.txt
cd ../..

cd backend/auth-service
pip install -r requirements.txt
cd ../..

# Repeat for the other services...
```

**Or all at once:**

```powershell
# Install dependencies for all services
Get-ChildItem -Path backend -Recurse -Filter "requirements.txt" | ForEach-Object {
    Write-Host "Installing dependencies for $($_.DirectoryName)" -ForegroundColor Yellow
    pip install -r $_.FullName
}
```

### 2. Starting the services

#### API Gateway (port 8000)
```powershell
cd backend/api-gateway
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Auth Service (port 8001)
```powershell
cd backend/auth-service
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

#### Data Ingestion Service (port 8002)
```powershell
cd backend/data-ingestion-service
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

#### ML Inference Service (port 8003)
```powershell
cd backend/ml-inference-service
python -m uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

#### Alert Service (port 8004)
```powershell
cd backend/alert-service
python -m uvicorn main:app --host 0.0.0.0 --port 8004 --reload
```

#### Reporting Service (port 8005)
```powershell
cd backend/reporting-service
python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload
```

#### Command Control Service (port 8006)
```powershell
cd backend/command-control-service
python -m uvicorn main:app --host 0.0.0.0 --port 8006 --reload
```

#### Tag Catalog Service (port 8007)
```powershell
cd backend/tag-catalog-service
python -m uvicorn main:app --host 0.0.0.0 --port 8007 --reload
```

#### Digital Twin Service (port 8008)
```powershell
cd backend/digital-twin-service
python -m uvicorn main:app --host 0.0.0.0 --port 8008 --reload
```

#### Edge Computing Service (port 8009)
```powershell
cd backend/edge-computing-service
python -m uvicorn main:app --host 0.0.0.0 --port 8009 --reload
```

#### ERP Integration Service (port 8010)
```powershell
cd backend/erp-integration-service
python -m uvicorn main:app --host 0.0.0.0 --port 8010 --reload
```

#### DVR Service (port 8011)
```powershell
cd backend/dvr-service
python -m uvicorn main:app --host 0.0.0.0 --port 8011 --reload
```

#### Remote Operations Service (port 8012)
```powershell
cd backend/remote-operations-service
python -m uvicorn main:app --host 0.0.0.0 --port 8012 --reload
```

#### Data Variables Service (port 8013)
```powershell
cd backend/data-variables-service
python -m uvicorn main:app --host 0.0.0.0 --port 8013 --reload
```

#### Storage Optimization Service (port 8014)
```powershell
cd backend/storage-optimization-service
python -m uvicorn main:app --host 0.0.0.0 --port 8014 --reload
```

---

## 🎨 Running the Frontend

### 1. Installing Dependencies

```powershell
cd frontend/web
npm install
```

### 2. Starting the Development Server

```powershell
npm run dev
```

The Frontend runs on port **5173**.

---

## 📍 Access addresses

### Frontend
- **Dashboard**: http://localhost:5173
- **Development Server**: http://localhost:5173

### Backend APIs
- **API Gateway**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Auth Service**: http://localhost:8001
- **Data Ingestion**: http://localhost:8002
- **ML Inference**: http://localhost:8003
- **Alert Service**: http://localhost:8004
- **Reporting**: http://localhost:8005
- **Command Control**: http://localhost:8006
- **Tag Catalog**: http://localhost:8007
- **Digital Twin**: http://localhost:8008
- **Edge Computing**: http://localhost:8009
- **ERP Integration**: http://localhost:8010
- **DVR Service**: http://localhost:8011
- **Remote Operations**: http://localhost:8012
- **Data Variables**: http://localhost:8013
- **Storage Optimization**: http://localhost:8014

---

## 🔐 Default login credentials

```
Username: admin
Password: Admin@123
```

---

## 🗂️ Project structure

```
OGIM/
├── backend/                    # Backend services
│   ├── api-gateway/           # API Gateway (8000)
│   ├── auth-service/          # Authentication (8001)
│   ├── data-ingestion-service/ # Data Ingestion (8002)
│   ├── ml-inference-service/  # ML Inference (8003)
│   ├── alert-service/         # Alert Management (8004)
│   ├── reporting-service/      # Reporting (8005)
│   ├── command-control-service/ # Command Control (8006)
│   ├── tag-catalog-service/   # Tag Catalog (8007)
│   ├── digital-twin-service/  # Digital Twin (8008)
│   ├── edge-computing-service/ # Edge Computing (8009)
│   ├── erp-integration-service/ # ERP Integration (8010)
│   ├── dvr-service/           # DVR Service (8011)
│   ├── remote-operations-service/ # Remote Operations (8012)
│   ├── data-variables-service/ # Data Variables (8013)
│   ├── storage-optimization-service/ # Storage Optimization (8014)
│   └── shared/                # Shared code
├── frontend/                   # Frontend Application
│   └── web/                   # React/Vite Application
├── scripts/                   # Helper scripts
├── docs/                      # Documentation
└── start_dashboard.ps1        # Startup script
```

---

## ⚙️ Environment Variables settings

### The `.env` file (in the project root)

```env
# Database
DATABASE_URL=postgresql://ogim_user:ogim_password@localhost:5432/ogim
TIMESCALE_URL=postgresql://ogim_user:ogim_password@localhost:5432/ogim_tsdb

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Service URLs (for local development)
SERVICE_HOST=localhost

# ERP Integration
ERP_INTEGRATION_ENABLED=true
ERP_SERVICE_URL=http://localhost:8010
ERP_DEFAULT_SYSTEM=sap
ERP_AUTO_CREATE_WORK_ORDERS=false

# MQTT (optional)
MQTT_ENABLED=false
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883

# LoRaWAN (optional)
LORAWAN_ENABLED=false
LORAWAN_NETWORK_TYPE=ttn
```

---

## 🛠️ Useful commands

### Checking service status

```powershell
# Check the ports in use
netstat -ano | findstr ":8000 :8001 :8002 :5173"

# Check Python processes
Get-Process | Where-Object {$_.ProcessName -like "*python*"}

# Check Node processes
Get-Process | Where-Object {$_.ProcessName -eq "node"}
```

### Stopping the services

```powershell
# Stop all Python processes (Backend)
Get-Process python | Stop-Process

# Stop all Node processes (Frontend)
Get-Process node | Stop-Process

# Or stop by port
netstat -ano | findstr ":8000" | ForEach-Object {
    $pid = ($_ -split '\s+')[-1]
    Stop-Process -Id $pid -Force
}
```

### Cleanup and reinstall

```powershell
# Clean node_modules
cd frontend/web
Remove-Item -Recurse -Force node_modules
npm install

# Clean Python cache
Get-ChildItem -Path backend -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force
Get-ChildItem -Path backend -Recurse -Filter "*.pyc" | Remove-Item -Force
```

---

## 📝 Startup order (Manual)

### 1. Starting the Database (if you use it)
```powershell
# PostgreSQL and TimescaleDB must be running
# Or use Docker Compose
docker-compose up -d postgres timescaledb
```

### 2. Starting Kafka (if you use it)
```powershell
# Or Docker Compose
docker-compose up -d kafka zookeeper
```

### 3. Starting the Backend Services
```powershell
# Use the script (recommended)
.\start_dashboard.ps1

# Or manually (each service in a separate terminal)
```

### 4. Starting the Frontend
```powershell
cd frontend/web
npm install
npm run dev
```

---

## 🔍 Troubleshooting

### Problem: Port is in use
```powershell
# Find the process using the port
netstat -ano | findstr ":8000"

# Stop the process
Stop-Process -Id <PID> -Force
```

### Problem: Dependencies not installed
```powershell
# Reinstall
pip install -r requirements.txt
npm install
```

### Problem: Database Connection Error
- Check that PostgreSQL/TimescaleDB is running
- Check that DATABASE_URL is correct
- Check that migrations have been run

### Problem: The Frontend does not connect to the Backend
- Check that the API Gateway is running on port 8000
- Check that the CORS settings are correct
- Check that SERVICE_HOST is set correctly

---

## 📚 More documentation

- `SETUP_GUIDE.md` - Complete installation guide
- `QUICK_START.md` - Quick guide
- `SERVICE_URLS.md` - Complete list of service URLs
- `docs/` - Detailed documentation

---

## ✅ Setup Checklist

- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Database running (if you use it)
- [ ] Kafka running (if you use it)
- [ ] Backend Services started
- [ ] Frontend started
- [ ] Access to http://localhost:5173

---

## 🎯 Summary commands

```powershell
# Complete startup (recommended)
.\start_dashboard.ps1

# Or manually:

# Backend (in a separate terminal)
cd backend/api-gateway
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (in a separate terminal)
cd frontend/web
npm install
npm run dev
```

---

**Access address:** http://localhost:5173

