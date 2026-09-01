# 📥 راهنمای نصب و راه‌اندازی OGIM

## 📋 فهرست مطالب

1. [پیش‌نیازها](#prerequisites)
2. [نصب با Docker Compose](#docker-compose)
3. [نصب دستی](#manual-installation)
4. [تنظیمات اولیه](#initial-configuration)
5. [راه‌اندازی سرویس‌ها](#starting-services)
6. [تست نصب](#testing-installation)
7. [عیب‌یابی](#troubleshooting)

---

## <a name="prerequisites"></a>🔧 پیش‌نیازها

### نرم‌افزارهای مورد نیاز

#### Backend
- **Python** 3.10 یا بالاتر
- **pip** (Python package manager)
- **PostgreSQL** 14+
- **Redis** 7+
- **Apache Kafka** 3.0+
- **Docker** (اختیاری اما توصیه می‌شود)
- **Docker Compose** (اختیاری)

#### Frontend
- **Node.js** 18+ (LTS)
- **npm** 9+ یا **yarn** 1.22+

#### Infrastructure (برای Production)
- **Kubernetes** 1.25+
- **Helm** 3.0+
- **kubectl**

### بررسی نصب پیش‌نیازها

```bash
# Python
python --version  # باید 3.10+ باشد

# Node.js
node --version    # باید 18+ باشد
npm --version

# Docker
docker --version
docker-compose --version

# PostgreSQL
psql --version

# Redis
redis-cli --version
```

---

## <a name="docker-compose"></a>🐳 نصب با Docker Compose (توصیه شده)

### 1️⃣ کلون کردن پروژه

```bash
git clone https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring.git
cd OGIM---Oil-Gas-Intelligent-Monitoring
```

### 2️⃣ ایجاد فایل تنظیمات

```bash
# کپی فایل نمونه
cp .env.example .env

# ویرایش تنظیمات
nano .env  # یا vim .env
```

**محتوای `.env` نمونه:**
```bash
# Database
DATABASE_URL=postgresql://ogim_user:ogim_password@postgres:5432/ogim
TIMESCALEDB_URL=postgresql://ogim_user:ogim_password@timescaledb:5433/ogim_tsdb

# Kafka
KAFKA_BOOTSTRAP_SERVERS=kafka:9092

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]

# MLflow
MLFLOW_TRACKING_URI=http://mlflow:5000

# OPC UA
OPCUA_SERVER_URL=opc.tcp://localhost:4840

# ML Models
MODEL_STORAGE_PATH=/app/models
```

### 3️⃣ راه‌اندازی سرویس‌ها

```bash
# ساخت و اجرای تمام سرویس‌ها
docker-compose -f docker-compose.dev.yml up -d

# مشاهده logs
docker-compose -f docker-compose.dev.yml logs -f

# بررسی وضعیت
docker-compose -f docker-compose.dev.yml ps
```

### 4️⃣ مقداردهی اولیه دیتابیس

```bash
# ورود به container backend
docker-compose exec auth-service bash

# اجرای script مقداردهی
python -m backend.shared.init_db

# خروج
exit
```

### 5️⃣ دسترسی به سرویس‌ها

- **Web Portal**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MLflow UI**: http://localhost:5000

---

## <a name="manual-installation"></a>🛠️ نصب دستی (Development)

### Backend

#### 1️⃣ نصب PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
از [postgresql.org](https://www.postgresql.org/download/windows/) دانلود و نصب کنید.

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### 2️⃣ ایجاد Database

```bash
# ورود به PostgreSQL
sudo -u postgres psql

# ایجاد کاربر و database
CREATE USER ogim_user WITH PASSWORD 'ogim_password';
CREATE DATABASE ogim OWNER ogim_user;
CREATE DATABASE ogim_test OWNER ogim_user;
GRANT ALL PRIVILEGES ON DATABASE ogim TO ogim_user;
GRANT ALL PRIVILEGES ON DATABASE ogim_test TO ogim_user;
\q
```

#### 3️⃣ نصب TimescaleDB (اختیاری)

```bash
# Ubuntu/Debian
sudo apt install timescaledb-postgresql-14

# macOS
brew install timescaledb

# فعال‌سازی extension
sudo -u postgres psql -d ogim
CREATE EXTENSION IF NOT EXISTS timescaledb;
\q
```

#### 4️⃣ نصب Redis

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

#### 5️⃣ نصب Kafka (اختیاری برای development)

```bash
# دانلود Kafka
wget https://archive.apache.org/dist/kafka/3.0.0/kafka_2.13-3.0.0.tgz
tar -xzf kafka_2.13-3.0.0.tgz
cd kafka_2.13-3.0.0

# راه‌اندازی Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties &

# راه‌اندازی Kafka
bin/kafka-server-start.sh config/server.properties &
```

#### 6️⃣ نصب Backend Services

```bash
# ایجاد محیط مجازی
python -m venv venv

# فعال‌سازی
source venv/bin/activate  # Linux/macOS
# یا
venv\Scripts\activate     # Windows

# نصب وابستگی‌های shared
cd backend/shared
pip install -r requirements.txt

# مقداردهی اولیه database
python init_db.py

# نصب وابستگی‌های هر سرویس
cd ../auth-service
pip install -r requirements.txt

cd ../data-ingestion-service
pip install -r requirements.txt

# ... (سایر سرویس‌ها)
```

#### 7️⃣ راه‌اندازی Backend Services

**Terminal 1 - Auth Service:**
```bash
cd backend/auth-service
uvicorn main:app --reload --port 8001
```

**Terminal 2 - Data Ingestion Service:**
```bash
cd backend/data-ingestion-service
uvicorn main:app --reload --port 8002
```

**Terminal 3 - Alert Service:**
```bash
cd backend/alert-service
uvicorn main:app --reload --port 8003
```

**Terminal 4 - ML Inference Service:**
```bash
cd backend/ml-inference-service
uvicorn main:app --reload --port 8004
```

### Frontend

#### 1️⃣ نصب Node.js

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

**macOS:**
```bash
brew install node@18
```

**Windows:**
از [nodejs.org](https://nodejs.org) دانلود و نصب کنید.

#### 2️⃣ نصب وابستگی‌ها

```bash
cd frontend/web
npm install
```

#### 3️⃣ تنظیمات Frontend

```bash
# ایجاد فایل .env.local
cat > .env.local << EOF
VITE_API_GATEWAY_URL=http://localhost:8000
EOF
```

#### 4️⃣ راه‌اندازی Development Server

```bash
npm run dev
```

Frontend در آدرس http://localhost:3000 در دسترس خواهد بود.

---

## <a name="initial-configuration"></a>⚙️ تنظیمات اولیه

### پیکربندی محیطی

راهنمای انتخاب فایل‌های env و مدیریت secret ها در [`docs/CONFIGURATION.md`](CONFIGURATION.md) موجود است؛ قبل از اجرای سرویس‌ها، فایل مناسب (development/production) را ایجاد کنید.

### راهنمای توسعه‌دهندگان

برای فرآیند توسعه محلی، گردش کار Git و اجرای lint/test، به [`docs/DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md) مراجعه کنید.

### 1️⃣ کاربران پیش‌فرض

پس از اجرای `init_db.py`، کاربران زیر ایجاد می‌شوند:

| Username | Password | Role | توضیحات |
|----------|----------|------|---------|
| admin | Admin@123 | system_admin | مدیر سیستم |
| operator1 | Operator@123 | field_operator | اپراتور میدانی |
| engineer1 | Engineer@123 | data_engineer | مهندس داده |
| viewer1 | Viewer@123 | viewer | بیننده |

⚠️ **هشدار امنیتی**: حتماً این رمزهای عبور را در محیط production تغییر دهید!

### 2️⃣ تغییر رمز عبور

```bash
# ورود به web portal
# Settings > Change Password
```

یا از API:
```bash
curl -X POST http://localhost:8001/users/me/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"old_password": "Admin@123", "new_password": "NewSecurePassword123!"}'
```

### 3️⃣ تنظیمات MLflow

```bash
# راه‌اندازی MLflow server
mlflow server \
  --backend-store-uri sqlite:///mlflow.db \
  --default-artifact-root ./mlflow-artifacts \
  --host 0.0.0.0 \
  --port 5000
```

### 4️⃣ آموزش مدل‌های ML

سرویس `ml-inference` دیگر در هنگام راه‌اندازی مدل‌ها را آموزش نمی‌دهد. برای تولید یا به‌روزرسانی مدل‌ها:

```bash
python scripts/train_models.py --model all          # آموزش همه مدل‌ها
python scripts/train_models.py --model anomaly_detection
python scripts/train_models.py --model failure_prediction
```

> **نکته:** در محیط‌های Production مقدار `MODEL_STORAGE_PATH` را روی یک Volume پایدار نگاشت کنید تا مدل‌های آموزش‌دیده پس از ری‌استارت از بین نروند.

پس از استقرار، در صورت نیاز می‌توانید با توکن ادمین درخواست زیر را برای بارگذاری مجدد مدل‌های رجیستری اجرا کنید:

```bash
curl -X POST http://localhost:8004/models/reload \
  -H "Authorization: Bearer <SYSTEM_ADMIN_TOKEN>"
```

### 5️⃣ اجرای مهاجرت‌های پایگاه داده

سرویس‌ها دیگر جداول را هنگام استارتاپ ایجاد نمی‌کنند. پیش از اجرای سرویس‌ها، migrationها را با Alembic اعمال کنید:

```bash
cd backend
alembic upgrade head
```

> متغیر `SQLALCHEMY_DATABASE_URL` یا `DATABASE_URL` باید به پایگاه داده هدف اشاره کند.

### 6️⃣ تولید داده نمونه

```bash
cd data
python generate_sample_data.py
```

### 7️⃣ نقش‌ها و سیاست‌های دسترسی

برای آشنایی با نقش‌ها و سطح دسترسی هر سرویس، فایل [`docs/SECURITY_ROLES.md`](SECURITY_ROLES.md) را مطالعه کنید و مطمئن شوید توکن‌های تولیدی با نقش‌های مناسب استفاده می‌شوند.

### 8️⃣ Observability (Prometheus/Grafana)

برای راه‌اندازی Prometheus، Grafana و متریک‌های هر سرویس، به راهنمای [`docs/OBSERVABILITY.md`](OBSERVABILITY.md) مراجعه کنید. نمونه پیکربندی Prometheus در `infrastructure/prometheus/prometheus.yml` آماده است. دستورالعمل Tracing نیز در همان راهنما و جزئیات کامل‌تر در [`docs/TRACING.md`](TRACING.md) موجود است.

### 9️⃣ لاگ‌ها و تجمیع

فرمت JSON و نحوه‌ی ارسال لاگ‌ها به Loki یا ELK در [`docs/LOGGING.md`](LOGGING.md) آمده است. برای Dev می‌توانید از Promtail نمونه (`infrastructure/logging/promtail-config.yaml`) استفاده کنید.

### 10️⃣ تست

برای اجرای تست‌ها و مشاهده گزارش پوشش، به [`docs/TESTING.md`](TESTING.md) مراجعه کنید؛ اجرای `pytest` در پوشه `backend/` حداقل پوشش 60٪ را enforced می‌کند.

### 11️⃣ CI/CD

برای Pipeline GitHub Actions شامل lint، تست و بررسی migration به [`docs/CI_CD.md`](CI_CD.md) مراجعه کنید. این فایل نحوه‌ی پیکربندی متغیرها و اجرای دستی مراحل را توضیح می‌دهد.

### 12️⃣ Handoff

برای خلاصهٔ QA/Ops شامل پوشش تست، وضعیت pipeline و گام‌های rollout به [`docs/HANDOFF.md`](HANDOFF.md) مراجعه کنید.

---

## <a name="starting-services"></a>🚀 راه‌اندازی سرویس‌ها

### با Docker Compose

```bash
# راه‌اندازی همه سرویس‌ها
docker-compose -f docker-compose.dev.yml up -d

# راه‌اندازی یک سرویس خاص
docker-compose -f docker-compose.dev.yml up -d postgres redis

# توقف سرویس‌ها
docker-compose -f docker-compose.dev.yml down

# توقف و حذف volumes
docker-compose -f docker-compose.dev.yml down -v
```

### راه‌اندازی دستی

```bash
# استفاده از screen یا tmux برای مدیریت چندین terminal

# Terminal 1
cd backend/auth-service && uvicorn main:app --reload --port 8001

# Terminal 2
cd backend/data-ingestion-service && uvicorn main:app --reload --port 8002

# Terminal 3
cd backend/alert-service && uvicorn main:app --reload --port 8003

# Terminal 4
cd backend/ml-inference-service && uvicorn main:app --reload --port 8004

# Terminal 5
cd frontend/web && npm run dev
```

---

## <a name="testing-installation"></a>✅ تست نصب

### 1️⃣ بررسی Backend Services

```bash
# Health check برای هر سرویس
curl http://localhost:8001/health  # Auth Service
curl http://localhost:8002/health  # Data Ingestion
curl http://localhost:8003/health  # Alert Service
curl http://localhost:8004/health  # ML Inference
curl http://localhost:8004/metrics # متریک‌های Prometheus (در صورت فعال بودن)
```

### 2️⃣ تست Authentication

```bash
# دریافت token
curl -X POST http://localhost:8001/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=Admin@123"

# خروجی:
# {"access_token":"eyJ0eXAiOiJKV1QiLC...","token_type":"bearer"}
```

### 3️⃣ تست Frontend

باز کردن مرورگر: http://localhost:3000

### 4️⃣ اجرای تست‌های واحد

```bash
cd backend
pytest tests/ -v
```

---

## <a name="troubleshooting"></a>🔧 عیب‌یابی

### مشکل: Backend start نمی‌شود

```bash
# بررسی لاگ‌ها
docker-compose logs backend-service-name

# بررسی اتصال به database
psql -h localhost -U ogim_user -d ogim
```

### مشکل: Frontend به Backend متصل نمی‌شود

```bash
# بررسی تنظیمات CORS در backend/.../config.py
CORS_ORIGINS = ["http://localhost:3000"]

# بررسی .env.local در frontend
VITE_API_GATEWAY_URL=http://localhost:8000
```

### مشکل: Database connection error

```bash
# بررسی وضعیت PostgreSQL
sudo systemctl status postgresql

# بررسی اتصال
psql -h localhost -U ogim_user -d ogim -c "SELECT 1"
```

### مشکل: Port already in use

```bash
# یافتن process که از port استفاده می‌کند
# Linux/Mac
lsof -i :8000

# Windows
netstat -ano | findstr :8000

# kill کردن process
kill -9 PID  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

### مشکل: Kafka connection error

```bash
# بررسی وضعیت Kafka
docker-compose exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# ایجاد topic دستی
docker-compose exec kafka kafka-topics.sh --create \
  --topic raw-sensor-data \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

---

## 📞 دریافت کمک

اگر با مشکلی مواجه شدید:

1. لاگ‌ها را بررسی کنید
2. مستندات API را مطالعه کنید: http://localhost:8000/docs
3. Issue در GitHub باز کنید
4. به [README.md](../README.md) مراجعه کنید

---

**نسخه:** 1.0.0  
**به‌روزرسانی:** نوامبر 2025

