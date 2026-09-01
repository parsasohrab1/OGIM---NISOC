# 📋 راهنمای اجرای OGIM Dashboard

## 🚀 اجرای سریع (Quick Start)

### روش 1: استفاده از اسکریپت PowerShell (توصیه می‌شود)

```powershell
# در ریشه پروژه
.\start_dashboard.ps1
```

این اسکریپت به صورت خودکار:
- تمام سرویس‌های Backend را راه‌اندازی می‌کند
- Frontend را نصب و اجرا می‌کند
- همه چیز را در پنجره‌های جداگانه باز می‌کند

---

## 📦 اجرای دستی (Manual Setup)

### پیش‌نیازها

```powershell
# بررسی Python
python --version  # باید Python 3.8+ باشد

# بررسی Node.js
node --version    # باید Node.js 16+ باشد

# بررسی npm
npm --version
```

---

## 🔧 اجرای Backend Services

### 1. نصب Dependencies

```powershell
# نصب dependencies برای هر سرویس
cd backend/api-gateway
pip install -r requirements.txt
cd ../..

cd backend/auth-service
pip install -r requirements.txt
cd ../..

# تکرار برای سایر سرویس‌ها...
```

**یا به صورت یکجا:**

```powershell
# نصب dependencies برای همه سرویس‌ها
Get-ChildItem -Path backend -Recurse -Filter "requirements.txt" | ForEach-Object {
    Write-Host "Installing dependencies for $($_.DirectoryName)" -ForegroundColor Yellow
    pip install -r $_.FullName
}
```

### 2. راه‌اندازی سرویس‌ها

#### API Gateway (پورت 8000)
```powershell
cd backend/api-gateway
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Auth Service (پورت 8001)
```powershell
cd backend/auth-service
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

#### Data Ingestion Service (پورت 8002)
```powershell
cd backend/data-ingestion-service
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

#### ML Inference Service (پورت 8003)
```powershell
cd backend/ml-inference-service
python -m uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

#### Alert Service (پورت 8004)
```powershell
cd backend/alert-service
python -m uvicorn main:app --host 0.0.0.0 --port 8004 --reload
```

#### Reporting Service (پورت 8005)
```powershell
cd backend/reporting-service
python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload
```

#### Command Control Service (پورت 8006)
```powershell
cd backend/command-control-service
python -m uvicorn main:app --host 0.0.0.0 --port 8006 --reload
```

#### Tag Catalog Service (پورت 8007)
```powershell
cd backend/tag-catalog-service
python -m uvicorn main:app --host 0.0.0.0 --port 8007 --reload
```

#### Digital Twin Service (پورت 8008)
```powershell
cd backend/digital-twin-service
python -m uvicorn main:app --host 0.0.0.0 --port 8008 --reload
```

#### Edge Computing Service (پورت 8009)
```powershell
cd backend/edge-computing-service
python -m uvicorn main:app --host 0.0.0.0 --port 8009 --reload
```

#### ERP Integration Service (پورت 8010)
```powershell
cd backend/erp-integration-service
python -m uvicorn main:app --host 0.0.0.0 --port 8010 --reload
```

#### DVR Service (پورت 8011)
```powershell
cd backend/dvr-service
python -m uvicorn main:app --host 0.0.0.0 --port 8011 --reload
```

#### Remote Operations Service (پورت 8012)
```powershell
cd backend/remote-operations-service
python -m uvicorn main:app --host 0.0.0.0 --port 8012 --reload
```

#### Data Variables Service (پورت 8013)
```powershell
cd backend/data-variables-service
python -m uvicorn main:app --host 0.0.0.0 --port 8013 --reload
```

#### Storage Optimization Service (پورت 8014)
```powershell
cd backend/storage-optimization-service
python -m uvicorn main:app --host 0.0.0.0 --port 8014 --reload
```

---

## 🎨 اجرای Frontend

### 1. نصب Dependencies

```powershell
cd frontend/web
npm install
```

### 2. راه‌اندازی Development Server

```powershell
npm run dev
```

Frontend روی پورت **5173** اجرا می‌شود.

---

## 📍 آدرس‌های دسترسی

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

## 🔐 اطلاعات ورود پیش‌فرض

```
Username: admin
Password: Admin@123
```

---

## 🗂️ ساختار پروژه

```
OGIM/
├── backend/                    # سرویس‌های Backend
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
│   └── shared/                # کدهای مشترک
├── frontend/                   # Frontend Application
│   └── web/                   # React/Vite Application
├── scripts/                   # اسکریپت‌های کمکی
├── docs/                      # مستندات
└── start_dashboard.ps1        # اسکریپت راه‌اندازی
```

---

## ⚙️ تنظیمات Environment Variables

### فایل `.env` (در ریشه پروژه)

```env
# Database
DATABASE_URL=postgresql://ogim_user:ogim_password@localhost:5432/ogim
TIMESCALE_URL=postgresql://ogim_user:ogim_password@localhost:5432/ogim_tsdb

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Service URLs (برای local development)
SERVICE_HOST=localhost

# ERP Integration
ERP_INTEGRATION_ENABLED=true
ERP_SERVICE_URL=http://localhost:8010
ERP_DEFAULT_SYSTEM=sap
ERP_AUTO_CREATE_WORK_ORDERS=false

# MQTT (اختیاری)
MQTT_ENABLED=false
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883

# LoRaWAN (اختیاری)
LORAWAN_ENABLED=false
LORAWAN_NETWORK_TYPE=ttn
```

---

## 🛠️ دستورات مفید

### بررسی وضعیت سرویس‌ها

```powershell
# بررسی پورت‌های در حال استفاده
netstat -ano | findstr ":8000 :8001 :8002 :5173"

# بررسی فرآیندهای Python
Get-Process | Where-Object {$_.ProcessName -like "*python*"}

# بررسی فرآیندهای Node
Get-Process | Where-Object {$_.ProcessName -eq "node"}
```

### توقف سرویس‌ها

```powershell
# توقف تمام فرآیندهای Python (Backend)
Get-Process python | Stop-Process

# توقف تمام فرآیندهای Node (Frontend)
Get-Process node | Stop-Process

# یا توقف بر اساس پورت
netstat -ano | findstr ":8000" | ForEach-Object {
    $pid = ($_ -split '\s+')[-1]
    Stop-Process -Id $pid -Force
}
```

### پاکسازی و نصب مجدد

```powershell
# پاکسازی node_modules
cd frontend/web
Remove-Item -Recurse -Force node_modules
npm install

# پاکسازی Python cache
Get-ChildItem -Path backend -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force
Get-ChildItem -Path backend -Recurse -Filter "*.pyc" | Remove-Item -Force
```

---

## 📝 ترتیب راه‌اندازی (Manual)

### 1. راه‌اندازی Database (اگر استفاده می‌کنید)
```powershell
# PostgreSQL و TimescaleDB باید در حال اجرا باشند
# یا از Docker Compose استفاده کنید
docker-compose up -d postgres timescaledb
```

### 2. راه‌اندازی Kafka (اگر استفاده می‌کنید)
```powershell
# یا از Docker Compose
docker-compose up -d kafka zookeeper
```

### 3. راه‌اندازی Backend Services
```powershell
# استفاده از اسکریپت (توصیه می‌شود)
.\start_dashboard.ps1

# یا به صورت دستی (هر سرویس در ترمینال جداگانه)
```

### 4. راه‌اندازی Frontend
```powershell
cd frontend/web
npm install
npm run dev
```

---

## 🔍 Troubleshooting

### مشکل: پورت در حال استفاده است
```powershell
# پیدا کردن فرآیند استفاده‌کننده از پورت
netstat -ano | findstr ":8000"

# توقف فرآیند
Stop-Process -Id <PID> -Force
```

### مشکل: Dependencies نصب نشده
```powershell
# نصب مجدد
pip install -r requirements.txt
npm install
```

### مشکل: Database Connection Error
- بررسی کنید PostgreSQL/TimescaleDB در حال اجرا است
- بررسی کنید DATABASE_URL درست است
- بررسی کنید migrations اجرا شده‌اند

### مشکل: Frontend به Backend متصل نمی‌شود
- بررسی کنید API Gateway روی پورت 8000 در حال اجرا است
- بررسی کنید CORS settings درست است
- بررسی کنید SERVICE_HOST درست تنظیم شده است

---

## 📚 مستندات بیشتر

- `SETUP_GUIDE.md` - راهنمای کامل نصب
- `QUICK_START.md` - راهنمای سریع
- `SERVICE_URLS.md` - لیست کامل URLهای سرویس‌ها
- `docs/` - مستندات تفصیلی

---

## ✅ چک‌لیست راه‌اندازی

- [ ] Python 3.8+ نصب شده
- [ ] Node.js 16+ نصب شده
- [ ] Dependencies Backend نصب شده
- [ ] Dependencies Frontend نصب شده
- [ ] Database در حال اجرا (اگر استفاده می‌کنید)
- [ ] Kafka در حال اجرا (اگر استفاده می‌کنید)
- [ ] Backend Services راه‌اندازی شده
- [ ] Frontend راه‌اندازی شده
- [ ] دسترسی به http://localhost:5173

---

## 🎯 دستورات خلاصه

```powershell
# راه‌اندازی کامل (توصیه می‌شود)
.\start_dashboard.ps1

# یا به صورت دستی:

# Backend (در ترمینال جداگانه)
cd backend/api-gateway
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (در ترمینال جداگانه)
cd frontend/web
npm install
npm run dev
```

---

**آدرس دسترسی:** http://localhost:5173

