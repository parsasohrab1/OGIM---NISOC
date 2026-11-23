# TimescaleDB Multi-node Cluster

This document is a guide to implementing and managing a TimescaleDB Multi-node Cluster for handling the huge volume of sensor data (10 gigabytes per day).

## 📋 Table of Contents

1. [Overview](#overview)
2. [Cluster architecture](#architecture)
3. [Installation and setup](#installation)
4. [Configuration](#configuration)
5. [Cluster management](#management)
6. [Optimization for high volume](#optimization)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## <a name="overview"></a>🎯 Overview

The TimescaleDB Multi-node Cluster makes it possible to distribute data and processing load across several nodes:

- ✅ **Access Nodes**: Coordinator nodes that receive and distribute queries
- ✅ **Data Nodes**: Storage nodes that hold the data
- ✅ **Distributed Hypertables**: Automatic distribution of data across data nodes
- ✅ **Load Balancing**: Load distribution between access nodes
- ✅ **High Availability**: Redundancy and failover capability

### Benefits of Multi-node

| Feature | Single-node | Multi-node |
|-------|-------------|------------|
| Storage capacity | Limited | Unlimited (add nodes) |
| Throughput | Limited | Scalable |
| Query Performance | Limited | Parallelized |
| High Availability | No | Yes |

---

## <a name="architecture"></a>🏗️ Cluster architecture

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

### Cluster components

1. **Access Node (Coordinator)**
   - Receives queries from the application
   - Distributes queries to the data nodes
   - Collects the results
   - Manages metadata

2. **Data Nodes**
   - Stores the data
   - Processes local queries
   - Replication (optional)

3. **Distributed Hypertable**
   - Automatic data distribution
   - Partitioning by time and space
   - Managing chunks

---

## <a name="installation"></a>🚀 Installation and setup

### Method 1: Docker Compose (Development)

```bash
# Start the cluster
docker-compose -f docker-compose.multinode.yml up -d

# Configure the cluster
export TIMESCALE_ACCESS_NODE=timescaledb-access:5432
export TIMESCALE_DATA_NODES=timescaledb-data1:5432,timescaledb-data2:5432,timescaledb-data3:5432
./scripts/setup_timescale_cluster.sh
```

### Method 2: Kubernetes (Production)

```bash
# Apply the manifests
kubectl apply -f infrastructure/kubernetes/timescaledb-multinode.yaml

# Check the status
kubectl get pods -l app=timescaledb
kubectl get svc -l app=timescaledb

# Configure the cluster (after the pods are ready)
kubectl exec -it timescaledb-access-0 -- psql -U ogim_user -d ogim_tsdb
```

---

## <a name="configuration"></a>⚙️ Configuration

### Environment Variables

```bash
# Enable Multi-node
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

### PostgreSQL settings (for high volume)

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

# For high-volume writes
synchronous_commit = off
commit_delay = 10000
commit_siblings = 5
```

---

## <a name="management"></a>🔧 Cluster management

### Using the Management Script

```bash
# List data nodes
python scripts/manage_timescale_cluster.py list

# Add a data node
python scripts/manage_timescale_cluster.py add-node timescaledb-data4:5432

# Remove a data node
python scripts/manage_timescale_cluster.py remove-node data4

# Create a distributed hypertable
python scripts/manage_timescale_cluster.py create-hypertable sensor_data --time-column timestamp --partition-column tag_id

# Show the cluster status
python scripts/manage_timescale_cluster.py status

# Optimize for high volume
python scripts/manage_timescale_cluster.py optimize
```

### Direct SQL commands

```sql
-- List data nodes
SELECT * FROM timescaledb_information.data_nodes;

-- Add a data node
SELECT add_data_node(
    'data4',
    host => 'timescaledb-data4',
    port => 5432,
    database => 'ogim_tsdb',
    user => 'ogim_user',
    password => 'ogim_password'
);

-- Create a distributed hypertable
SELECT create_distributed_hypertable(
    'sensor_data',
    'timestamp',
    partitioning_column => 'tag_id',
    number_partitions => 4,
    chunk_time_interval => INTERVAL '1 day'
);

-- Show the hypertable status
SELECT * FROM timescaledb_information.hypertables WHERE is_distributed = true;
```

---

## <a name="optimization"></a>⚡ Optimization for high volume (10GB/day)

### 1. Chunk Configuration

```sql
-- Set the chunk interval to 1 day
SELECT set_chunk_time_interval('sensor_data', INTERVAL '1 day');
```

**Calculation:**
- 10GB/day = ~116MB/hour
- Suitable chunk size: 1-2GB
- Chunk interval: 1 day (suitable for 10GB/day)

### 2. Compression

```sql
-- Enable compression
ALTER TABLE sensor_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'tag_id'
);

-- Compression policy (compress chunks older than 7 days)
SELECT add_compression_policy('sensor_data', INTERVAL '7 days');
```

### 3. Retention Policy

```sql
-- Automatically drop chunks older than 1 year
SELECT add_retention_policy('sensor_data', INTERVAL '1 year');
```

### 4. Indexes

```sql
-- Index for common queries
CREATE INDEX idx_sensor_data_tag_timestamp 
ON sensor_data (tag_id, timestamp DESC);

-- Index for time-range queries
CREATE INDEX idx_sensor_data_timestamp 
ON sensor_data (timestamp DESC);
```

### 5. Autovacuum Optimization

```sql
-- Optimize autovacuum for high-volume writes
ALTER TABLE sensor_data SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);
```

### 6. Connection Pooling

```python
# In database.py
timescale_engine = create_engine(
    connection_url,
    pool_size=20,        # increase the pool size
    max_overflow=40,    # increase the overflow
    pool_recycle=3600   # Recycle connections
)
```

---

## <a name="monitoring"></a>📊 Monitoring

### Key metrics

#### 1. Cluster Health

```sql
-- Data node status
SELECT 
    node_name,
    host,
    port,
    database,
    node_created
FROM timescaledb_information.data_nodes;

-- Number of chunks on each data node
SELECT 
    node_name,
    COUNT(*) as chunk_count
FROM timescaledb_information.chunks
WHERE hypertable_name = 'sensor_data'
GROUP BY node_name;
```

#### 2. Storage Usage

```sql
-- Data volume on each data node
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

### Problem: A data node cannot be added

**Solution:**
1. Check the network connection between the access node and the data node
2. Check the credentials
3. Check the firewall rules
4. Check the logs: `kubectl logs timescaledb-access-0`

### Problem: Queries are slow

**Solution:**
1. Check the indexes
2. Check the query plan: `EXPLAIN ANALYZE`
3. Check the data distribution across the data nodes
4. Tune `work_mem` and `shared_buffers`

### Problem: Data is not distributed

**Solution:**
1. Check that the hypertable is distributed:
   ```sql
   SELECT is_distributed FROM timescaledb_information.hypertables 
   WHERE hypertable_name = 'sensor_data';
   ```
2. Check the data nodes:
   ```sql
   SELECT * FROM timescaledb_information.data_nodes;
   ```
3. Re-attach the data nodes if necessary

---

## 📈 Capacity and scalability

### Capacity calculation

For **10GB/day**:

- **Daily**: 10GB
- **Monthly**: ~300GB
- **Yearly**: ~3.6TB

### Storage recommendations

- **Data Node 1**: 500GB (6 months)
- **Data Node 2**: 500GB (6 months)
- **Data Node 3**: 500GB (6 months)
- **Total**: 1.5TB (18 months with compression)

### Adding a Data Node

```bash
# Add a new data node
python scripts/manage_timescale_cluster.py add-node timescaledb-data4:5432

# Attach to the hypertable
SELECT attach_data_node('data4', 'sensor_data');
```

---

## 🔗 More resources

- [TimescaleDB Multi-node Documentation](https://docs.timescale.com/use-timescale/latest/multinode-timescaledb/)
- [TimescaleDB Best Practices](https://docs.timescale.com/use-timescale/latest/best-practices/)
- [OGIM Architecture](./ARCHITECTURE.md)

---

**Version:** 1.0.0
**Updated:** December 2025

