# راه‌اندازی کامل داشبورد OGIM

## 📍 آدرس پروژه

### Repository
- **GitHub**: https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring.git
- **مسیر محلی**: `C:\Users\asus\Documents\companies\ithub\AI\products\clones\OGIM`

---

## 🚀 راه‌اندازی سریع

### روش 1: استفاده از اسکریپت (توصیه می‌شود)

```powershell
# راه‌اندازی خودکار تمام سرویس‌ها
.\start_dashboard.ps1
```

### روش 2: راه‌اندازی دستی

#### Backend (Docker)
```powershell
docker-compose -f docker-compose.dev.yml up -d
```

#### Frontend
```powershell
cd frontend/web
npm install
npm run dev
```

---

## 🌐 آدرس‌های دسترسی

### Frontend Dashboard
- **Development**: http://localhost:3000
- **Alternative**: http://localhost:5173

### Backend Services

| سرویس | پورت | آدرس | Health Check |
|-------|------|------|--------------|
| **API Gateway** | 8000 | http://localhost:8000 | http://localhost:8000/health |
| Auth Service | 8001 | http://localhost:8001 | http://localhost:8001/health |
| Data Ingestion | 8002 | http://localhost:8002 | http://localhost:8002/health |
| ML Inference | 8003 | http://localhost:8003 | http://localhost:8003/health |
| Alert Service | 8004 | http://localhost:8004 | http://localhost:8004/health |
| Reporting | 8005 | http://localhost:8005 | http://localhost:8005/health |
| Command Control | 8006 | http://localhost:8006 | http://localhost:8006/health |
| Tag Catalog | 8007 | http://localhost:8007 | http://localhost:8007/health |
| Digital Twin | 8008 | http://localhost:8008 | http://localhost:8008/health |
| Edge Computing | 8009 | http://localhost:8009 | http://localhost:8009/health |
| ERP Integration | 8010 | http://localhost:8010 | http://localhost:8010/health |

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Infrastructure
- **PostgreSQL**: `localhost:5432`
- **TimescaleDB**: `localhost:5433`
- **Redis**: `localhost:6379`
- **Kafka**: `localhost:9092`

---

## ⚙️ راه‌اندازی دستی Backend

### پیش‌نیازها
- Python 3.9+
- PostgreSQL 15+ با TimescaleDB
- Redis
- Apache Kafka

### راه‌اندازی هر سرویس (در ترمینال جداگانه)

```powershell
# Terminal 1: API Gateway
cd backend/api-gateway
python -m uvicorn main:app --port 8000 --reload

# Terminal 2: Auth Service
cd backend/auth-service
python -m uvicorn main:app --port 8001 --reload

# Terminal 3: Data Ingestion
cd backend/data-ingestion-service
python -m uvicorn main:app --port 8002 --reload

# Terminal 4: ML Inference
cd backend/ml-inference-service
python -m uvicorn main:app --port 8003 --reload

# Terminal 5: Alert Service
cd backend/alert-service
python -m uvicorn main:app --port 8004 --reload

# Terminal 6: Reporting
cd backend/reporting-service
python -m uvicorn main:app --port 8005 --reload

# Terminal 7: Command Control
cd backend/command-control-service
python -m uvicorn main:app --port 8006 --reload

# Terminal 8: Tag Catalog
cd backend/tag-catalog-service
python -m uvicorn main:app --port 8007 --reload

# Terminal 9: Digital Twin
cd backend/digital-twin-service
python -m uvicorn main:app --port 8008 --reload

# Terminal 10: Edge Computing (اختیاری)
cd backend/edge-computing-service
python -m uvicorn main:app --port 8009 --reload

# Terminal 11: ERP Integration (اختیاری)
cd backend/erp-integration-service
python -m uvicorn main:app --port 8010 --reload
```

---

## 🎨 راه‌اندازی دستی Frontend

### 1. نصب Dependencies

```powershell
cd frontend/web
npm install
```

### 2. تنظیم Environment Variables

ایجاد فایل `.env` در `frontend/web/`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 3. راه‌اندازی Development Server

```powershell
npm run dev
```

Frontend در آدرس زیر در دسترس خواهد بود:
- **Development**: http://localhost:3000

### 4. Build برای Production

```powershell
npm run build
npm run preview
```

---

## 🔐 ورود به سیستم

### کاربران پیش‌فرض

| Username | Password | Role |
|----------|----------|------|
| admin | Admin@123 | system_admin |
| operator1 | Operator@123 | field_operator |
| engineer1 | Engineer@123 | data_engineer |
| viewer1 | Viewer@123 | viewer |

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

---

## ✅ تست و بررسی

### بررسی سلامت سرویس‌ها

```powershell
# API Gateway
Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing

# سایر سرویس‌ها
Invoke-WebRequest -Uri "http://localhost:8001/health" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:8002/health" -UseBasicParsing
# ...
```

### تست احراز هویت

```powershell
$body = @{
    username = "admin"
    password = "Admin@123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## 📚 مستندات

- **SETUP_GUIDE.md**: راهنمای کامل راه‌اندازی
- **QUICK_START.md**: راهنمای سریع
- **SERVICE_URLS.md**: لیست کامل آدرس‌ها و Endpointها
- **docs/ARCHITECTURE.md**: معماری سیستم
- **docs/INSTALLATION.md**: راهنمای نصب

---

## 🔧 مشکلات رایج

### مشکل: Docker در حال اجرا نیست
**راه‌حل**: Docker Desktop را راه‌اندازی کنید یا از راه‌اندازی دستی استفاده کنید.

### مشکل: Frontend به Backend متصل نمی‌شود
**راه‌حل**: 
1. بررسی کنید که API Gateway در حال اجرا است
2. بررسی `VITE_API_BASE_URL` در `.env`
3. بررسی CORS settings

### مشکل: خطای Database Connection
**راه‌حل**:
1. بررسی کنید که PostgreSQL در حال اجرا است
2. بررسی `DATABASE_URL` در `.env`
3. بررسی credentials

---

## 🎯 دستورات سریع

### راه‌اندازی کامل
```powershell
# Backend
docker-compose -f docker-compose.dev.yml up -d

# Frontend
cd frontend/web; npm install; npm run dev
```

### توقف سرویس‌ها
```powershell
# Docker
docker-compose -f docker-compose.dev.yml down

# دستی: Ctrl+C در هر ترمینال
```

---

**نسخه**: 1.0.0  
**تاریخ**: دسامبر 2025

