# 🛢️ OGIM - Oil & Gas Intelligent Monitoring System

<div align="center">

**سیستم هوشمند نظارت و پایش میدان نفت و گاز**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-green.svg)](https://python.org)
[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-blue.svg)](https://kubernetes.io)

[English](#english) | [فارسی](#persian)

</div>

---

## <a name="persian"></a>📖 توضیحات (فارسی)

### 🆕 به‌روزرسانی‌های اخیر مستندات

- مرجع API جدید: [`API_REFERENCE.md`](API_REFERENCE.md)
- راهنمای کاربر جدید: [`USER_GUIDE.md`](USER_GUIDE.md)
- آدرس‌ها و endpointهای به‌روز: [`../SERVICE_URLS.md`](../SERVICE_URLS.md)
- Observability/APM و امنیت SIEM: [`OBSERVABILITY.md`](OBSERVABILITY.md), [`TRACING.md`](TRACING.md)

### 🎯 درباره پروژه

OGIM یک سیستم جامع و هوشمند برای نظارت، پایش و کنترل میدان‌های نفت و گاز است که با استفاده از فناوری‌های مدرن شامل:
- ✅ **یادگیری ماشین (ML)** برای تشخیص ناهنجاری و پیش‌بینی خرابی
- ✅ **پردازش جریانی (Stream Processing)** با Apache Flink
- ✅ **معماری میکروسرویس (Microservices)** با FastAPI
- ✅ **رابط کاربری مدرن (Modern UI)** با React + TypeScript
- ✅ **پایگاه داده سری زمانی (Time-Series DB)** با TimescaleDB
- ✅ **مدیریت هوشمند هشدارها (Alert Management)**
- ✅ **اتصال به SCADA/PLC** با OPC UA و Modbus

### 🏗️ معماری سیستم

```
┌─────────────────────────────────────────────────────────────────┐
│                    OGIM System Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │  SCADA/PLC   │──────▶│ Data Ingestion│──────▶│    Kafka     │  │
│  │  (OPC UA)    │      │   Service     │      │  Message Bus │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│                                                      │           │
│                                                      ▼           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Apache Flink Stream Processing                │  │
│  │  • Data Cleansing  • CEP  • Anomaly Detection           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                 ┌────────────┼────────────┐                    │
│                 ▼            ▼            ▼                    │
│        ┌──────────────┐ ┌─────────┐ ┌──────────┐             │
│        │ TimescaleDB  │ │  Alert  │ │    ML    │             │
│        │ (Time-Series)│ │ Service │ │ Inference│             │
│        └──────────────┘ └─────────┘ └──────────┘             │
│                              │                                  │
│                              ▼                                  │
│                     ┌─────────────────┐                        │
│                     │   API Gateway   │                        │
│                     └─────────────────┘                        │
│                              │                                  │
│                              ▼                                  │
│                   ┌────────────────────┐                       │
│                   │   React Web Portal │                       │
│                   └────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### 📊 داده‌های تولیدی

سیستم شامل **65+ متغیر** برای نظارت کامل میدان است:

| دسته | تعداد | شامل |
|------|-------|------|
| 🔧 فشار | 6 | Wellhead, Tubing, Casing, Separator, Line, Bottom Hole |
| 🌡️ دما | 5 | Wellhead, Separator, Line, Motor, Bearing |
| 💧 جریان | 5 | Oil, Gas, Water, Total Liquid, Injection |
| 🧪 ترکیب | 5 | Oil Cut, Water Cut, GOR, BS&W, API Gravity |
| ⚙️ پمپ | 6 | Speed, Frequency, Current, Voltage, Power, Efficiency |
| 📳 لرزش | 4 | X/Y/Z axes, Overall |
| 🚰 شیر و ولو | 4 | Choke, Wing, Master, Safety Valve |
| 📏 سطح | 4 | Separator Oil/Water, Tank, Fluid |
| 🔬 کیفیت | 5 | H2S, CO2, Salt, Viscosity, Density |
| 🌍 محیطی | 4 | Temperature, Pressure, Humidity, Wind |
| ⚡ الکتریکی | 8 | 3-Phase Voltage/Current, Power Factor, Frequency |
| 📈 عملکرد | 5 | Production Rate, Cumulative, Uptime, Efficiency |
| 🔔 وضعیت | 4 | Well, Pump, Alarm, Production Mode |

**جمع کل: 65+ متغیر**

### 🏭 چاه‌های شبیه‌سازی شده

| نام چاه | نوع | نرخ تولید | فشار پایه |
|---------|-----|-----------|-----------|
| **PROD-001** | تولیدی | 800-1500 bbl/day | 2000-3500 psi |
| **PROD-002** | تولیدی | 800-1500 bbl/day | 2000-3500 psi |
| **DEV-001** | توسعه‌ای | 500-1000 bbl/day | 1500-3000 psi |
| **OBS-001** | مشاهده‌ای | 0 bbl/day | 1000-2500 psi |

### 📂 ساختار پروژه

```
OGIM---Oil-Gas-Intelligent-Monitoring/
├── 🐳 backend/                       # Backend Microservices
│   ├── shared/                       # Shared modules (DB, Auth, Config)
│   ├── api-gateway/                  # API Gateway (NGINX/FastAPI)
│   ├── auth-service/                 # Authentication (JWT, OAuth2)
│   ├── data-ingestion-service/       # Data Ingestion (OPC UA, Kafka)
│   ├── ml-inference-service/         # ML Inference (MLflow, Sklearn)
│   ├── alert-service/                # Alert Management
│   ├── reporting-service/            # Reporting & Analytics
│   ├── command-control-service/      # Command & Control (2FA)
│   ├── tag-catalog-service/          # Tag Metadata Management
│   ├── digital-twin-service/         # Digital Twin
│   ├── flink-jobs/                   # Apache Flink Stream Processing
│   └── tests/                        # Unit & Integration Tests
│
├── 🎨 frontend/                      # Frontend Applications
│   └── web/                          # React + TypeScript Web Portal
│       ├── src/
│       │   ├── components/          # React Components
│       │   ├── pages/               # Page Components
│       │   ├── api/                 # API Clients
│       │   └── hooks/               # Custom Hooks
│       └── public/
│
├── 📊 data/                          # Generated Data & Scripts
│   ├── advanced_data_generator.py   # 6-month data generator (1 sec)
│   ├── generate_sample_data.py      # 1-week data generator (1 min)
│   ├── variables_list.csv           # Complete variables list (CSV)
│   ├── PROD-001_sample_1week.json   # Sample data (JSON)
│   ├── PROD-001_sample_1week.csv    # Sample data (CSV)
│   └── ... (other well data)
│
├── 🐳 infrastructure/                # Infrastructure as Code
│   ├── docker/
│   │   └── docker-compose.dev.yml   # Local development setup
│   └── kubernetes/                   # K8s manifests
│       ├── postgres-deployment.yaml
│       ├── timescaledb-deployment.yaml
│       ├── redis-deployment.yaml
│       └── ... (other services)
│
├── 📜 scripts/                       # Utility Scripts
│   ├── setup_dev.sh                 # Development setup (Linux/Mac)
│   ├── setup_dev.ps1                # Development setup (Windows)
│   ├── run_tests.sh                 # Run all tests
│   ├── deploy_production.sh         # Production deployment
│   ├── advanced_data_generator.py   # Data generator (main)
│   └── generate_sample_data.py      # Sample data generator
│
├── 📚 docs/                          # Documentation
│   ├── ARCHITECTURE.md              # System architecture
│   └── DEPLOYMENT.md                # Deployment guide
│
├── 📄 README.md                      # این فایل
└── 📋 requirements.txt               # Python dependencies
```

### 🚀 شروع سریع

#### پیش‌نیازها

- **Python** 3.10+
- **Node.js** 18+
- **Docker** & Docker Compose
- **PostgreSQL** 14+
- **Redis** 7+
- **Kafka** 3.0+

#### نصب و راه‌اندازی

##### 1️⃣ کلون کردن پروژه

```bash
git clone https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring.git
cd OGIM---Oil-Gas-Intelligent-Monitoring
```

##### 2️⃣ راه‌اندازی با Docker Compose (توصیه شده)

```bash
# ایجاد فایل .env
cp .env.example .env

# راه‌اندازی تمام سرویس‌ها
docker-compose -f docker-compose.dev.yml up -d

# بررسی وضعیت
docker-compose ps
```

##### 3️⃣ راه‌اندازی دستی (Development)

**Backend:**
```bash
# ایجاد محیط مجازی
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# نصب وابستگی‌ها
cd backend/shared
pip install -r requirements.txt

# مقداردهی اولیه دیتابیس
python -m init_db

# اجرای سرویس‌ها
cd ../auth-service
uvicorn main:app --reload --port 8001

cd ../data-ingestion-service
uvicorn main:app --reload --port 8002

# ... (سایر سرویس‌ها)
```

**Frontend:**
```bash
cd frontend/web
npm install
npm run dev
```

##### 4️⃣ تولید داده نمونه

```bash
# داده نمونه (1 هفته، 1 دقیقه)
cd data
python generate_sample_data.py

# داده کامل (6 ماه، 1 ثانیه)
python advanced_data_generator.py
```

### 🎯 ویژگی‌های کلیدی

#### 1. نظارت بلادرنگ (Real-Time Monitoring)
- ✅ Dashboard تعاملی با نمودارهای زنده
- ✅ بروزرسانی هر 1-10 ثانیه
- ✅ نمایش 65+ متغیر به صورت همزمان
- ✅ تاریخچه و روندها (Historical Trends)

#### 2. یادگیری ماشین (Machine Learning)
- ✅ **Anomaly Detection** با Isolation Forest
- ✅ **Failure Prediction** با Random Forest
- ✅ **Time Series Forecasting** با LSTM (شبکه‌های عصبی بازگشتی)
- ✅ مدیریت مدل‌ها با MLflow
- ✅ Training و Inference بلادرنگ
- ✅ Model versioning و A/B testing

#### 3. مدیریت هوشمند هشدارها (Alert Management)
- ✅ قوانین پویا (Dynamic Rules)
- ✅ سطوح مختلف: Info, Warning, Critical
- ✅ جلوگیری از هشدارهای تکراری (Deduplication)
- ✅ Escalation و Notification
- ✅ تاریخچه کامل هشدارها

#### 4. کنترل و فرمان (Command & Control)
- ✅ ارسال فرمان به تجهیزات
- ✅ احراز هویت دو مرحله‌ای (2FA)
- ✅ سیستم تایید و اجرا (Approval Workflow)
- ✅ Audit logging کامل
- ✅ نقش‌ها و دسترسی‌ها (RBAC)

#### 5. پردازش جریانی (Stream Processing)
- ✅ Apache Flink برای پردازش real-time
- ✅ Data cleansing و enrichment
- ✅ Complex Event Processing (CEP)
- ✅ Window operations (Tumbling, Sliding)
- ✅ Checkpointing برای fault tolerance

#### 6. اتصال به SCADA/PLC
- ✅ پروتکل OPC UA
- ✅ پروتکل Modbus TCP
- ✅ Connector قابل توسعه
- ✅ Auto-reconnection
- ✅ Data buffering

### 🔐 امنیت

- ✅ **Authentication**: JWT tokens
- ✅ **Authorization**: Role-Based Access Control (RBAC)
- ✅ **Password Hashing**: Bcrypt
- ✅ **2FA**: Two-Factor Authentication برای فرمان‌های حساس
- ✅ **Audit Logging**: ثبت تمام فعالیت‌ها
- ✅ **Rate Limiting**: محدودیت درخواست با Redis
- ✅ **CORS**: تنظیمات امن Cross-Origin

### 📊 تولید داده

#### داده نمونه (سریع - برای تست)
```bash
cd data
python generate_sample_data.py
```
- **مدت:** 1 هفته
- **تایم لپس:** 1 دقیقه
- **رکورد:** 40,320
- **حجم:** ~98 MB
- **زمان:** 3-5 دقیقه

#### داده کامل (6 ماه - طبق SRS)
```bash
cd data
python advanced_data_generator.py
```
- **مدت:** 6 ماه (180 روز)
- **تایم لپس:** 1 ثانیه ⏱️
- **رکورد:** 62,208,000
- **حجم:** ~12-15 GB (compressed)
- **زمان:** 4-8 ساعت

#### ویژگی‌های شبیه‌سازی
- ✅ کاهش تولید (Production Decline)
- ✅ چرخه‌های روزانه و هفتگی
- ✅ افزایش Water Cut (10% → 95%)
- ✅ تعمیرات دوره‌ای (هر 30 روز)
- ✅ فرسودگی تجهیزات
- ✅ شناسایی ناهنجاری
- ✅ Shutdowns و Maintenance

### 🧪 تست

```bash
# اجرای تمام تست‌ها
cd backend
pytest

# تست با coverage
pytest --cov=backend --cov-report=html

# تست یک سرویس خاص
pytest tests/test_auth_service.py -v
```

### 🚢 استقرار (Deployment)

#### Kubernetes (Production)

```bash
# ایجاد namespace
kubectl create namespace ogim

# اعمال ConfigMaps و Secrets
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/secrets.yaml

# استقرار databases
kubectl apply -f infrastructure/kubernetes/postgres-deployment.yaml
kubectl apply -f infrastructure/kubernetes/timescaledb-deployment.yaml
kubectl apply -f infrastructure/kubernetes/redis-deployment.yaml

# استقرار Kafka
kubectl apply -f infrastructure/kubernetes/kafka-deployment.yaml

# استقرار backend services
kubectl apply -f infrastructure/kubernetes/backend-deployments.yaml

# استقرار frontend
kubectl apply -f infrastructure/kubernetes/frontend-deployment.yaml

# بررسی وضعیت
kubectl get pods -n ogim
kubectl get services -n ogim
```

#### Docker Compose (Development)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 📖 API Documentation

پس از راه‌اندازی، مستندات API در آدرس‌های زیر قابل دسترسی است:

- **API Gateway:** http://localhost:8000/docs
- **Auth Service:** http://localhost:8001/docs
- **Data Ingestion:** http://localhost:8002/docs
- **Alert Service:** http://localhost:8003/docs
- **ML Inference:** http://localhost:8004/docs

### 🛠️ تکنولوژی‌ها

#### Backend
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Relational database
- **TimescaleDB** - Time-series database
- **Redis** - Cache & rate limiting
- **Apache Kafka** - Message broker
- **Apache Flink** - Stream processing
- **MLflow** - ML lifecycle management
- **Scikit-learn** - ML models
- **OPC UA** - SCADA/PLC connectivity
- **Pytest** - Testing framework

#### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Query** - Data fetching
- **Recharts** - Data visualization
- **Axios** - HTTP client

#### Infrastructure
- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **NGINX** - Reverse proxy
- **GitHub Actions** - CI/CD

### 📈 Performance

- ⚡ **Latency:** < 100ms (API responses)
- 🚀 **Throughput:** 10,000+ events/sec
- 💾 **Storage:** Time-series compression (90% savings)
- 🔄 **Uptime:** 99.9%+ (High availability)
- 📊 **Scalability:** Horizontal scaling ready

### 🤝 مشارکت

1. Fork کنید
2. Feature branch بسازید (`git checkout -b feature/AmazingFeature`)
3. تغییرات را commit کنید (`git commit -m 'Add AmazingFeature'`)
4. Push کنید (`git push origin feature/AmazingFeature`)
5. Pull Request باز کنید

### 📝 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

### 👥 نویسندگان

- **Parsa Sohrab** - [parsasohrab1](https://github.com/parsasohrab1)

### 🙏 تشکر

- Apache Software Foundation (Kafka, Flink)
- PostgreSQL & TimescaleDB teams
- FastAPI & React communities

---

## <a name="english"></a>📖 Description (English)

### 🎯 About

OGIM (Oil & Gas Intelligent Monitoring) is a comprehensive real-time monitoring, analytics, and control system for oil and gas fields, built with modern technologies including:

- ✅ **Machine Learning** for anomaly detection and failure prediction
- ✅ **Stream Processing** with Apache Flink
- ✅ **Microservices Architecture** with FastAPI
- ✅ **Modern UI** with React + TypeScript
- ✅ **Time-Series Database** with TimescaleDB
- ✅ **Intelligent Alert Management**
- ✅ **SCADA/PLC Connectivity** via OPC UA & Modbus

### 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring.git
cd OGIM---Oil-Gas-Intelligent-Monitoring

# Start with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Generate sample data
cd data
python generate_sample_data.py

# Access the web portal
# http://localhost:3000
```

### 📊 Features

- **Real-Time Monitoring** - 65+ variables tracked per second
- **Machine Learning** - Anomaly detection & failure prediction
- **Stream Processing** - Apache Flink for real-time analytics
- **Alert Management** - Intelligent alerting with deduplication
- **Command & Control** - 2FA-protected control commands
- **SCADA Integration** - OPC UA & Modbus TCP support
- **Data Generation** - Realistic 6-month datasets (62M+ records)

### 📚 Documentation

All documentation is included in this README. Additional technical details can be found in:
- `/backend/shared/` - Shared modules documentation
- `/frontend/web/README.md` - Frontend setup guide
- `/data/README.md` - Data generation guide

### 🛠️ Tech Stack

**Backend:** FastAPI, PostgreSQL, TimescaleDB, Kafka, Flink, MLflow  
**Frontend:** React, TypeScript, Vite, TanStack Query  
**Infrastructure:** Docker, Kubernetes, NGINX

### 📝 License

MIT License - see LICENSE file

---

<div align="center">

**Made with ❤️ for the Oil & Gas Industry**

⭐ Star us on GitHub | 🐛 Report Issues | 💡 Suggest Features

[GitHub](https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring) | [Documentation](#) | [Issues](https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring/issues)

</div>

---

**نسخه:** 1.0.0  
**تاریخ:** نوامبر 2025  
**وضعیت:** ✅ Production Ready
