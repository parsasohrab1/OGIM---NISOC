# وضعیت داشبورد OGIM

## 🚀 داشبورد در حال اجرا است!

### Frontend
- **آدرس**: http://localhost:3000
- **وضعیت**: ✅ در حال اجرا

### Backend Services

برای راه‌اندازی Backend، یکی از روش‌های زیر را انتخاب کنید:

#### روش 1: استفاده از اسکریپت (توصیه می‌شود)

```powershell
.\start_dashboard.ps1
```

#### روش 2: راه‌اندازی دستی هر سرویس

در ترمینال‌های جداگانه:

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

#### روش 3: استفاده از Docker (اگر Docker Desktop نصب است)

```powershell
# راه‌اندازی Docker Desktop اول
docker-compose -f docker-compose.dev.yml up -d
```

---

## 📍 آدرس‌های دسترسی

### Frontend Dashboard
- **Development**: http://localhost:3000
- **Alternative**: http://localhost:5173

### Backend API
- **API Gateway**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### ورود به سیستم
- **Username**: `admin`
- **Password**: `Admin@123`

---

## ✅ بررسی وضعیت

### بررسی Frontend
```powershell
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
```

### بررسی Backend
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
```

---

## 🔧 نکات مهم

1. **Frontend** در حال اجرا است و در آدرس http://localhost:3000 در دسترس است
2. برای استفاده کامل از داشبورد، **Backend Services** باید راه‌اندازی شوند
3. اگر Backend راه‌اندازی نشده باشد، Frontend نمی‌تواند به API متصل شود
4. از اسکریپت `start_dashboard.ps1` برای راه‌اندازی خودکار استفاده کنید

---

**تاریخ به‌روزرسانی**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

