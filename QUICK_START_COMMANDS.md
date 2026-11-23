# ⚡ Quick OGIM Run Commands

## 🚀 One-click run (Recommended)

```powershell
.\start_dashboard.ps1
```

---

## 📦 Manual run

### Backend Services

```powershell
# API Gateway
cd backend/api-gateway
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Auth Service
cd backend/auth-service
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Data Ingestion
cd backend/data-ingestion-service
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# ML Inference
cd backend/ml-inference-service
python -m uvicorn main:app --host 0.0.0.0 --port 8003 --reload

# Alert Service
cd backend/alert-service
python -m uvicorn main:app --host 0.0.0.0 --port 8004 --reload

# Reporting
cd backend/reporting-service
python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload

# Command Control
cd backend/command-control-service
python -m uvicorn main:app --host 0.0.0.0 --port 8006 --reload

# Tag Catalog
cd backend/tag-catalog-service
python -m uvicorn main:app --host 0.0.0.0 --port 8007 --reload

# Digital Twin
cd backend/digital-twin-service
python -m uvicorn main:app --host 0.0.0.0 --port 8008 --reload

# Edge Computing
cd backend/edge-computing-service
python -m uvicorn main:app --host 0.0.0.0 --port 8009 --reload

# ERP Integration
cd backend/erp-integration-service
python -m uvicorn main:app --host 0.0.0.0 --port 8010 --reload

# DVR Service
cd backend/dvr-service
python -m uvicorn main:app --host 0.0.0.0 --port 8011 --reload

# Remote Operations
cd backend/remote-operations-service
python -m uvicorn main:app --host 0.0.0.0 --port 8012 --reload

# Data Variables
cd backend/data-variables-service
python -m uvicorn main:app --host 0.0.0.0 --port 8013 --reload

# Storage Optimization
cd backend/storage-optimization-service
python -m uvicorn main:app --host 0.0.0.0 --port 8014 --reload
```

### Frontend

```powershell
cd frontend/web
npm install
npm run dev
```

---

## 🌐 Access addresses

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

**Login**: `admin` / `Admin@123`

---

## 📁 Project root path

```
C:\Users\asus\Documents\companies\ithub\AI\products\clones\OGIM
```

Or:

```powershell
# In PowerShell
Get-Location
# or
pwd
```

