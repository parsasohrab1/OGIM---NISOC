# OGIM Dashboard Status

## 🚀 The dashboard is running!

### Frontend
- **Address**: http://localhost:3000
- **Status**: ✅ Running

### Backend Services

To start the Backend, choose one of the following methods:

#### Method 1: Using the script (recommended)

```powershell
.\start_dashboard.ps1
```

#### Method 2: Manually starting each service

In separate terminals:

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
```

#### Method 3: Using Docker (if Docker Desktop is installed)

```powershell
# Start Docker Desktop first
docker-compose -f docker-compose.dev.yml up -d
```

---

## 📍 Access addresses

### Frontend Dashboard
- **Development**: http://localhost:3000
- **Alternative**: http://localhost:5173

### Backend API
- **API Gateway**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Logging in
- **Username**: `admin`
- **Password**: `Admin@123`

---

## ✅ Checking status

### Checking the Frontend
```powershell
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
```

### Checking the Backend
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
```

---

## 🔧 Important notes

1. **Frontend** is running and available at http://localhost:3000
2. To make full use of the dashboard, the **Backend Services** must be started
3. If the Backend is not started, the Frontend cannot connect to the API
4. Use the `start_dashboard.ps1` script for automatic startup

---

**Update date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

