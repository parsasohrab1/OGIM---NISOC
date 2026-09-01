# ✅ امنیت لایه Gateway

## 📊 خلاصه پیاده‌سازی

امنیت پیشرفته لایه Gateway با موفقیت پیاده‌سازی شد:
- ✅ Rate Limiting سخت‌گیرانه‌تر با استراتژی‌های مختلف
- ✅ mTLS (Mutual TLS) برای ارتباطات بین میکروسرویس‌ها

## 🛡️ Rate Limiting

### ویژگی‌های پیاده‌سازی شده

1. **Sliding Window** (پیش‌فرض)
   - استفاده از Redis sorted set
   - حذف خودکار درخواست‌های قدیمی
   - دقیق‌تر از fixed window

2. **Token Bucket**
   - Refill rate قابل تنظیم
   - پشتیبانی از burst
   - مناسب برای ترافیک متغیر

3. **Per-Service Limits**
   - محدودیت‌های مختلف برای هر سرویس
   - Auth: 10 requests/minute (سخت‌گیرانه‌تر)
   - Data Ingestion: 1000 requests/minute

4. **Per-User Limits**
   - محدودیت‌های مختلف بر اساس نقش کاربر
   - System Admin: 500 requests/minute
   - Viewer: 100 requests/minute

### Response Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1633024800
Retry-After: 60
```

## 🔐 mTLS (Mutual TLS)

### ویژگی‌های پیاده‌سازی شده

1. **Certificate Management**
   - CA Certificate
   - Client Certificate
   - Server Certificate
   - Automatic verification

2. **SSL Context Creation**
   - Automatic SSL context creation
   - Server certificate verification
   - Client certificate authentication

3. **httpx Integration**
   - Seamless integration with httpx
   - Automatic certificate loading
   - Configurable verification

## 📁 فایل‌های ایجاد شده

### Backend
- `backend/shared/advanced_rate_limiter.py` - Rate Limiter پیشرفته
- `backend/shared/mtls_manager.py` - مدیریت mTLS
- `backend/api-gateway/main.py` - به‌روزرسانی شده با Rate Limiting و mTLS

### Scripts
- `scripts/generate_mtls_certs.sh` - تولید گواهینامه‌ها (Linux/Mac)
- `scripts/generate_mtls_certs.ps1` - تولید گواهینامه‌ها (Windows)

### Documentation
- `docs/GATEWAY_SECURITY.md` - مستندات کامل

## ⚙️ پیکربندی

### Rate Limiting
```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REDIS_URL=redis://localhost:6379
RATE_LIMIT_STRATEGY=sliding_window  # or token_bucket
```

### mTLS
```bash
MTLS_ENABLED=true
MTLS_CERT_DIR=./backend/certs
MTLS_CA_CERT_PATH=./backend/certs/ca.crt
MTLS_CLIENT_CERT_PATH=./backend/certs/client.crt
MTLS_CLIENT_KEY_PATH=./backend/certs/client.key
MTLS_VERIFY_SERVER=true
```

## 🚀 استفاده

### تولید گواهینامه‌های mTLS

**Linux/Mac:**
```bash
chmod +x scripts/generate_mtls_certs.sh
./scripts/generate_mtls_certs.sh
```

**Windows:**
```powershell
.\scripts\generate_mtls_certs.ps1
```

### راه‌اندازی Redis (برای Rate Limiting)
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### راه‌اندازی API Gateway
```bash
cd backend/api-gateway
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📊 Rate Limit Configuration

### Per-Service Limits
- **default**: 100 requests/minute
- **auth**: 10 requests/minute (سخت‌گیرانه‌تر)
- **command-control**: 50 requests/minute
- **ml-inference**: 200 requests/minute
- **data-ingestion**: 1000 requests/minute

### Per-User Limits
- **system_admin**: 500 requests/minute
- **data_engineer**: 300 requests/minute
- **field_operator**: 200 requests/minute
- **viewer**: 100 requests/minute

## ✅ وضعیت

- ✅ Rate Limiting سخت‌گیرانه‌تر پیاده‌سازی شد
- ✅ mTLS برای ارتباطات بین میکروسرویس‌ها اضافه شد
- ✅ Certificate management ایجاد شد
- ✅ Scripts برای تولید گواهینامه‌ها اضافه شد
- ✅ مستندات کامل نوشته شد

## 📝 نکات

- Rate limiting در production باید با Redis باشد
- mTLS در development می‌تواند غیرفعال باشد
- Certificates باید در secrets management ذخیره شوند
- Regular certificate rotation ضروری است
- Monitor rate limit violations برای تشخیص حملات

