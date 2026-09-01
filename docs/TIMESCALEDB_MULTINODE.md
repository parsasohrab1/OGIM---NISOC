# TimescaleDB Multi-node Cluster

این مستند راهنمای پیاده‌سازی و مدیریت TimescaleDB Multi-node Cluster برای مدیریت حجم عظیم داده‌های سنسوری (۱۰ گیگابایت در روز) است.

## 📋 فهرست مطالب

1. [نمای کلی](#overview)
2. [معماری Cluster](#architecture)
3. [نصب و راه‌اندازی](#installation)
4. [پیکربندی](#configuration)
5. [مدیریت Cluster](#management)
6. [بهینه‌سازی برای حجم بالا](#optimization)
7. [نظارت و Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## <a name="overview"></a>🎯 نمای کلی

TimescaleDB Multi-node Cluster امکان توزیع داده‌ها و بار پردازش را در چندین node فراهم می‌کند:

- ✅ **Access Nodes**: Nodeهای coordinator که queryها را دریافت و توزیع می‌کنند
- ✅ **Data Nodes**: Nodeهای ذخیره‌سازی که داده‌ها را نگهداری می‌کنند
- ✅ **Distributed Hypertables**: توزیع خودکار داده‌ها در data nodes
- ✅ **Load Balancing**: توزیع بار بین access nodes
- ✅ **High Availability**: قابلیت افزونگی و failover

### مزایای Multi-node

| ویژگی | Single-node | Multi-node |
|-------|-------------|------------|
| ظرفیت ذخیره‌سازی | محدود | نامحدود (افزودن node) |
| Throughput | محدود | مقیاس‌پذیر |
| Query Performance | محدود | موازی‌سازی |
| High Availability | ندارد | دارد |

---

## <a name="architecture"></a>🏗️ معماری Cluster

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│              (Data Ingestion Service)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Load Balancer / Connection Pool             │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Access Node 1│ │ Access Node 2│ │ Access Node N│
│ (Coordinator)│ │ (Coordinator)│ │ (Coordinator)│
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                 │                 │
       └────────┬────────┴────────┬────────┘
                │                 │
                ▼                 ▼
    ┌───────────────────────────────────┐
    │      Distributed Hypertable       │
    │         (sensor_data)              │
    └───────────────────────────────────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Data Node│ │Data Node│ │Data Node│
│    1    │ │    2    │ │    3    │
└─────────┘ └─────────┘ └─────────┘
```

### اجزای Cluster

1. **Access Node (Coordinator)**
   - دریافت queryها از application
   - توزیع queryها به data nodes
   - جمع‌آوری نتایج
   - مدیریت metadata

2. **Data Nodes**
   - ذخیره‌سازی داده‌ها
   - پردازش queryهای محلی
   - Replication (اختیاری)

3. **Distributed Hypertable**
   - توزیع خودکار داده‌ها
   - Partitioning بر اساس time و space
   - مدیریت chunks

---

## <a name="installation"></a>🚀 نصب و راه‌اندازی

### روش 1: Docker Compose (Development)

```bash
# راه‌اندازی cluster
docker-compose -f docker-compose.multinode.yml up -d

# تنظیم cluster
export TIMESCALE_ACCESS_NODE=timescaledb-access:5432
export TIMESCALE_DATA_NODES=timescaledb-data1:5432,timescaledb-data2:5432,timescaledb-data3:5432
./scripts/setup_timescale_cluster.sh
```

### روش 2: Kubernetes (Production)

```bash
# اعمال manifests
kubectl apply -f infrastructure/kubernetes/timescaledb-multinode.yaml

# بررسی وضعیت
kubectl get pods -l app=timescaledb
kubectl get svc -l app=timescaledb

# تنظیم cluster (بعد از آماده شدن pods)
kubectl exec -it timescaledb-access-0 -- psql -U ogim_user -d ogim_tsdb
```

---

## <a name="configuration"></a>⚙️ پیکربندی

### Environment Variables

```bash
# فعال‌سازی Multi-node
TIMESCALE_MULTI_NODE_ENABLED=true

# Access Nodes (comma-separated)
TIMESCALE_ACCESS_NODES=timescaledb-access:5432

# Data Nodes (comma-separated)
TIMESCALE_DATA_NODES=timescaledb-data1:5432,timescaledb-data2:5432,timescaledb-data3:5432

# Connection Pool Settings
TIMESCALE_CONNECTION_POOL_SIZE=20
TIMESCALE_MAX_OVERFLOW=40

# Hypertable Settings
TIMESCALE_CHUNK_TIME_INTERVAL=1 day
TIMESCALE_NUMBER_PARTITIONS=4
```

### تنظیمات PostgreSQL (برای حجم بالا)

```conf
# postgresql.conf
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB

# برای high-volume writes
synchronous_commit = off
commit_delay = 10000
commit_siblings = 5
```

---

## <a name="management"></a>🔧 مدیریت Cluster

### استفاده از Management Script

```bash
# لیست data nodes
python scripts/manage_timescale_cluster.py list

# افزودن data node
python scripts/manage_timescale_cluster.py add-node timescaledb-data4:5432

# حذف data node
python scripts/manage_timescale_cluster.py remove-node data4

# ایجاد distributed hypertable
python scripts/manage_timescale_cluster.py create-hypertable sensor_data --time-column timestamp --partition-column tag_id

# نمایش وضعیت cluster
python scripts/manage_timescale_cluster.py status

# بهینه‌سازی برای حجم بالا
python scripts/manage_timescale_cluster.py optimize
```

### دستورات SQL مستقیم

```sql
-- لیست data nodes
SELECT * FROM timescaledb_information.data_nodes;

-- افزودن data node
SELECT add_data_node(
    'data4',
    host => 'timescaledb-data4',
    port => 5432,
    database => 'ogim_tsdb',
    user => 'ogim_user',
    password => 'ogim_password'
);

-- ایجاد distributed hypertable
SELECT create_distributed_hypertable(
    'sensor_data',
    'timestamp',
    partitioning_column => 'tag_id',
    number_partitions => 4,
    chunk_time_interval => INTERVAL '1 day'
);

-- نمایش وضعیت hypertable
SELECT * FROM timescaledb_information.hypertables WHERE is_distributed = true;
```

---

## <a name="optimization"></a>⚡ بهینه‌سازی برای حجم بالا (10GB/day)

### 1. Chunk Configuration

```sql
-- تنظیم chunk interval به 1 روز
SELECT set_chunk_time_interval('sensor_data', INTERVAL '1 day');
```

**محاسبه:**
- 10GB/day = ~116MB/hour
- Chunk size مناسب: 1-2GB
- Chunk interval: 1 day (مناسب برای 10GB/day)

### 2. Compression

```sql
-- فعال‌سازی compression
ALTER TABLE sensor_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'tag_id'
);

-- Policy برای compression (compress chunks قدیمی‌تر از 7 روز)
SELECT add_compression_policy('sensor_data', INTERVAL '7 days');
```

### 3. Retention Policy

```sql
-- حذف خودکار chunks قدیمی‌تر از 1 سال
SELECT add_retention_policy('sensor_data', INTERVAL '1 year');
```

### 4. Indexes

```sql
-- Index برای queryهای رایج
CREATE INDEX idx_sensor_data_tag_timestamp 
ON sensor_data (tag_id, timestamp DESC);

-- Index برای time-range queries
CREATE INDEX idx_sensor_data_timestamp 
ON sensor_data (timestamp DESC);
```

### 5. Autovacuum Optimization

```sql
-- بهینه‌سازی autovacuum برای high-volume writes
ALTER TABLE sensor_data SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);
```

### 6. Connection Pooling

```python
# در database.py
timescale_engine = create_engine(
    connection_url,
    pool_size=20,        # افزایش pool size
    max_overflow=40,    # افزایش overflow
    pool_recycle=3600   # Recycle connections
)
```

---

## <a name="monitoring"></a>📊 نظارت و Monitoring

### متریک‌های کلیدی

#### 1. Cluster Health

```sql
-- وضعیت data nodes
SELECT 
    node_name,
    host,
    port,
    database,
    node_created
FROM timescaledb_information.data_nodes;

-- تعداد chunks در هر data node
SELECT 
    node_name,
    COUNT(*) as chunk_count
FROM timescaledb_information.chunks
WHERE hypertable_name = 'sensor_data'
GROUP BY node_name;
```

#### 2. Storage Usage

```sql
-- حجم داده در هر data node
SELECT 
    node_name,
    pg_size_pretty(SUM(chunk_size)) as total_size
FROM timescaledb_information.chunks
WHERE hypertable_name = 'sensor_data'
GROUP BY node_name;
```

#### 3. Query Performance

```sql
-- Slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
WHERE query LIKE '%sensor_data%'
ORDER BY mean_time DESC
LIMIT 10;
```

### Prometheus Metrics

```yaml
# timescaledb_exporter metrics
timescaledb_chunks_total{hypertable="sensor_data"}
timescaledb_chunk_size_bytes{hypertable="sensor_data"}
timescaledb_compression_ratio{hypertable="sensor_data"}
timescaledb_data_nodes_total
```

---

## <a name="troubleshooting"></a>🔍 Troubleshooting

### مشکل: Data node اضافه نمی‌شود

**راه‌حل:**
1. بررسی اتصال network بین access node و data node
2. بررسی credentials
3. بررسی firewall rules
4. بررسی logs: `kubectl logs timescaledb-access-0`

### مشکل: Queryها کند هستند

**راه‌حل:**
1. بررسی indexes
2. بررسی query plan: `EXPLAIN ANALYZE`
3. بررسی توزیع داده‌ها در data nodes
4. تنظیم `work_mem` و `shared_buffers`

### مشکل: داده‌ها توزیع نشده‌اند

**راه‌حل:**
1. بررسی اینکه hypertable distributed است:
   ```sql
   SELECT is_distributed FROM timescaledb_information.hypertables 
   WHERE hypertable_name = 'sensor_data';
   ```
2. بررسی data nodes:
   ```sql
   SELECT * FROM timescaledb_information.data_nodes;
   ```
3. Re-attach data nodes اگر لازم باشد

---

## 📈 ظرفیت و مقیاس‌پذیری

### محاسبه ظرفیت

برای **10GB/day**:

- **Daily**: 10GB
- **Monthly**: ~300GB
- **Yearly**: ~3.6TB

### توصیه‌های Storage

- **Data Node 1**: 500GB (6 months)
- **Data Node 2**: 500GB (6 months)
- **Data Node 3**: 500GB (6 months)
- **Total**: 1.5TB (18 months با compression)

### افزودن Data Node

```bash
# افزودن data node جدید
python scripts/manage_timescale_cluster.py add-node timescaledb-data4:5432

# Attach به hypertable
SELECT attach_data_node('data4', 'sensor_data');
```

---

## 🔗 منابع بیشتر

- [TimescaleDB Multi-node Documentation](https://docs.timescale.com/use-timescale/latest/multinode-timescaledb/)
- [TimescaleDB Best Practices](https://docs.timescale.com/use-timescale/latest/best-practices/)
- [OGIM Architecture](./ARCHITECTURE.md)

---

**نسخه:** 1.0.0  
**به‌روزرسانی:** دسامبر 2025

