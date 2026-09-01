# راهنمای کامل راه‌اندازی OGIM

این راهنما شامل دستورالعمل‌های کامل برای راه‌اندازی داشبورد و تمام سرویس‌های OGIM است.

## 📋 فهرست مطالب

1. [پیش‌نیازها](#prerequisites)
2. [راه‌اندازی با Docker Compose](#docker-compose)
3. [راه‌اندازی دستی Backend](#manual-backend)
4. [راه‌اندازی دستی Frontend](#manual-frontend)
5. [آدرس‌های سرویس‌ها](#service-urls)
6. [تست و بررسی](#testing)
7. [مشکلات رایج](#troubleshooting)

---

## <a name="prerequisites"></a>🔧 پیش‌نیازها

### نرم‌افزارهای مورد نیاز

- **Docker** و **Docker Compose** (برای راه‌اندازی با Docker)
- **Python 3.9+** (برای راه‌اندازی دستی Backend)
- **Node.js 18+** و **npm** (برای راه‌اندازی Frontend)
- **PostgreSQL 15+** (اگر به صورت دستی نصب می‌کنید)
- **TimescaleDB** (extension برای PostgreSQL)
- **Redis** (برای cache و session)
- **Apache Kafka** (برای stream processing)

---

## <a name="docker-compose"></a>🐳 راه‌اندازی با Docker Compose (توصیه می‌شود)

### 1. کلون کردن پروژه

```bash
git clone https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring.git
cd OGIM---Oil-Gas-Intelligent-Monitoring
```

### 2. راه‌اندازی تمام سرویس‌ها

```bash
# راه‌اندازی تمام سرویس‌ها (Backend + Databases + Kafka)
docker-compose -f docker-compose.dev.yml up -d

# بررسی وضعیت سرویس‌ها
docker-compose -f docker-compose.dev.yml ps

# مشاهده لاگ‌ها
docker-compose -f docker-compose.dev.yml logs -f
```

### 3. راه‌اندازی Frontend

```bash
cd frontend/web
npm install
npm run dev
```

### 4. دسترسی به داشبورد

- **Frontend Dashboard**: http://localhost:5173 (یا پورت نمایش داده شده توسط Vite)
- **API Gateway**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## <a name="manual-backend"></a>⚙️ راه‌اندازی دستی Backend

### 1. نصب پیش‌نیازها

#### نصب PostgreSQL و TimescaleDB

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-15 postgresql-contrib-15

# نصب TimescaleDB extension
sudo apt-get install timescaledb-2-postgresql-15
sudo timescaledb-tune

# راه‌اندازی PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### ایجاد دیتابیس‌ها

```bash
# ورود به PostgreSQL
sudo -u postgres psql

# ایجاد دیتابیس‌ها
CREATE DATABASE ogim;
CREATE DATABASE ogim_tsdb;

# ایجاد کاربر
CREATE USER ogim_user WITH PASSWORD 'ogim_password';
GRANT ALL PRIVILEGES ON DATABASE ogim TO ogim_user;
GRANT ALL PRIVILEGES ON DATABASE ogim_tsdb TO ogim_user;

# فعال‌سازی TimescaleDB
\c ogim_tsdb
CREATE EXTENSION IF NOT EXISTS timescaledb;
\q
```

#### نصب Redis

```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### نصب Apache Kafka

```bash
# دانلود Kafka
wget https://downloads.apache.org/kafka/2.13-3.6.0/kafka_2.13-3.6.0.tgz
tar -xzf kafka_2.13-3.6.0.tgz
cd kafka_2.13-3.6.0

# راه‌اندازی Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties &

# راه‌اندازی Kafka
bin/kafka-server-start.sh config/server.properties &
```

### 2. راه‌اندازی Backend Services

#### ایجاد Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# یا
venv\Scripts\activate  # Windows
```

#### نصب Dependencies

```bash
pip install -r shared/requirements.txt
pip install -r data-ingestion-service/requirements.txt
pip install -r ml-inference-service/requirements.txt
pip install -r alert-service/requirements.txt
# ... و سایر سرویس‌ها
```

#### تنظیم Environment Variables

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

#### راه‌اندازی سرویس‌ها

در ترمینال‌های جداگانه:

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

# Terminal 10: Edge Computing Service (اختیاری)
cd backend/edge-computing-service
uvicorn main:app --host 0.0.0.0 --port 8009 --reload

# Terminal 11: ERP Integration Service (اختیاری)
cd backend/erp-integration-service
uvicorn main:app --host 0.0.0.0 --port 8010 --reload
```

#### استفاده از اسکریپت راه‌اندازی

```bash
# Linux/Mac
chmod +x scripts/start_backend.sh
./scripts/start_backend.sh

# Windows PowerShell
.\scripts\start_backend.ps1
```

### 3. راه‌اندازی Database Migrations

```bash
cd backend
alembic upgrade head
```

### 4. راه‌اندازی Initial Data

```bash
cd backend/shared
python init_db.py
```

---

## <a name="manual-frontend"></a>🎨 راه‌اندازی دستی Frontend

### 1. نصب Dependencies

```bash
cd frontend/web
npm install
```

### 2. تنظیم API URL

ویرایش فایل `frontend/web/src/api/client.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

یا ایجاد فایل `.env` در `frontend/web/`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 3. راه‌اندازی Development Server

```bash
npm run dev
```

Frontend در آدرس زیر در دسترس خواهد بود:
- **Development**: http://localhost:5173 (پورت پیش‌فرض Vite)

### 4. Build برای Production

```bash
npm run build
npm run preview  # برای تست build
```

---

## <a name="service-urls"></a>🌐 آدرس‌های سرویس‌ها

### Backend Services

| سرویس | پورت | آدرس | توضیحات |
|-------|------|------|---------|
| **API Gateway** | 8000 | http://localhost:8000 | نقطه ورود اصلی API |
| Auth Service | 8001 | http://localhost:8001 | احراز هویت و مدیریت کاربران |
| Data Ingestion | 8002 | http://localhost:8002 | دریافت داده از سنسورها |
| ML Inference | 8003 | http://localhost:8003 | مدل‌های ML و پیش‌بینی |
| Alert Service | 8004 | http://localhost:8004 | مدیریت هشدارها |
| Reporting Service | 8005 | http://localhost:8005 | گزارش‌گیری |
| Command Control | 8006 | http://localhost:8006 | کنترل و فرمان‌ها |
| Tag Catalog | 8007 | http://localhost:8007 | کاتالوگ تگ‌ها |
| Digital Twin | 8008 | http://localhost:8008 | شبیه‌سازی و 3D BIM |
| Edge Computing | 8009 | http://localhost:8009 | پردازش لبه |
| ERP Integration | 8010 | http://localhost:8010 | یکپارچگی ERP |

### Frontend

| محیط | آدرس | توضیحات |
|------|------|---------|
| Development | http://localhost:5173 | Vite Dev Server |
| Production | http://localhost:3000 | Build شده (پس از `npm run build`) |

### Infrastructure Services

| سرویس | پورت | آدرس | توضیحات |
|-------|------|------|---------|
| PostgreSQL | 5432 | localhost:5432 | دیتابیس اصلی |
| TimescaleDB | 5433 | localhost:5433 | دیتابیس سری زمانی |
| Redis | 6379 | localhost:6379 | Cache و Session |
| Kafka | 9092 | localhost:9092 | Message Broker |
| Zookeeper | 2181 | localhost:2181 | Kafka Coordination |

### API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## <a name="testing"></a>✅ تست و بررسی

### 1. بررسی سلامت سرویس‌ها

```bash
# بررسی API Gateway
curl http://localhost:8000/health

# بررسی سایر سرویس‌ها
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
# ...
```

### 2. تست احراز هویت

```bash
# ثبت‌نام کاربر جدید
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@ogim.local",
    "password": "Admin@123",
    "role": "system_admin"
  }'

# ورود
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123"
  }'
```

### 3. تست Frontend

1. باز کردن مرورگر: http://localhost:5173
2. ورود با کاربر پیش‌فرض:
   - **Username**: `admin`
   - **Password**: `Admin@123`

### 4. تست Data Ingestion

```bash
# ارسال داده سنسور
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

## <a name="troubleshooting"></a>🔍 مشکلات رایج

### مشکل: سرویس‌ها راه‌اندازی نمی‌شوند

**راه‌حل:**
1. بررسی لاگ‌ها: `docker-compose logs [service-name]`
2. بررسی پورت‌ها: اطمینان حاصل کنید که پورت‌ها در دسترس هستند
3. بررسی دیتابیس: اطمینان حاصل کنید که PostgreSQL و TimescaleDB در حال اجرا هستند

### مشکل: Frontend به Backend متصل نمی‌شود

**راه‌حل:**
1. بررسی `VITE_API_BASE_URL` در `.env`
2. بررسی CORS settings در Backend
3. بررسی اینکه API Gateway در حال اجرا است

### مشکل: خطای Database Connection

**راه‌حل:**
1. بررسی `DATABASE_URL` در `.env`
2. بررسی اینکه PostgreSQL در حال اجرا است
3. بررسی credentials و permissions

### مشکل: Kafka Connection Error

**راه‌حل:**
1. بررسی اینکه Zookeeper و Kafka در حال اجرا هستند
2. بررسی `KAFKA_BOOTSTRAP_SERVERS` در `.env`
3. بررسی network connectivity

---

## 📚 منابع بیشتر

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Installation Guide](./docs/INSTALLATION.md)
- [Configuration Guide](./docs/CONFIGURATION.md)
- [Developer Guide](./docs/DEVELOPER_GUIDE.md)

---

## 🚀 دسترسی سریع

### راه‌اندازی کامل با یک دستور (Docker)

```bash
# Backend
docker-compose -f docker-compose.dev.yml up -d

# Frontend
cd frontend/web && npm install && npm run dev
```

### آدرس‌های مهم

- **Dashboard**: http://localhost:5173
- **API Gateway**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Default User**: `admin` / `Admin@123`

---

**نسخه:** 1.0.0  
**به‌روزرسانی:** دسامبر 2025

