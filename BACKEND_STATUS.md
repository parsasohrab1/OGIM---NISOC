# وضعیت Backend Services

## ⚠️ مشکل: Network Error

اگر خطای `ERR_NETWORK` یا `ERR_EMPTY_RESPONSE` دریافت می‌کنید، این یعنی سرویس‌های Backend در حال اجرا نیستند.

## 🔧 راه‌حل: راه‌اندازی سرویس‌ها

### روش 1: استفاده از اسکریپت (توصیه می‌شود)

```powershell
.\start_dashboard.ps1
```

### روش 2: راه‌اندازی دستی

هر سرویس را در یک ترمینال جداگانه راه‌اندازی کنید:

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

## ✅ بررسی وضعیت سرویس‌ها

```powershell
# بررسی پورت‌ها
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

## 📍 آدرس‌های سرویس‌ها

- **API Gateway**: http://localhost:8000
- **Auth Service**: http://localhost:8001
- **Data Ingestion**: http://localhost:8002
- **Alert Service**: http://localhost:8004

## 💡 نکات

1. **Frontend Fallback**: Frontend به صورت خودکار از mock data استفاده می‌کند اگر Backend در دسترس نباشد
2. **Auto Retry**: Frontend به صورت خودکار 2 بار تلاش می‌کند قبل از استفاده از mock data
3. **Refresh**: بعد از راه‌اندازی سرویس‌ها، صفحه Frontend را Refresh کنید

## 🔍 عیب‌یابی

اگر سرویس‌ها راه‌اندازی نمی‌شوند:

1. بررسی کنید که Python نصب است: `python --version`
2. بررسی کنید که dependencies نصب شده‌اند: `pip install -r requirements.txt`
3. بررسی کنید که پورت‌ها در حال استفاده نیستند: `netstat -ano | findstr :8000`
4. لاگ‌های خطا را در ترمینال‌های سرویس‌ها بررسی کنید

