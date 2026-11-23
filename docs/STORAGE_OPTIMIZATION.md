# Storage layer optimization

## 📋 Summary

This documentation explains how to optimize storage for a data volume of 10 gigabytes per day.

## 🎯 Optimization goals

1. **Multi-node TimescaleDB**: Distribute data across several nodes
2. **Compression Policy**: Compress data older than 90 days
3. **Data Partitioning**: Optimize partitioning for high volume
4. **Retention Policy**: Automatic management of deleting old data

## 🏗️ Architecture

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

## ⚙️ Configuration

### Compression Policy

```sql
-- Enable compression
ALTER TABLE sensor_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'tag_id',
    timescaledb.compress_orderby = 'timestamp DESC'
);

-- Add a compression policy (90 days)
SELECT add_compression_policy(
    'sensor_data',
    INTERVAL '90 days'
);
```

### Chunk Configuration

```sql
-- Set the chunk interval to 1 day for 10GB/day
SELECT set_chunk_time_interval('sensor_data', INTERVAL '1 day');
```

**Calculation:**
- 10GB/day = ~116MB/hour
- Suitable chunk size: 1-2GB
- Chunk interval: 1 day (suitable for 10GB/day)

### Retention Policy

```sql
-- Automatically drop chunks older than 1 year
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

The **Storage Optimization** page in the Navigation Bar is for:
- Viewing storage statistics
- Managing the Compression Policy
- Viewing chunk status
- Manual compression

## 🚀 Setup

### 1. Setting up the Multi-node Cluster

```bash
# Using Docker Compose
docker-compose -f docker-compose.multinode.yml up -d

# Or using a script
./scripts/setup_timescale_cluster.sh
```

### 2. Setting the Compression Policy

```python
from backend.shared.compression_manager import compression_manager

# Enable compression
compression_manager.enable_compression('sensor_data', segmentby_column='tag_id')

# Add a policy
compression_manager.add_compression_policy('sensor_data', compress_after_days=90)
```

### 3. Setting up the Storage Optimization Service

```bash
cd backend/storage-optimization-service
python -m uvicorn main:app --host 0.0.0.0 --port 8014 --reload
```

## 📈 Applied optimizations

### 1. Chunk Configuration
- **Interval**: 1 day
- **Size**: ~1GB per chunk
- **Partitioning**: By time and tag_id (optional)

### 2. Compression
- **Threshold**: 90 days
- **Segment By**: tag_id (for better compression)
- **Order By**: timestamp DESC
- **Expected Ratio**: ~90% space savings

### 3. Indexes
- `idx_sensor_data_tag_timestamp`: For common queries
- `idx_sensor_data_timestamp`: For time-range queries

### 4. Autovacuum
- Optimization for high-volume writes
- Suitable settings for 10GB/day

## 📊 Monitoring

### Metrics

- Total chunks
- Compressed chunks
- Compression ratio
- Storage size (compressed vs uncompressed)
- Oldest/Newest chunk dates

### Queries

```sql
-- View the compression status
SELECT * FROM timescaledb_information.hypertables
WHERE hypertable_name = 'sensor_data';

-- View the chunks
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

1. **Compression Threshold**: 90 days to balance query performance and storage
2. **Chunk Interval**: 1 day for 10GB/day
3. **Segment By**: tag_id for better compression
4. **Monitoring**: Regularly check the compression ratio
5. **Retention**: Delete data older than 1 year

## 🔍 Troubleshooting

### Compression not working
- Check that compression is enabled
- Check that the policy has been added
- Check the logs for errors

### High storage usage
- Check the compression ratio
- Check the number of uncompressed chunks
- Run manual compression

## 📝 Notes

- The compression policy runs automatically
- Query performance is preserved on compressed data
- Multi-node cluster for further scalability

