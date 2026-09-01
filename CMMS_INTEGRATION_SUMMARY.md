# ✅ یکپارچگی با سیستم‌های نگهداری (CMMS) - خلاصه پیاده‌سازی

## 📊 خلاصه

یکپارچگی با سیستم‌های نگهداری (CMMS) برای صدور خودکار و دستی Work Order از Alertها با موفقیت پیاده‌سازی شد.

## 🎯 ویژگی‌های پیاده‌سازی شده

### 1. ایجاد خودکار Work Order
- ✅ **Auto-create for Critical Alerts**: ایجاد خودکار Work Order برای Alertهای بحرانی
- ✅ **Configurable**: قابل تنظیم از طریق environment variable
- ✅ **Background Processing**: پردازش در پس‌زمینه بدون تأثیر بر عملکرد

### 2. ایجاد دستی Work Order
- ✅ **Manual Creation**: دکمه "Create Work Order" در داشبورد Alerts
- ✅ **One-click Creation**: ایجاد با یک کلیک
- ✅ **Status Display**: نمایش Work Order ID پس از ایجاد
- ✅ **Duplicate Prevention**: جلوگیری از ایجاد Work Order تکراری

### 3. یکپارچگی با ERP Systems
- ✅ **SAP Support**: پشتیبانی از SAP
- ✅ **Oracle Support**: پشتیبانی از Oracle
- ✅ **Extensible**: قابل گسترش برای سیستم‌های دیگر

### 4. UI/UX
- ✅ **Button in Dashboard**: دکمه در صفحه Alerts
- ✅ **Visual Feedback**: نمایش Work Order ID
- ✅ **Loading States**: نمایش وضعیت در حال ایجاد
- ✅ **Error Handling**: مدیریت خطاها

## 📁 فایل‌های ایجاد/به‌روزرسانی شده

### Backend
- `backend/alert-service/main.py` - به‌روزرسانی شده (endpoint جدید)
- `backend/erp-integration-service/main.py` - موجود (endpoint auto-create)

### Frontend
- `frontend/web/src/pages/Alerts.tsx` - به‌روزرسانی شده (دکمه و منطق)
- `frontend/web/src/pages/Alerts.css` - به‌روزرسانی شده (استایل دکمه)
- `frontend/web/src/api/services.ts` - به‌روزرسانی شده (API client)

## 🔌 API Endpoints

### ایجاد Work Order از Alert
```
POST /api/alert/alerts/{alert_id}/create-work-order?erp_type=sap
```

**Response:**
```json
{
  "message": "Work order created successfully",
  "work_order_id": "SAP-WO-20250115103045",
  "erp_system": "SAP",
  "status": "created",
  "alert_id": "ALERT-001"
}
```

### ایجاد خودکار (از Alert Service)
```
POST /api/erp-integration/work-orders/auto-create?alert_id={alert_id}&erp_type=sap
```

## 🎨 UI Components

### دکمه Create Work Order
- **Location**: در صفحه Alerts، کنار دکمه‌های Acknowledge و Resolve
- **Style**: Gradient purple background
- **Behavior**: 
  - نمایش فقط برای Alertهایی که Work Order ندارند
  - نمایش "Creating..." در حین ایجاد
  - نمایش Work Order ID پس از ایجاد موفق

### Work Order Info Panel
- **Location**: در Alert Card
- **Content**: نمایش Work Order ID
- **Style**: Purple border و background

## ⚙️ پیکربندی

### Environment Variables
```bash
# فعال‌سازی یکپارچگی ERP
ERP_INTEGRATION_ENABLED=true

# URL سرویس ERP
ERP_SERVICE_URL=http://erp-integration-service:8010

# سیستم ERP پیش‌فرض
ERP_DEFAULT_SYSTEM=sap  # sap, oracle, maximo

# ایجاد خودکار برای Alertهای بحرانی
ERP_AUTO_CREATE_WORK_ORDERS=false  # true برای فعال‌سازی
```

### اتصال به ERP System
```bash
POST /api/erp-integration/erp/connect
{
  "erp_type": "sap",
  "base_url": "https://sap.example.com",
  "username": "user",
  "password": "pass",
  "client_id": "client123",
  "client_secret": "secret123"
}
```

## 🔄 جریان کار

### ایجاد خودکار
```
Alert Created (Critical)
    │
    ▼
Check ERP_AUTO_CREATE_WORK_ORDERS
    │
    ▼
Call ERP Service
    │
    ▼
Create Work Order in SAP/Oracle
    │
    ▼
Link Work Order ID to Alert
    │
    ▼
Update Alert.erp_work_order_id
```

### ایجاد دستی
```
User clicks "Create Work Order"
    │
    ▼
Check if Work Order exists
    │
    ▼
Call Alert Service endpoint
    │
    ▼
Alert Service calls ERP Service
    │
    ▼
Create Work Order
    │
    ▼
Update Alert and return Work Order ID
    │
    ▼
Display in UI
```

## 📊 داده‌های Work Order

### Work Order Request
```json
{
  "alert_id": "ALERT-001",
  "equipment_id": "PUMP-001",
  "well_name": "PROD-001",
  "issue_description": "High pressure detected",
  "priority": "critical",
  "work_type": "repair",
  "estimated_duration": 120
}
```

### Work Order Response
```json
{
  "work_order_id": "SAP-WO-20250115103045",
  "erp_system": "SAP",
  "status": "created",
  "created_at": "2025-01-15T10:30:45Z",
  "erp_reference": "WOSAP-WO-20250115103045",
  "message": "Work order created successfully in SAP"
}
```

## ✅ وضعیت

- ✅ Endpoint ایجاد Work Order در Alert Service
- ✅ یکپارچگی با ERP Service
- ✅ دکمه در داشبورد Alerts
- ✅ API client در frontend
- ✅ استایل‌های CSS
- ✅ مدیریت خطاها
- ✅ نمایش Work Order ID
- ✅ جلوگیری از ایجاد تکراری
- ✅ ایجاد خودکار برای Alertهای بحرانی (قابل تنظیم)

## 🎯 استفاده

### ایجاد دستی Work Order
1. به صفحه Alerts بروید
2. Alert مورد نظر را پیدا کنید
3. روی دکمه "Create Work Order" کلیک کنید
4. Work Order ID نمایش داده می‌شود

### فعال‌سازی ایجاد خودکار
```bash
# در .env یا environment variables
ERP_AUTO_CREATE_WORK_ORDERS=true
ERP_DEFAULT_SYSTEM=sap
```

### اتصال به ERP System
```bash
# ابتدا باید به ERP System متصل شوید
POST /api/erp-integration/erp/connect
{
  "erp_type": "sap",
  "base_url": "https://sap.example.com",
  ...
}
```

## 📝 نکات

- Work Order فقط یک بار برای هر Alert ایجاد می‌شود
- در صورت وجود Work Order، دکمه نمایش داده نمی‌شود
- ایجاد خودکار فقط برای Alertهای بحرانی فعال می‌شود (اگر تنظیم شده باشد)
- می‌توانید سیستم ERP را از طریق query parameter انتخاب کنید (sap, oracle)

## 🔍 Troubleshooting

### Work Order ایجاد نمی‌شود
1. بررسی کنید که ERP Service در حال اجرا است
2. بررسی کنید که به ERP System متصل شده‌اید
3. بررسی لاگ‌های Alert Service و ERP Service

### دکمه نمایش داده نمی‌شود
1. بررسی کنید که Alert دارای Work Order نیست
2. بررسی کنید که Alert در وضعیت open یا acknowledged است

### خطای Timeout
- بررسی کنید که ERP Service قابل دسترسی است
- Timeout به صورت پیش‌فرض 30 ثانیه است

