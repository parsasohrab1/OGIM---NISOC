# پایداری در شرایط قطع شبکه (Offline Resilience)

این مستند راهنمای پیاده‌سازی قابلیت Data Buffering در لایه Ingestion برای زمانی که ارتباط دکل با مرکز داده قطع می‌شود.

## 📋 فهرست مطالب

1. [نمای کلی](#overview)
2. [معماری](#architecture)
3. [Offline Buffer Manager](#buffer-manager)
4. [Connection Monitor](#connection-monitor)
5. [Retry Mechanism](#retry-mechanism)
6. [تنظیمات](#configuration)
7. [نظارت و متریک‌ها](#monitoring)
8. [مثال‌های استفاده](#examples)

---

## <a name="overview"></a>🎯 نمای کلی

سیستم OGIM قابلیت **Offline Resilience** را برای حفظ داده‌ها در شرایط قطع شبکه فراهم می‌کند:

- ✅ **Data Buffering**: ذخیره‌سازی موقت داده‌ها در SQLite هنگام قطع ارتباط
- ✅ **Connection Monitoring**: تشخیص خودکار وضعیت online/offline
- ✅ **Automatic Retry**: ارسال مجدد خودکار داده‌ها پس از برقراری ارتباط
- ✅ **Capacity Management**: مدیریت ظرفیت buffer و cleanup خودکار
- ✅ **Metrics & Monitoring**: متریک‌های کامل برای نظارت

### سناریوهای استفاده

- **قطع ارتباط موقت**: داده‌ها در buffer ذخیره و پس از برقراری ارتباط ارسال می‌شوند
- **قطع ارتباط طولانی**: با مدیریت ظرفیت، قدیمی‌ترین داده‌ها حذف می‌شوند
- **خطا در ارسال**: در صورت خطا در Kafka، داده‌ها به buffer منتقل می‌شوند

---

## <a name="architecture"></a>🏗️ معماری

```
┌─────────────────────────────────────────────────────────┐
│              Data Ingestion Service                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐      ┌──────────────┐                │
│  │   Ingest     │─────▶│  Validate    │                │
│  │   Request    │      │  & Store     │                │
│  └──────────────┘      └──────────────┘                │
│                              │                           │
│                              ▼                           │
│  ┌──────────────────────────────────────┐              │
│  │     Connection Monitor               │              │
│  │  (Online/Offline Detection)          │              │
│  └──────────────────────────────────────┘              │
│         │                    │                           │
│         │ Online             │ Offline                  │
│         ▼                    ▼                           │
│  ┌──────────────┐      ┌──────────────┐                │
│  │   Kafka      │      │   Buffer     │                │
│  │   Producer   │      │   Manager    │                │
│  └──────────────┘      └──────────────┘                │
│                              │                           │
│                              ▼                           │
│                    ┌──────────────────┐                  │
│                    │  SQLite Buffer   │                  │
│                    │  (Persistent)    │                  │
│                    └──────────────────┘                  │
│                                                          │
│  ┌──────────────────────────────────────┐              │
│  │     Retry Task (Background)          │              │
│  │  (Sends buffered records when online) │              │
│  └──────────────────────────────────────┘              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## <a name="buffer-manager"></a>💾 Offline Buffer Manager

### ویژگی‌ها

- **SQLite Storage**: ذخیره‌سازی پایدار در SQLite
- **Thread-Safe**: پشتیبانی از multi-threading
- **Capacity Management**: محدودیت تعداد رکورد و حجم
- **Automatic Cleanup**: پاکسازی خودکار رکوردهای قدیمی
- **Retry Tracking**: ردیابی تعداد تلاش‌های مجدد

### API

```python
from offline_buffer import OfflineBufferManager

# Initialize
buffer = OfflineBufferManager(
    buffer_path="./data/buffer",
    max_buffer_size=100000,  # Max records
    max_buffer_size_mb=500,  # Max size in MB
    cleanup_interval=3600    # Cleanup every hour
)

# Add record
buffer.add_record(
    record_id="unique_id",
    source="sensor_source",
    data={"sensor_id": "TAG-001", "value": 123.45},
    timestamp=time.time()
)

# Get pending records
pending = buffer.get_pending_records(limit=1000)

# Mark as sent
buffer.mark_sent(record_id)

# Mark as failed
buffer.mark_failed(record_id, increment_retry=True)

# Get statistics
stats = buffer.get_buffer_stats()
```

---

## <a name="connection-monitor"></a>📡 Connection Monitor

### ویژگی‌ها

- **Multi-Target Monitoring**: نظارت بر چندین host/URL
- **Automatic Detection**: تشخیص خودکار تغییر وضعیت
- **Callback Support**: اطلاع‌رسانی هنگام تغییر وضعیت
- **Configurable Intervals**: تنظیم فاصله بررسی

### API

```python
from connection_monitor import ConnectionMonitor

# Initialize
monitor = ConnectionMonitor(
    check_interval=5,  # Check every 5 seconds
    timeout=3,         # 3 second timeout
    check_hosts=["kafka:9092", "postgres:5432"],
    check_urls=["http://api-gateway:8000"]
)

# Add callback
def on_status_change(is_online: bool):
    print(f"Status: {'ONLINE' if is_online else 'OFFLINE'}")

monitor.add_callback(on_status_change)

# Start monitoring
monitor.start_monitoring()

# Get status
status = monitor.get_status()
```

---

## <a name="retry-mechanism"></a>🔄 Retry Mechanism

### ویژگی‌ها

- **Automatic Retry**: تلاش مجدد خودکار هنگام برقراری ارتباط
- **Background Task**: اجرا در background بدون blocking
- **Retry Limits**: محدودیت تعداد تلاش‌ها
- **Exponential Backoff**: تاخیر تصاعدی بین تلاش‌ها

### جریان کار

1. **Offline Detection**: Connection Monitor وضعیت offline را تشخیص می‌دهد
2. **Buffering**: داده‌ها در SQLite ذخیره می‌شوند
3. **Online Detection**: Connection Monitor وضعیت online را تشخیص می‌دهد
4. **Retry Trigger**: Retry task به صورت خودکار فعال می‌شود
5. **Send Records**: رکوردهای buffered به Kafka ارسال می‌شوند
6. **Cleanup**: رکوردهای موفق از buffer حذف می‌شوند

---

## <a name="configuration"></a>⚙️ تنظیمات

### Environment Variables

```bash
# Enable/Disable Offline Buffer
OFFLINE_BUFFER_ENABLED=true

# Buffer Settings
OFFLINE_BUFFER_PATH=./data/buffer
OFFLINE_BUFFER_MAX_SIZE=100000        # Max number of records
OFFLINE_BUFFER_MAX_SIZE_MB=500        # Max size in MB
OFFLINE_BUFFER_CLEANUP_INTERVAL=3600  # Cleanup interval (seconds)

# Connection Monitor Settings
CONNECTION_MONITOR_ENABLED=true
CONNECTION_CHECK_INTERVAL=5           # Check every 5 seconds
CONNECTION_CHECK_TIMEOUT=3            # Connection timeout (seconds)
CONNECTION_CHECK_HOSTS=kafka:9092,postgres:5432  # Comma-separated
CONNECTION_CHECK_URLS=http://api-gateway:8000   # Comma-separated

# Retry Settings
RETRY_MAX_ATTEMPTS=10
RETRY_BACKOFF_FACTOR=2.0
RETRY_INITIAL_DELAY=1                 # Initial delay (seconds)
```

### تنظیمات پیشنهادی

#### برای محیط Production

```yaml
OFFLINE_BUFFER_ENABLED: true
OFFLINE_BUFFER_MAX_SIZE: 500000       # 500K records
OFFLINE_BUFFER_MAX_SIZE_MB: 2000      # 2GB
OFFLINE_BUFFER_CLEANUP_INTERVAL: 3600  # 1 hour

CONNECTION_MONITOR_ENABLED: true
CONNECTION_CHECK_INTERVAL: 5
CONNECTION_CHECK_TIMEOUT: 3
CONNECTION_CHECK_HOSTS: "kafka:9092,timescaledb:5432"

RETRY_MAX_ATTEMPTS: 20
```

#### برای محیط Development

```yaml
OFFLINE_BUFFER_ENABLED: true
OFFLINE_BUFFER_MAX_SIZE: 10000
OFFLINE_BUFFER_MAX_SIZE_MB: 100
OFFLINE_BUFFER_CLEANUP_INTERVAL: 1800  # 30 minutes

CONNECTION_MONITOR_ENABLED: true
CONNECTION_CHECK_INTERVAL: 10
CONNECTION_CHECK_TIMEOUT: 5
```

---

## <a name="monitoring"></a>📊 نظارت و متریک‌ها

### Prometheus Metrics

#### Buffer Metrics

```promql
# Total buffered records
ingest_buffered_records_total{source="sensor_001"}

# Retry attempts
ingest_retry_attempts_total{source="sensor_001", status="success"}
ingest_retry_attempts_total{source="sensor_001", status="failure"}

# Connection status changes
ingest_connection_status_changes_total{status="online"}
ingest_connection_status_changes_total{status="offline"}
```

#### Health Check Endpoint

```bash
GET /health

Response:
{
  "status": "healthy",
  "is_online": true,
  "buffered_records": 1234,
  "buffer_stats": {
    "total_records": 1234,
    "by_source": {"sensor_001": 800, "sensor_002": 434},
    "buffer_size_mb": 45.2,
    "buffer_usage_percent": 1.23
  },
  "connection_status": {
    "is_online": true,
    "last_check_time": 1234567890.0,
    "consecutive_failures": 0
  }
}
```

#### Buffer Statistics Endpoint

```bash
GET /buffer/stats

Response:
{
  "total_records": 1234,
  "by_source": {
    "sensor_001": 800,
    "sensor_002": 434
  },
  "by_retry_count": {
    "0": 1000,
    "1": 200,
    "2": 34
  },
  "oldest_record_age_seconds": 3600,
  "buffer_size_mb": 45.2,
  "max_buffer_size": 100000,
  "max_buffer_size_mb": 500,
  "buffer_usage_percent": 1.23
}
```

### Grafana Dashboard

پنل‌های پیشنهادی:

1. **Buffer Status**
   - Total buffered records
   - Buffer usage percentage
   - Records by source
   - Buffer size (MB)

2. **Connection Status**
   - Online/Offline status
   - Connection uptime
   - Status change events

3. **Retry Performance**
   - Retry success rate
   - Retry attempts over time
   - Average retry delay

4. **Data Loss Prevention**
   - Records buffered per minute
   - Records successfully retried
   - Records failed after max retries

### هشدارها

```yaml
# Prometheus Alert Rules
- alert: HighBufferUsage
  expr: (ingest_buffer_usage_percent) > 80
  for: 5m
  annotations:
    summary: "Buffer usage exceeds 80%"
    
- alert: ConnectionOffline
  expr: ingest_connection_status_changes_total{status="offline"} > 0
  for: 1m
  annotations:
    summary: "System is offline - data is being buffered"
    
- alert: HighRetryFailureRate
  expr: |
    rate(ingest_retry_attempts_total{status="failure"}[5m]) /
    rate(ingest_retry_attempts_total[5m]) > 0.1
  for: 5m
  annotations:
    summary: "High retry failure rate detected"
```

---

## <a name="examples"></a>📝 مثال‌های استفاده

### مثال 1: استفاده خودکار

سیستم به صورت خودکار داده‌ها را buffer می‌کند:

```python
# درخواست ingest عادی
POST /ingest
{
  "source": "sensor_001",
  "records": [
    {
      "sensor_id": "TAG-001",
      "value": 123.45,
      "timestamp": "2025-12-28T10:00:00Z"
    }
  ]
}

# اگر سیستم offline باشد، داده به صورت خودکار buffer می‌شود
# و پس از برقراری ارتباط، به صورت خودکار ارسال می‌شود
```

### مثال 2: بررسی وضعیت Buffer

```bash
# بررسی آمار buffer
curl http://localhost:8002/buffer/stats

# پاسخ:
{
  "total_records": 1234,
  "by_source": {"sensor_001": 800},
  "buffer_usage_percent": 1.23
}
```

### مثال 3: Retry دستی

```bash
# فعال‌سازی retry دستی
curl -X POST http://localhost:8002/buffer/retry

# پاسخ:
{
  "message": "Retry triggered",
  "buffered_records": 1234
}
```

### مثال 4: پاکسازی Buffer

```bash
# پاکسازی تمام رکوردهای buffer
curl -X DELETE http://localhost:8002/buffer/clear

# پاکسازی رکوردهای یک source خاص
curl -X DELETE "http://localhost:8002/buffer/clear?source=sensor_001"
```

---

## 🔧 Troubleshooting

### مشکل: Buffer پر شده است

**راه‌حل:**
1. بررسی آمار buffer: `GET /buffer/stats`
2. افزایش `OFFLINE_BUFFER_MAX_SIZE` یا `OFFLINE_BUFFER_MAX_SIZE_MB`
3. پاکسازی رکوردهای قدیمی: `DELETE /buffer/clear`
4. بررسی اینکه retry task در حال اجرا است

### مشکل: داده‌ها retry نمی‌شوند

**راه‌حل:**
1. بررسی وضعیت connection: `GET /health`
2. بررسی اینکه `connection_monitor.is_online = True`
3. فعال‌سازی retry دستی: `POST /buffer/retry`
4. بررسی لاگ‌ها برای خطاها

### مشکل: Connection Monitor وضعیت را اشتباه تشخیص می‌دهد

**راه‌حل:**
1. بررسی تنظیمات `CONNECTION_CHECK_HOSTS` و `CONNECTION_CHECK_URLS`
2. افزایش `CONNECTION_CHECK_TIMEOUT`
3. اضافه کردن hosts/URLs بیشتر برای بررسی

---

## ⚠️ ملاحظات

### Trade-offs

- **Storage**: Buffer نیاز به فضای دیسک دارد
- **Latency**: Retry ممکن است کمی تاخیر ایجاد کند
- **Data Loss**: در صورت پر شدن buffer، داده‌های قدیمی حذف می‌شوند

### Best Practices

1. **Monitor Buffer Usage**: به طور مداوم استفاده از buffer را نظارت کنید
2. **Set Appropriate Limits**: محدودیت‌های مناسب برای محیط خود تنظیم کنید
3. **Regular Cleanup**: پاکسازی منظم رکوردهای قدیمی
4. **Test Offline Scenarios**: سناریوهای offline را تست کنید

---

## 🔗 منابع بیشتر

- [OGIM Architecture](./ARCHITECTURE.md)
- [OGIM Observability](./OBSERVABILITY.md)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

**نسخه:** 1.0.0  
**به‌روزرسانی:** دسامبر 2025

