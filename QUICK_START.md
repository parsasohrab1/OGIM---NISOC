# OGIM Quick Start Guide

## 🚀 Quick start (Docker)

### 1. Starting the Backend

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Check the status
docker-compose -f docker-compose.dev.yml ps
```

### 2. Starting the Frontend

```bash
cd frontend/web
npm install
npm run dev
```

### 3. Accessing the dashboard

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 4. Logging in

- **Username**: `admin`
- **Password**: `Admin@123`

---

## 📍 Important addresses

### Frontend
- **Development**: http://localhost:3000
- **Production**: http://localhost:5173 (after build)

### Backend Services
- **API Gateway**: http://localhost:8000
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

### Infrastructure
- **PostgreSQL**: localhost:5432
- **TimescaleDB**: localhost:5433
- **Redis**: localhost:6379
- **Kafka**: localhost:9092

---

## 🔧 Manual startup

### Backend (each service in a separate terminal)

```bash
# API Gateway
cd backend/api-gateway
uvicorn main:app --port 8000 --reload

# Auth Service
cd backend/auth-service
uvicorn main:app --port 8001 --reload

# Data Ingestion
cd backend/data-ingestion-service
uvicorn main:app --port 8002 --reload

# ML Inference
cd backend/ml-inference-service
uvicorn main:app --port 8003 --reload

# Alert Service
cd backend/alert-service
uvicorn main:app --port 8004 --reload

# Reporting
cd backend/reporting-service
uvicorn main:app --port 8005 --reload

# Command Control
cd backend/command-control-service
uvicorn main:app --port 8006 --reload

# Tag Catalog
cd backend/tag-catalog-service
uvicorn main:app --port 8007 --reload

# Digital Twin
cd backend/digital-twin-service
uvicorn main:app --port 8008 --reload
```

### Frontend

```bash
cd frontend/web
npm install
npm run dev
```

---

## 📝 Environment Variables settings

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
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

---

## ✅ Testing

```bash
# Check the API Gateway health
curl http://localhost:8000/health

# Test authentication
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

---

For the complete guide, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

