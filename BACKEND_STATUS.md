# Backend Services Status

## ⚠️ Problem: Network Error

If you get an `ERR_NETWORK` or `ERR_EMPTY_RESPONSE` error, it means the Backend services are not running.

## 🔧 Solution: Starting the services

### Method 1: Using the script (recommended)

```powershell
.\start_dashboard.ps1
```

### Method 2: Manual startup

Start each service in a separate terminal:

```powershell
# Terminal 1: API Gateway
cd backend\api-gateway
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Auth Service
cd backend\auth-service
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 3: Data Ingestion
cd backend\data-ingestion-service
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Terminal 4: Alert Service
cd backend\alert-service
python -m uvicorn main:app --host 0.0.0.0 --port 8004 --reload
```

## ✅ Checking service status

```powershell
# Check the ports
$ports = @(8000, 8001, 8002, 8004)
foreach ($port in $ports) {
    $result = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($result) {
        Write-Host "✅ Port $port - Active" -ForegroundColor Green
    } else {
        Write-Host "❌ Port $port - Not Active" -ForegroundColor Red
    }
}
```

## 📍 Service addresses

- **API Gateway**: http://localhost:8000
- **Auth Service**: http://localhost:8001
- **Data Ingestion**: http://localhost:8002
- **Alert Service**: http://localhost:8004

## 💡 Notes

1. **Frontend Fallback**: The Frontend automatically uses mock data if the Backend is unavailable
2. **Auto Retry**: The Frontend automatically retries 2 times before using mock data
3. **Refresh**: After starting the services, refresh the Frontend page

## 🔍 Troubleshooting

If the services do not start:

1. Check that Python is installed: `python --version`
2. Check that dependencies are installed: `pip install -r requirements.txt`
3. Check that the ports are not in use: `netstat -ano | findstr :8000`
4. Check the error logs in the service terminals

