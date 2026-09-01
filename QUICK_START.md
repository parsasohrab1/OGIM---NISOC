# راهنمای سریع راه‌اندازی OGIM

## 🚀 راه‌اندازی سریع (Docker)

### 1. راه‌اندازی Backend

```bash
# راه‌اندازی تمام سرویس‌ها
docker-compose -f docker-compose.dev.yml up -d

# بررسی وضعیت
docker-compose -f docker-compose.dev.yml ps
```

### 2. راه‌اندازی Frontend

```bash
cd frontend/web
npm install
npm run dev
```

### 3. دسترسی به داشبورد

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 4. ورود به سیستم

- **Username**: `admin`
- **Password**: `Admin@123`

---

## 📍 آدرس‌های مهم

### Frontend
- **Development**: http://localhost:3000
- **Production**: http://localhost:5173 (پس از build)

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

## 🔧 راه‌اندازی دستی

### Backend (هر سرویس در ترمینال جداگانه)

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

## 📝 تنظیمات Environment Variables

ایجاد فایل `.env` در ریشه پروژه:

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

## ✅ تست

```bash
# بررسی سلامت API Gateway
curl http://localhost:8000/health

# تست احراز هویت
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

---

برای راهنمای کامل، به [SETUP_GUIDE.md](./SETUP_GUIDE.md) مراجعه کنید.

