# بهینه‌سازی لایه ذخیره‌سازی

## 📋 خلاصه

این مستندات نحوه بهینه‌سازی ذخیره‌سازی برای حجم داده 10 گیگابایت در روز را توضیح می‌دهد.

## 🎯 اهداف بهینه‌سازی

1. **Multi-node TimescaleDB**: توزیع داده‌ها در چندین node
2. **Compression Policy**: فشرده‌سازی داده‌های قدیمی‌تر از 90 روز
3. **Data Partitioning**: بهینه‌سازی partitioning برای حجم بالا
4. **Retention Policy**: مدیریت خودکار حذف داده‌های قدیمی

## 🏗️ معماری

### Multi-node Cluster

```
┌─────────────────────────────────────┐
│      Access Nodes (Coordinators)    │
│  ┌──────────┐  ┌──────────┐        │
│  │ Access 1 │  │ Access 2 │        │
│  └────┬─────┘  └────┬─────┘        │
└───────┼──────────────┼──────────────┘
        │              │
        ▼              ▼
┌─────────────────────────────────────┐
│      Distributed Hypertable         │
│         (sensor_data)                │
└─────────────────────────────────────┘
        │              │
        ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│Data Node 1│ │Data Node 2│ │Data Node 3│
└──────────┘  └──────────┘  └──────────┘
```

### Compression Strategy

```
┌─────────────────────────────────────┐
│     Recent Data (0-90 days)         │
│     Status: Uncompressed            │
│     Reason: Frequent queries        │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│     Old Data (90+ days)              │
│     Status: Compressed               │
│     Compression Ratio: ~90%          │
│     Query Performance: Maintained    │
└─────────────────────────────────────┘
```

## ⚙️ پیکربندی

### Compression Policy

```sql
-- فعال‌سازی compression
ALTER TABLE sensor_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'tag_id',
    timescaledb.compress_orderby = 'timestamp DESC'
);

-- اضافه کردن compression policy (90 روز)
SELECT add_compression_policy(
    'sensor_data',
    INTERVAL '90 days'
);
```

### Chunk Configuration

```sql
-- تنظیم chunk interval به 1 روز برای 10GB/day
SELECT set_chunk_time_interval('sensor_data', INTERVAL '1 day');
```

**محاسبه:**
- 10GB/day = ~116MB/hour
- Chunk size مناسب: 1-2GB
- Chunk interval: 1 day (مناسب برای 10GB/day)

### Retention Policy

```sql
-- حذف خودکار chunks قدیمی‌تر از 1 سال
SELECT add_retention_policy('sensor_data', INTERVAL '1 year');
```

## 🔌 API Endpoints

### Storage Optimization Service (Port 8014)

#### Enable Compression
```
POST /api/storage-optimization/compression/enable
{
    "table_name": "sensor_data",
    "compress_after_days": 90,
    "segmentby_column": "tag_id"
}
```

#### Get Compression Status
```
GET /api/storage-optimization/compression/status/{table_name}
```

#### Compress Chunks Now
```
POST /api/storage-optimization/compression/compress-now?table_name=sensor_data&older_than_days=90
```

#### Get Storage Stats
```
GET /api/storage-optimization/storage/stats
```

#### Get Chunks
```
GET /api/storage-optimization/chunks/{table_name}?limit=100
```

## 📊 Frontend

صفحه **Storage Optimization** در Navigation Bar برای:
- مشاهده آمار ذخیره‌سازی
- مدیریت Compression Policy
- مشاهده وضعیت chunks
- فشرده‌سازی دستی

## 🚀 راه‌اندازی

### 1. راه‌اندازی Multi-node Cluster

```bash
# استفاده از Docker Compose
docker-compose -f docker-compose.multinode.yml up -d

# یا استفاده از اسکریپت
./scripts/setup_timescale_cluster.sh
```

### 2. تنظیم Compression Policy

```python
from backend.shared.compression_manager import compression_manager

# فعال‌سازی compression
compression_manager.enable_compression('sensor_data', segmentby_column='tag_id')

# اضافه کردن policy
compression_manager.add_compression_policy('sensor_data', compress_after_days=90)
```

### 3. راه‌اندازی Storage Optimization Service

```bash
cd backend/storage-optimization-service
python -m uvicorn main:app --host 0.0.0.0 --port 8014 --reload
```

## 📈 بهینه‌سازی‌های اعمال شده

### 1. Chunk Configuration
- **Interval**: 1 day
- **Size**: ~1GB per chunk
- **Partitioning**: By time and tag_id (optional)

### 2. Compression
- **Threshold**: 90 days
- **Segment By**: tag_id (برای compression بهتر)
- **Order By**: timestamp DESC
- **Expected Ratio**: ~90% space savings

### 3. Indexes
- `idx_sensor_data_tag_timestamp`: برای queryهای رایج
- `idx_sensor_data_timestamp`: برای time-range queries

### 4. Autovacuum
- بهینه‌سازی برای high-volume writes
- تنظیمات مناسب برای 10GB/day

## 📊 Monitoring

### Metrics

- Total chunks
- Compressed chunks
- Compression ratio
- Storage size (compressed vs uncompressed)
- Oldest/Newest chunk dates

### Queries

```sql
-- مشاهده وضعیت compression
SELECT * FROM timescaledb_information.hypertables
WHERE hypertable_name = 'sensor_data';

-- مشاهده chunks
SELECT 
    chunk_name,
    range_start,
    range_end,
    is_compressed,
    pg_size_pretty(pg_total_relation_size(chunk_schema || '.' || chunk_name)) as size
FROM timescaledb_information.chunks
WHERE hypertable_name = 'sensor_data'
ORDER BY range_start DESC;
```

## ✅ Best Practices

1. **Compression Threshold**: 90 روز برای تعادل بین query performance و storage
2. **Chunk Interval**: 1 روز برای 10GB/day
3. **Segment By**: tag_id برای compression بهتر
4. **Monitoring**: بررسی منظم compression ratio
5. **Retention**: حذف داده‌های قدیمی‌تر از 1 سال

## 🔍 Troubleshooting

### Compression not working
- بررسی کنید که compression enabled است
- بررسی کنید که policy اضافه شده است
- بررسی logs برای خطاها

### High storage usage
- بررسی compression ratio
- بررسی تعداد uncompressed chunks
- اجرای manual compression

## 📝 Notes

- Compression policy به صورت خودکار اجرا می‌شود
- Query performance روی compressed data حفظ می‌شود
- Multi-node cluster برای مقیاس‌پذیری بیشتر

