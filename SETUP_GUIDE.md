# Complete OGIM Setup Guide

This guide contains complete instructions for setting up the dashboard and all OGIM services.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup with Docker Compose](#docker-compose)
3. [Manual Backend setup](#manual-backend)
4. [Manual Frontend setup](#manual-frontend)
5. [Service addresses](#service-urls)
6. [Testing and verification](#testing)
7. [Common problems](#troubleshooting)

---

## <a name="prerequisites"></a>🔧 Prerequisites

### Required software

- **Docker** and **Docker Compose** (for Docker setup)
- **Python 3.9+** (for manual Backend setup)
- **Node.js 18+** and **npm** (for Frontend setup)
- **PostgreSQL 15+** (if installing manually)
- **TimescaleDB** (extension for PostgreSQL)
- **Redis** (for cache and sessions)
- **Apache Kafka** (for stream processing)

---

## <a name="docker-compose"></a>🐳 Setup with Docker Compose (recommended)

### 1. Cloning the project

```bash
git clone https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring.git
cd OGIM---Oil-Gas-Intelligent-Monitoring
```

### 2. Starting all services

```bash
# Start all services (Backend + Databases + Kafka)
docker-compose -f docker-compose.dev.yml up -d

# Check service status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### 3. Starting the Frontend

```bash
cd frontend/web
npm install
npm run dev
```

### 4. Accessing the dashboard

- **Frontend Dashboard**: http://localhost:5173 (or the port shown by Vite)
- **API Gateway**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## <a name="manual-backend"></a>⚙️ Manual Backend setup

### 1. Installing prerequisites

#### Installing PostgreSQL and TimescaleDB

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-15 postgresql-contrib-15

# Install the TimescaleDB extension
sudo apt-get install timescaledb-2-postgresql-15
sudo timescaledb-tune

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Creating the databases

```bash
# Log in to PostgreSQL
sudo -u postgres psql

# Create the databases
CREATE DATABASE ogim;
CREATE DATABASE ogim_tsdb;

# Create the user
CREATE USER ogim_user WITH PASSWORD 'ogim_password';
GRANT ALL PRIVILEGES ON DATABASE ogim TO ogim_user;
GRANT ALL PRIVILEGES ON DATABASE ogim_tsdb TO ogim_user;

# Enable TimescaleDB
\c ogim_tsdb
CREATE EXTENSION IF NOT EXISTS timescaledb;
\q
```

#### Installing Redis

```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### Installing Apache Kafka

```bash
# Download Kafka
wget https://downloads.apache.org/kafka/2.13-3.6.0/kafka_2.13-3.6.0.tgz
tar -xzf kafka_2.13-3.6.0.tgz
cd kafka_2.13-3.6.0

# Start Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties &

# Start Kafka
bin/kafka-server-start.sh config/server.properties &
```

### 2. Starting the Backend Services

#### Creating a Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

#### Installing Dependencies

```bash
pip install -r shared/requirements.txt
pip install -r data-ingestion-service/requirements.txt
pip install -r ml-inference-service/requirements.txt
pip install -r alert-service/requirements.txt
# ... and the other services
```

#### Setting Environment Variables

Create the `.env` file in the project root:

```bash
# Database
DATABASE_URL=postgresql://ogim_user:ogim_password@localhost:5432/ogim
TIMESCALE_URL=postgresql://ogim_user:ogim_password@localhost:5433/ogim_tsdb

# Redis
REDIS_URL=redis://localhost:6379/0

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Security
SECRET_KEY=your-secret-key-here-minimum-32-characters

# CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# Service URLs
AUTH_SERVICE_URL=http://localhost:8001
DATA_INGESTION_SERVICE_URL=http://localhost:8002
ML_INFERENCE_SERVICE_URL=http://localhost:8003
ALERT_SERVICE_URL=http://localhost:8004
REPORTING_SERVICE_URL=http://localhost:8005
COMMAND_CONTROL_SERVICE_URL=http://localhost:8006
TAG_CATALOG_SERVICE_URL=http://localhost:8007
DIGITAL_TWIN_SERVICE_URL=http://localhost:8008
EDGE_COMPUTING_SERVICE_URL=http://localhost:8009
ERP_INTEGRATION_SERVICE_URL=http://localhost:8010
```

#### Starting the services

In separate terminals:

```bash
# Terminal 1: API Gateway
cd backend/api-gateway
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Auth Service
cd backend/auth-service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 3: Data Ingestion Service
cd backend/data-ingestion-service
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Terminal 4: ML Inference Service
cd backend/ml-inference-service
uvicorn main:app --host 0.0.0.0 --port 8003 --reload

# Terminal 5: Alert Service
cd backend/alert-service
uvicorn main:app --host 0.0.0.0 --port 8004 --reload

# Terminal 6: Reporting Service
cd backend/reporting-service
uvicorn main:app --host 0.0.0.0 --port 8005 --reload

# Terminal 7: Command Control Service
cd backend/command-control-service
uvicorn main:app --host 0.0.0.0 --port 8006 --reload

# Terminal 8: Tag Catalog Service
cd backend/tag-catalog-service
uvicorn main:app --host 0.0.0.0 --port 8007 --reload

# Terminal 9: Digital Twin Service
cd backend/digital-twin-service
uvicorn main:app --host 0.0.0.0 --port 8008 --reload

# Terminal 10: Edge Computing Service (optional)
cd backend/edge-computing-service
uvicorn main:app --host 0.0.0.0 --port 8009 --reload

# Terminal 11: ERP Integration Service (optional)
cd backend/erp-integration-service
uvicorn main:app --host 0.0.0.0 --port 8010 --reload
```

#### Using the startup script

```bash
# Linux/Mac
chmod +x scripts/start_backend.sh
./scripts/start_backend.sh

# Windows PowerShell
.\scripts\start_backend.ps1
```

### 3. Running Database Migrations

```bash
cd backend
alembic upgrade head
```

### 4. Loading Initial Data

```bash
cd backend/shared
python init_db.py
```

---

## <a name="manual-frontend"></a>🎨 Manual Frontend setup

### 1. Installing Dependencies

```bash
cd frontend/web
npm install
```

### 2. Setting the API URL

Edit the file `frontend/web/src/api/client.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

Or create a `.env` file in `frontend/web/`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Starting the Development Server

```bash
npm run dev
```

The Frontend will be available at the following address:
- **Development**: http://localhost:5173 (Vite default port)

### 4. Build for Production

```bash
npm run build
npm run preview  # to test the build
```

---

## <a name="service-urls"></a>🌐 Service addresses

### Backend Services

| Service | Port | Address | Description |
|-------|------|------|---------|
| **API Gateway** | 8000 | http://localhost:8000 | Main API entry point |
| Auth Service | 8001 | http://localhost:8001 | Authentication and user management |
| Data Ingestion | 8002 | http://localhost:8002 | Receiving data from sensors |
| ML Inference | 8003 | http://localhost:8003 | ML models and forecasting |
| Alert Service | 8004 | http://localhost:8004 | Alert management |
| Reporting Service | 8005 | http://localhost:8005 | Reporting |
| Command Control | 8006 | http://localhost:8006 | Control and commands |
| Tag Catalog | 8007 | http://localhost:8007 | Tag catalog |
| Digital Twin | 8008 | http://localhost:8008 | Simulation and 3D BIM |
| Edge Computing | 8009 | http://localhost:8009 | Edge processing |
| ERP Integration | 8010 | http://localhost:8010 | ERP integration |

### Frontend

| Environment | Address | Description |
|------|------|---------|
| Development | http://localhost:5173 | Vite Dev Server |
| Production | http://localhost:3000 | Built (after `npm run build`) |

### Infrastructure Services

| Service | Port | Address | Description |
|-------|------|------|---------|
| PostgreSQL | 5432 | localhost:5432 | Main database |
| TimescaleDB | 5433 | localhost:5433 | Time-series database |
| Redis | 6379 | localhost:6379 | Cache and Session |
| Kafka | 9092 | localhost:9092 | Message Broker |
| Zookeeper | 2181 | localhost:2181 | Kafka Coordination |

### API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## <a name="testing"></a>✅ Testing and verification

### 1. Checking service health

```bash
# Check the API Gateway
curl http://localhost:8000/health

# Check the other services
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
# ...
```

### 2. Testing authentication

```bash
# Register a new user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@ogim.local",
    "password": "Admin@123",
    "role": "system_admin"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123"
  }'
```

### 3. Testing the Frontend

1. Open the browser: http://localhost:5173
2. Log in with the default user:
   - **Username**: `admin`
   - **Password**: `Admin@123`

### 4. Testing Data Ingestion

```bash
# Send sensor data
curl -X POST http://localhost:8000/api/data-ingestion/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "source": "test",
    "records": [{
      "timestamp": "2025-12-15T10:00:00Z",
      "well_name": "WELL-001",
      "equipment_type": "pump",
      "sensor_type": "pressure",
      "value": 450.5,
      "unit": "bar",
      "sensor_id": "TAG-001",
      "data_quality": "good"
    }]
  }'
```

---

## <a name="troubleshooting"></a>🔍 Common problems

### Problem: Services do not start

**Solution:**
1. Check the logs: `docker-compose logs [service-name]`
2. Check the ports: make sure the ports are available
3. Check the database: make sure PostgreSQL and TimescaleDB are running

### Problem: The Frontend does not connect to the Backend

**Solution:**
1. Check `VITE_API_BASE_URL` in `.env`
2. Check the CORS settings in the Backend
3. Check that the API Gateway is running

### Problem: Database Connection error

**Solution:**
1. Check `DATABASE_URL` in `.env`
2. Check that PostgreSQL is running
3. Check the credentials and permissions

### Problem: Kafka Connection Error

**Solution:**
1. Check that Zookeeper and Kafka are running
2. Check `KAFKA_BOOTSTRAP_SERVERS` in `.env`
3. Check network connectivity

---

## 📚 More resources

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Installation Guide](./docs/INSTALLATION.md)
- [Configuration Guide](./docs/CONFIGURATION.md)
- [Developer Guide](./docs/DEVELOPER_GUIDE.md)

---

## 🚀 Quick access

### Complete startup with one command (Docker)

```bash
# Backend
docker-compose -f docker-compose.dev.yml up -d

# Frontend
cd frontend/web && npm install && npm run dev
```

### Important addresses

- **Dashboard**: http://localhost:5173
- **API Gateway**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Default User**: `admin` / `Admin@123`

---

**Version:** 1.0.0
**Updated:** December 2025

