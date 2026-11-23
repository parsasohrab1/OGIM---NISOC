# Offline Resilience

This document is a guide to implementing Data Buffering in the Ingestion layer for when the rig's connection to the data center is lost.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Offline Buffer Manager](#buffer-manager)
4. [Connection Monitor](#connection-monitor)
5. [Retry Mechanism](#retry-mechanism)
6. [Configuration](#configuration)
7. [Monitoring and metrics](#monitoring)
8. [Usage examples](#examples)

---

## <a name="overview"></a>🎯 Overview

The OGIM system provides **Offline Resilience** to preserve data when the network is down:

- ✅ **Data Buffering**: Temporary storage of data in SQLite when the connection is lost
- ✅ **Connection Monitoring**: Automatic online/offline status detection
- ✅ **Automatic Retry**: Automatic resending of data after the connection is restored
- ✅ **Capacity Management**: Buffer capacity management and automatic cleanup
- ✅ **Metrics & Monitoring**: Complete metrics for monitoring

### Usage scenarios

- **Temporary disconnection**: Data is stored in the buffer and sent after the connection is restored
- **Long disconnection**: With capacity management, the oldest data is deleted
- **Send error**: If there is an error in Kafka, data is moved to the buffer

---

## <a name="architecture"></a>🏗️ Architecture

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

### Features

- **SQLite Storage**: Persistent storage in SQLite
- **Thread-Safe**: Multi-threading support
- **Capacity Management**: Limit on the number of records and size
- **Automatic Cleanup**: Automatic cleanup of old records
- **Retry Tracking**: Tracking the number of retries

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

### Features

- **Multi-Target Monitoring**: Monitoring multiple hosts/URLs
- **Automatic Detection**: Automatic detection of status changes
- **Callback Support**: Notification on status change
- **Configurable Intervals**: Configurable check interval

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

### Features

- **Automatic Retry**: Automatic retry when the connection is restored
- **Background Task**: Runs in the background without blocking
- **Retry Limits**: Limit on the number of attempts
- **Exponential Backoff**: Exponential delay between attempts

### Workflow

1. **Offline Detection**: The Connection Monitor detects the offline status
2. **Buffering**: Data is stored in SQLite
3. **Online Detection**: The Connection Monitor detects the online status
4. **Retry Trigger**: The retry task is activated automatically
5. **Send Records**: Buffered records are sent to Kafka
6. **Cleanup**: Successful records are removed from the buffer

---

## <a name="configuration"></a>⚙️ Configuration

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

### Recommended settings

#### For the Production environment

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

#### For the Development environment

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

## <a name="monitoring"></a>📊 Monitoring and metrics

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

Recommended panels:

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

### Alerts

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

## <a name="examples"></a>📝 Usage examples

### Example 1: Automatic usage

The system buffers data automatically:

```python
# A normal ingest request
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

# If the system is offline, the data is buffered automatically
# and sent automatically after the connection is restored
```

### Example 2: Checking the Buffer status

```bash
# Check the buffer statistics
curl http://localhost:8002/buffer/stats

# Response:
{
  "total_records": 1234,
  "by_source": {"sensor_001": 800},
  "buffer_usage_percent": 1.23
}
```

### Example 3: Manual Retry

```bash
# Enable manual retry
curl -X POST http://localhost:8002/buffer/retry

# Response:
{
  "message": "Retry triggered",
  "buffered_records": 1234
}
```

### Example 4: Cleaning the Buffer

```bash
# Clear all buffer records
curl -X DELETE http://localhost:8002/buffer/clear

# Clear the records of a specific source
curl -X DELETE "http://localhost:8002/buffer/clear?source=sensor_001"
```

---

## 🔧 Troubleshooting

### Problem: The buffer is full

**Solution:**
1. Check the buffer statistics: `GET /buffer/stats`
2. Increase `OFFLINE_BUFFER_MAX_SIZE` or `OFFLINE_BUFFER_MAX_SIZE_MB`
3. Clean old records: `DELETE /buffer/clear`
4. Check that the retry task is running

### Problem: Data is not retried

**Solution:**
1. Check the connection status: `GET /health`
2. Check that `connection_monitor.is_online = True`
3. Enable manual retry: `POST /buffer/retry`
4. Check the logs for errors

### Problem: The Connection Monitor detects the status incorrectly

**Solution:**
1. Check the `CONNECTION_CHECK_HOSTS` and `CONNECTION_CHECK_URLS` settings
2. Increase `CONNECTION_CHECK_TIMEOUT`
3. Add more hosts/URLs to check

---

## ⚠️ Considerations

### Trade-offs

- **Storage**: The buffer needs disk space
- **Latency**: Retry may introduce a slight delay
- **Data Loss**: If the buffer fills up, old data is deleted

### Best Practices

1. **Monitor Buffer Usage**: Continuously monitor buffer usage
2. **Set Appropriate Limits**: Set limits appropriate for your environment
3. **Regular Cleanup**: Regularly clean old records
4. **Test Offline Scenarios**: Test offline scenarios

---

## 🔗 More resources

- [OGIM Architecture](./ARCHITECTURE.md)
- [OGIM Observability](./OBSERVABILITY.md)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

**Version:** 1.0.0
**Updated:** December 2025

