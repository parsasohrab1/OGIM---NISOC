# 📚 OGIM Documentation

Documentation hub for the intelligent oil and gas field monitoring system

---

## 📖 Documentation index

### 🚀 Getting started

- **[README](README.md)** - Comprehensive project guide (English)
  - Project introduction
  - Features and capabilities
  - Technologies used
  - Quick start
  - Code examples
- **[REPO_STRUCTURE](REPO_STRUCTURE.md)** - Folder structure and main parts of the project
- **[DEVELOPER_GUIDE](DEVELOPER_GUIDE.md)** - Developer guide and workflow
- **[USER_GUIDE](USER_GUIDE.md)** - End-user guide (Dashboard/Alerts/BI/3D/AR)
- **[API_REFERENCE](API_REFERENCE.md)** - Up-to-date API reference with the new endpoints
- **[PHASE3_HARDENING](PHASE3_HARDENING.md)** - Tests ≥85%, optimization, API Security, KPIs

### ⚙️ Installation and setup

- **[INSTALLATION](INSTALLATION.md)** - Complete installation and setup guide
  - Prerequisites
  - Installation with Docker Compose
  - Manual installation (Development)
  - Initial settings
  - Troubleshooting
- **[CONFIGURATION](CONFIGURATION.md)** - dev/prod profiles and Secret management

### 🏗️ Architecture

- **[ARCHITECTURE](ARCHITECTURE.md)** - System architecture
  - Architecture overview
  - System layers
  - Microservices
  - Data flow
  - Scalability
  - Security

### 📊 Data and variables

**CSV file:**
- **[variables_list.csv](../data/variables_list.csv)** - Complete list of 65+ variables in CSV format
  - Variable categories
  - Units and ranges
  - Localized names

**Data generation guide:**
- See: [data/README.md](../data/README.md)
- Data generation scripts: [data/](../data/)
  - `advanced_data_generator.py` - 6 months, 1 second
  - `generate_sample_data.py` - 1 week, 1 minute

### 🖥️ Frontend

- **[frontend/web/README.md](../frontend/web/README.md)** - Frontend guide
  - Installation and setup
  - Project structure
  - Development
  - Build and Deploy

### 🛠️ Backend

**Backend services:**

1. **Auth Service** - Authentication and authorization
   - Path: `backend/auth-service/`
   - Port: 8001
   - API Docs: http://localhost:8001/docs

2. **Data Ingestion Service** - Data ingestion
   - Path: `backend/data-ingestion-service/`
   - Port: 8002
   - API Docs: http://localhost:8002/docs

3. **ML Inference Service** - ML inference
   - Path: `backend/ml-inference-service/`
   - Port: 8004
   - API Docs: http://localhost:8004/docs

4. **Alert Service** - Alert management
   - Path: `backend/alert-service/`
   - Port: 8003
   - API Docs: http://localhost:8003/docs

5. **Command & Control Service** - Command and control
   - Path: `backend/command-control-service/`
   - Port: 8005
   - API Docs: http://localhost:8005/docs

6. **Tag Catalog Service** - Tag catalog
   - Path: `backend/tag-catalog-service/`
   - Port: 8006
   - API Docs: http://localhost:8006/docs

**Shared Modules:**
- Path: `backend/shared/`
- Includes: Database, Models, Security, Config, Logging

**Stream Processing:**
- Path: `backend/flink-jobs/`
- Apache Flink jobs for real-time processing

**Testing:**
- Path: `backend/tests/`
- Run: `pytest backend/tests/`

---

## 📚 Documentation by topic

### For developers

1. **Quick start:** [README.md](README.md)
2. **Development environment setup:** [INSTALLATION.md](INSTALLATION.md)
3. **System architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
4. **Frontend Development:** [../frontend/web/README.md](../frontend/web/README.md)
5. **Backend Development:** See `backend/*/main.py`
6. **Testing:** `backend/tests/`

### For DevOps

1. **Docker Setup:** `docker-compose.dev.yml`
2. **Kubernetes Deployment:** `infrastructure/kubernetes/`
3. **CI/CD:** `.github/workflows/backend-ci.yml`, [`CI_CD.md`](CI_CD.md)
4. **Monitoring & Metrics:** [`OBSERVABILITY.md`](OBSERVABILITY.md), rules: `infrastructure/prometheus/rules/`
5. **Logging:** [`LOGGING.md`](LOGGING.md)
6. **Tracing:** [`TRACING.md`](TRACING.md)
7. **Security Checklist:** [`SECURITY_CHECKLIST.md`](SECURITY_CHECKLIST.md)
8. **ML Operations:** [`ML_OPERATIONS.md`](ML_OPERATIONS.md)

### For Data Engineers

1. **Data Generation:** [../data/README.md](../data/README.md)
2. **Variables List:** [../data/variables_list.csv](../data/variables_list.csv)
3. **Flink Jobs:** `backend/flink-jobs/`
4. **ML Models:** `backend/ml-inference-service/mlflow_integration.py`

### For project managers

1. **Project Overview:** [README.md](README.md)
2. **System Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Rollout & Handoff:** [`HANDOFF.md`](HANDOFF.md)

---

## 🔗 Quick links

### API Documentation
- **API Gateway:** http://localhost:8000/docs
- **Auth Service:** http://localhost:8001/docs
- **Data Ingestion:** http://localhost:8002/docs
- **Alert Service:** http://localhost:8003/docs
- **ML Inference:** http://localhost:8004/docs
- **API Curated Reference:** [API_REFERENCE.md](API_REFERENCE.md)

### User interface
- **Web Portal:** http://localhost:3000
- **MLflow UI:** http://localhost:5000

### Database
- **PostgreSQL:** localhost:5432
- **TimescaleDB:** localhost:5433
- **Redis:** localhost:6379

### Message Bus
- **Kafka:** localhost:9092
- **Zookeeper:** localhost:2181

---

## 📊 Project structure

```
OGIM---Oil-Gas-Intelligent-Monitoring/
├── docs/                          # 📚 This folder
│   ├── README.md                  # Comprehensive project guide
│   ├── INSTALLATION.md            # Installation guide
│   ├── ARCHITECTURE.md            # System architecture
│   └── INDEX.md                   # This file
│
├── backend/                       # 🔧 Backend Services
│   ├── shared/                    # Shared modules
│   ├── auth-service/
│   ├── data-ingestion-service/
│   ├── ml-inference-service/
│   ├── alert-service/
│   ├── command-control-service/
│   ├── tag-catalog-service/
│   ├── reporting-service/
│   ├── digital-twin-service/
│   ├── flink-jobs/
│   └── tests/
│
├── frontend/                      # 🎨 Frontend
│   └── web/                       # React Web Portal
│
├── data/                          # 📊 Data & Scripts
│   ├── advanced_data_generator.py
│   ├── generate_sample_data.py
│   ├── variables_list.csv
│   └── README.md
│
├── infrastructure/                # 🐳 Infrastructure
│   ├── docker/
│   │   └── docker-compose.dev.yml
│   └── kubernetes/
│
├── scripts/                       # 📜 Utility Scripts
│   ├── setup_dev.sh
│   ├── setup_dev.ps1
│   ├── run_tests.sh
│   └── deploy_production.sh
│
└── README.md                      # Main README
```

---

## 🎓 Step-by-step tutorials

### 1️⃣ Using it for the first time?

1. **Read:** [README.md](README.md)
2. **Install:** [INSTALLATION.md](INSTALLATION.md)
3. **Test:** Run `generate_sample_data.py`
4. **Explore:** Open the Web Portal

### 2️⃣ Want to develop?

1. **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
2. **Backend:** `backend/shared/README.md` (if exists)
3. **Frontend:** [../frontend/web/README.md](../frontend/web/README.md)
4. **Testing:** `pytest backend/tests/`

### 3️⃣ Want to Deploy?

1. **Docker:** `docker-compose -f docker-compose.dev.yml up`
2. **Kubernetes:** `kubectl apply -f infrastructure/kubernetes/`
3. **Configuration & Secrets:** [`CONFIGURATION.md`](CONFIGURATION.md)
4. **Production Handoff:** [`HANDOFF.md`](HANDOFF.md)

---

## 🆘 Getting help

### Have a technical problem?
1. **Troubleshooting:** [INSTALLATION.md#troubleshooting](INSTALLATION.md)
2. **Issues:** [GitHub Issues](https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring/issues)
3. **API Docs:** http://localhost:8000/docs

### Have a question?
1. **README:** [README.md](README.md)
2. **GitHub Discussions:** (if enabled)
3. **Email:** Specified in the LICENSE

---

## 📝 Contributing

To contribute to the project:

1. Fork it
2. Create a feature branch
3. Commit
4. Open a Pull Request

Details in [README.md#contributing](README.md)

---

## 📄 License

MIT License - see the LICENSE file

---

## 🔄 Updates

- **v1.0.0** (November 2025): First release
  - Complete microservice architecture
  - 65+ simulated variables
  - ML Integration with MLflow
  - Stream Processing with Flink
  - React Web Portal

---

<div align="center">

**🛢️ OGIM - Oil & Gas Intelligent Monitoring**

Made with ❤️ for the Oil & Gas Industry

[GitHub](https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring) | [Issues](https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring/issues)

</div>

