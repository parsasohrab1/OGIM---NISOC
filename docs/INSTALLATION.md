# 📥 OGIM Installation and Setup Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation with Docker Compose](#docker-compose)
3. [Manual installation](#manual-installation)
4. [Initial configuration](#initial-configuration)
5. [Starting the services](#starting-services)
6. [Testing the installation](#testing-installation)
7. [Troubleshooting](#troubleshooting)

---

## <a name="prerequisites"></a>🔧 Prerequisites

### Required software

#### Backend
- **Python** 3.10 or higher
- **pip** (Python package manager)
- **PostgreSQL** 14+
- **Redis** 7+
- **Apache Kafka** 3.0+
- **Docker** (optional but recommended)
- **Docker Compose** (optional)

#### Frontend
- **Node.js** 18+ (LTS)
- **npm** 9+ or **yarn** 1.22+

#### Infrastructure (for Production)
- **Kubernetes** 1.25+
- **Helm** 3.0+
- **kubectl**

### Verifying the prerequisites

```bash
# Python
python --version  # must be 3.10+

# Node.js
node --version    # must be 18+
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

## <a name="docker-compose"></a>🐳 Installation with Docker Compose (recommended)

### 1️⃣ Cloning the project

```bash
git clone https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring.git
cd OGIM---Oil-Gas-Intelligent-Monitoring
```

### 2️⃣ Creating the configuration file

```bash
# Copy the sample file
cp .env.example .env

# Edit the settings
nano .env  # or vim .env
```

**Sample `.env` contents:**
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

### 3️⃣ Starting the services

```bash
# Build and run all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Check the status
docker-compose -f docker-compose.dev.yml ps
```

### 4️⃣ Initializing the database

```bash
# Enter the backend container
docker-compose exec auth-service bash

# Run the initialization script
python -m backend.shared.init_db

# Exit
exit
```

### 5️⃣ Accessing the services

- **Web Portal**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MLflow UI**: http://localhost:5000

---

## <a name="manual-installation"></a>🛠️ Manual installation (Development)

### Backend

#### 1️⃣ Installing PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/).

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### 2️⃣ Creating the Database

```bash
# Log in to PostgreSQL
sudo -u postgres psql

# Create the user and database
CREATE USER ogim_user WITH PASSWORD 'ogim_password';
CREATE DATABASE ogim OWNER ogim_user;
CREATE DATABASE ogim_test OWNER ogim_user;
GRANT ALL PRIVILEGES ON DATABASE ogim TO ogim_user;
GRANT ALL PRIVILEGES ON DATABASE ogim_test TO ogim_user;
\q
```

#### 3️⃣ Installing TimescaleDB (optional)

```bash
# Ubuntu/Debian
sudo apt install timescaledb-postgresql-14

# macOS
brew install timescaledb

# Enable the extension
sudo -u postgres psql -d ogim
CREATE EXTENSION IF NOT EXISTS timescaledb;
\q
```

#### 4️⃣ Installing Redis

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

#### 5️⃣ Installing Kafka (optional for development)

```bash
# Download Kafka
wget https://archive.apache.org/dist/kafka/3.0.0/kafka_2.13-3.0.0.tgz
tar -xzf kafka_2.13-3.0.0.tgz
cd kafka_2.13-3.0.0

# Start Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties &

# Start Kafka
bin/kafka-server-start.sh config/server.properties &
```

#### 6️⃣ Installing the Backend Services

```bash
# Create a virtual environment
python -m venv venv

# Enable
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows

# Install the shared dependencies
cd backend/shared
pip install -r requirements.txt

# Initialize the database
python init_db.py

# Install the dependencies of each service
cd ../auth-service
pip install -r requirements.txt

cd ../data-ingestion-service
pip install -r requirements.txt

# ... (other services)
```

#### 7️⃣ Starting the Backend Services

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

#### 1️⃣ Installing Node.js

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
Download and install from [nodejs.org](https://nodejs.org).

#### 2️⃣ Installing the dependencies

```bash
cd frontend/web
npm install
```

#### 3️⃣ Frontend settings

```bash
# Create the .env.local file
cat > .env.local << EOF
VITE_API_GATEWAY_URL=http://localhost:8000
EOF
```

#### 4️⃣ Starting the Development Server

```bash
npm run dev
```

The Frontend will be available at http://localhost:3000.

---

## <a name="initial-configuration"></a>⚙️ Initial configuration

### Environment configuration

A guide to choosing env files and managing secrets is available in [`docs/CONFIGURATION.md`](CONFIGURATION.md); before running the services, create the appropriate file (development/production).

### Developer guide

For the local development process, the Git workflow and running lint/test, see [`docs/DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md).

### 1️⃣ Default users

After running `init_db.py`, the following users are created:

| Username | Password | Role | Description |
|----------|----------|------|---------|
| admin | Admin@123 | system_admin | System administrator |
| operator1 | Operator@123 | field_operator | Field operator |
| engineer1 | Engineer@123 | data_engineer | Data engineer |
| viewer1 | Viewer@123 | viewer | Viewer |

⚠️ **Security warning**: Be sure to change these passwords in the production environment!

### 2️⃣ Changing the password

```bash
# Log in to the web portal
# Settings > Change Password
```

Or from the API:
```bash
curl -X POST http://localhost:8001/users/me/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"old_password": "Admin@123", "new_password": "NewSecurePassword123!"}'
```

### 3️⃣ MLflow settings

```bash
# Start the MLflow server
mlflow server \
  --backend-store-uri sqlite:///mlflow.db \
  --default-artifact-root ./mlflow-artifacts \
  --host 0.0.0.0 \
  --port 5000
```

### 4️⃣ Training the ML models

The `ml-inference` service no longer trains models on startup. To generate or update models:

```bash
python scripts/train_models.py --model all          # train all models
python scripts/train_models.py --model anomaly_detection
python scripts/train_models.py --model failure_prediction
```

> **Note:** In Production environments, map `MODEL_STORAGE_PATH` to a persistent Volume so that the trained models are not lost after a restart.

After deployment, if needed, you can run the following request with an admin token to reload the registry models:

```bash
curl -X POST http://localhost:8004/models/reload \
  -H "Authorization: Bearer <SYSTEM_ADMIN_TOKEN>"
```

### 5️⃣ Running the database migrations

The services no longer create the tables at startup. Before running the services, apply the migrations with Alembic:

```bash
cd backend
alembic upgrade head
```

> The `SQLALCHEMY_DATABASE_URL` or `DATABASE_URL` variable must point to the target database.

### 6️⃣ Generating sample data

```bash
cd data
python generate_sample_data.py
```

### 7️⃣ Roles and access policies

To learn about the roles and access level of each service, read [`docs/SECURITY_ROLES.md`](SECURITY_ROLES.md) and make sure production tokens are used with appropriate roles.

### 8️⃣ Observability (Prometheus/Grafana)

To set up Prometheus, Grafana and the metrics of each service, see the guide [`docs/OBSERVABILITY.md`](OBSERVABILITY.md). A sample Prometheus configuration is ready in `infrastructure/prometheus/prometheus.yml`. The Tracing instructions are also in the same guide, with more complete details in [`docs/TRACING.md`](TRACING.md).

### 9️⃣ Logs and aggregation

The JSON format and how to ship logs to Loki or ELK are described in [`docs/LOGGING.md`](LOGGING.md). For Dev you can use the sample Promtail (`infrastructure/logging/promtail-config.yaml`).

### 10️⃣ Testing

To run the tests and view the coverage report, see [`docs/TESTING.md`](TESTING.md); running `pytest` in the `backend/` folder enforces a minimum coverage of 60%.

### 11️⃣ CI/CD

For the GitHub Actions Pipeline including lint, tests and migration check, see [`docs/CI_CD.md`](CI_CD.md). This file explains how to configure the variables and run the steps manually.

### 12️⃣ Handoff

For a QA/Ops summary including test coverage, pipeline status and rollout steps, see [`docs/HANDOFF.md`](HANDOFF.md).

---

## <a name="starting-services"></a>🚀 Starting the services

### With Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Start a specific service
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Stop the services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker-compose -f docker-compose.dev.yml down -v
```

### Manual startup

```bash
# Use screen or tmux to manage multiple terminals

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

## <a name="testing-installation"></a>✅ Testing the installation

### 1️⃣ Checking the Backend Services

```bash
# Health check for each service
curl http://localhost:8001/health  # Auth Service
curl http://localhost:8002/health  # Data Ingestion
curl http://localhost:8003/health  # Alert Service
curl http://localhost:8004/health  # ML Inference
curl http://localhost:8004/metrics # Prometheus metrics (if enabled)
```

### 2️⃣ Testing Authentication

```bash
# Get a token
curl -X POST http://localhost:8001/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=Admin@123"

# Output:
# {"access_token":"eyJ0eXAiOiJKV1QiLC...","token_type":"bearer"}
```

### 3️⃣ Testing the Frontend

Open the browser: http://localhost:3000

### 4️⃣ Running the unit tests

```bash
cd backend
pytest tests/ -v
```

---

## <a name="troubleshooting"></a>🔧 Troubleshooting

### Problem: The Backend does not start

```bash
# Check the logs
docker-compose logs backend-service-name

# Check the database connection
psql -h localhost -U ogim_user -d ogim
```

### Problem: The Frontend does not connect to the Backend

```bash
# Check the CORS settings in backend/.../config.py
CORS_ORIGINS = ["http://localhost:3000"]

# Check .env.local in the frontend
VITE_API_GATEWAY_URL=http://localhost:8000
```

### Problem: Database connection error

```bash
# Check the PostgreSQL status
sudo systemctl status postgresql

# Check the connection
psql -h localhost -U ogim_user -d ogim -c "SELECT 1"
```

### Problem: Port already in use

```bash
# Find the process using the port
# Linux/Mac
lsof -i :8000

# Windows
netstat -ano | findstr :8000

# Kill the process
kill -9 PID  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

### Problem: Kafka connection error

```bash
# Check the Kafka status
docker-compose exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# Create the topic manually
docker-compose exec kafka kafka-topics.sh --create \
  --topic raw-sensor-data \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

---

## 📞 Getting Help

If you run into a problem:

1. Check the logs
2. Read the API documentation: http://localhost:8000/docs
3. Open an Issue on GitHub
4. See [README.md](../README.md)

---

**Version:** 1.0.0
**Updated:** November 2025

