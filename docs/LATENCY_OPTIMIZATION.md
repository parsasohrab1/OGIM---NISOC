# Latency Optimization

This document is a guide to optimizing the latency of the OGIM system for critical controls that require millisecond response times.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Kafka optimization](#kafka-optimization)
3. [Flink optimization](#flink-optimization)
4. [Using Low-Latency Mode](#usage)
5. [Recommended settings](#recommended-settings)
6. [Monitoring and metrics](#monitoring)

---

## <a name="overview"></a>🎯 Overview

For critical controls that require millisecond response times, the OGIM system supports **Low-Latency Mode**, which includes the following optimizations:

- ✅ **Kafka Producer**: Immediate send without batching
- ✅ **Kafka Consumer**: Immediate receive with minimum latency
- ✅ **Flink Processing**: Processing without checkpointing for minimum latency
- ✅ **Command Control**: A separate path for critical controls

### Performance goals

| Scenario | Latency target | Mode |
|--------|-----------|------|
| Critical controls | < 10ms | Low-Latency |
| Normal controls | < 100ms | Standard |
| Data processing | < 1s | Standard |

---

## <a name="kafka-optimization"></a>⚡ Kafka optimization

### Producer Settings (Low-Latency)

For critical controls, the following settings are used:

```python
# Low-Latency Producer Configuration
{
    'acks': '1',                    # Leader acknowledgment (faster than 'all')
    'linger.ms': 0,                 # No batching delay - immediate send
    'batch.size': 1,                # Small batch size
    'compression.type': 'none',      # No compression overhead
    'retries': 1,                   # Reduced retries
    'max.in.flight.requests.per.connection': 5,  # Higher throughput
    'request.timeout.ms': 5000,      # Lower timeout
    'delivery.timeout.ms': 10000,   # Lower delivery timeout
}
```

### Consumer Settings (Low-Latency)

```python
# Low-Latency Consumer Configuration
{
    'fetch.min.bytes': 1,           # Minimum bytes - immediate fetch
    'fetch.max.wait.ms': 0,         # No wait time
    'max.partition.fetch.bytes': 1048576,  # 1MB - smaller for lower latency
    'enable.auto.commit': True,     # Auto-commit for lower latency
    'auto.commit.interval.ms': 100, # Frequent commits
    'session.timeout.ms': 10000,    # Lower session timeout
    'heartbeat.interval.ms': 3000,   # More frequent heartbeats
}
```

### Settings comparison

| Parameter | Standard Mode | Low-Latency Mode | Impact |
|---------|---------------|------------------|-------|
| `acks` | `all` | `1` | 50-70% latency reduction |
| `linger.ms` | 10ms | 0ms | Removes batching delay |
| `batch.size` | 16KB | 1 byte | Immediate send |
| `compression.type` | `snappy` | `none` | Removes compression overhead |
| `fetch.max.wait.ms` | 500ms | 0ms | Immediate receive |

---

## <a name="flink-optimization"></a>🔄 Flink optimization

### Low-Latency Flink Job settings

```python
# Low-Latency Flink Configuration
env.set_parallelism(4)              # Higher parallelism
env.set_buffer_timeout(0)           # No buffering - immediate processing
# Checkpointing disabled            # No checkpoint overhead
```

### Flink Modes comparison

| Feature | Standard Mode | Low-Latency Mode |
|--------|---------------|------------------|
| Checkpointing | 60s interval | Disabled |
| Buffer Timeout | 100ms | 0ms |
| Parallelism | 2 | 4 |
| Processing Time | Event Time | Processing Time |
| Semantics | Exactly-once | At-most-once |

**Important note**: In Low-Latency Mode, exactly-once semantics is sacrificed to achieve the lowest latency. This is acceptable for critical controls that require speed.

---

## <a name="usage"></a>🚀 Using Low-Latency Mode

### 1. Enabling it in Config

```bash
# In the .env file or environment variables
KAFKA_LOW_LATENCY_MODE=true
KAFKA_PRODUCER_ACKS=1
KAFKA_PRODUCER_LINGER_MS=0
KAFKA_PRODUCER_BATCH_SIZE=1
KAFKA_PRODUCER_COMPRESSION_TYPE=none
KAFKA_CONSUMER_FETCH_MIN_BYTES=1
KAFKA_CONSUMER_FETCH_MAX_WAIT_MS=0
```

### 2. Using it in the Command Control Service

```python
from kafka_utils import create_low_latency_producer

# Create a producer with low-latency mode
producer = create_low_latency_producer("critical-control-commands")

# Send a critical command
producer.send(command_id, command_data, flush_immediately=False)
# Note: flush() is not called to avoid blocking
```

### 3. Using it in a Flink Job

```bash
# Run the Flink job with low-latency mode
python flink-job-example.py --low-latency
```

Or in code:

```python
from flink_job_example import create_critical_control_job

env = create_critical_control_job()
env.execute("Critical Control Processing Job")
```

### 4. Marking critical Commands

```python
# In the API request
POST /commands
{
    "well_name": "WELL-001",
    "equipment_id": "VALVE-001",
    "command_type": "emergency_shutdown",
    "parameters": {...},
    "critical": true  # mark as critical
}
```

---

## <a name="recommended-settings"></a>⚙️ Recommended settings

### For critical controls (Critical Controls)

```yaml
KAFKA_LOW_LATENCY_MODE: true
KAFKA_PRODUCER_ACKS: "1"
KAFKA_PRODUCER_LINGER_MS: 0
KAFKA_PRODUCER_BATCH_SIZE: 1
KAFKA_PRODUCER_COMPRESSION_TYPE: "none"
KAFKA_CONSUMER_FETCH_MIN_BYTES: 1
KAFKA_CONSUMER_FETCH_MAX_WAIT_MS: 0

# Flink
FLINK_PARALLELISM: 4
FLINK_BUFFER_TIMEOUT: 0
FLINK_CHECKPOINTING_ENABLED: false
```

### For normal controls (Standard Controls)

```yaml
KAFKA_LOW_LATENCY_MODE: false
KAFKA_PRODUCER_ACKS: "all"
KAFKA_PRODUCER_LINGER_MS: 10
KAFKA_PRODUCER_BATCH_SIZE: 16384
KAFKA_PRODUCER_COMPRESSION_TYPE: "snappy"
KAFKA_CONSUMER_FETCH_MIN_BYTES: 1024
KAFKA_CONSUMER_FETCH_MAX_WAIT_MS: 500

# Flink
FLINK_PARALLELISM: 2
FLINK_BUFFER_TIMEOUT: 100
FLINK_CHECKPOINTING_ENABLED: true
FLINK_CHECKPOINT_INTERVAL: 60000
```

---

## <a name="monitoring"></a>📊 Monitoring and metrics

### Key metrics

1. **Kafka Producer Latency**
   ```promql
   kafka_producer_request_latency_avg{producer="low-latency"}
   ```

2. **Kafka Consumer Lag**
   ```promql
   kafka_consumer_lag_sum{consumer_group="critical-controls"}
   ```

3. **Flink Processing Latency**
   ```promql
   flink_taskmanager_job_latency_source_id_operator_id_operator_subtask_index_latency
   ```

4. **End-to-End Latency**
   ```promql
   command_control_latency_seconds{critical="true"}
   ```

### Grafana dashboard

Recommended panels:
- **Critical Control Latency**: p50, p95, p99
- **Kafka Producer/Consumer Metrics**
- **Flink Processing Time**
- **Error Rate** for the low-latency path

### Alerts

```yaml
# Prometheus Alert Rules
- alert: HighCriticalControlLatency
  expr: histogram_quantile(0.99, command_control_latency_seconds{critical="true"}) > 0.01
  for: 1m
  annotations:
    summary: "Critical control latency exceeds 10ms"
    
- alert: LowLatencyPathErrors
  expr: rate(command_control_errors_total{critical="true"}[5m]) > 0.01
  for: 2m
  annotations:
    summary: "High error rate in critical control path"
```

---

## 🔧 Kafka Broker settings

To achieve the lowest latency at the broker level:

```properties
# Kafka Broker Settings (server.properties)
num.network.threads=8
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600

# For low-latency topics
log.flush.interval.messages=1
log.flush.interval.ms=0
```

---

## ⚠️ Considerations and trade-offs

### Benefits of Low-Latency Mode

- ✅ Very low latency (< 10ms)
- ✅ Suitable for critical controls
- ✅ Immediate processing

### Drawbacks and trade-offs

- ❌ **Exactly-once semantics**: In Low-Latency Mode, at-most-once semantics is used
- ❌ **Durability**: With `acks=1`, there is a chance of data loss if the broker crashes
- ❌ **Throughput**: Without batching, throughput decreases
- ❌ **Resource Usage**: Higher parallelism needs more resources

### Recommendations

1. **Selective use**: Use Low-Latency Mode only for truly critical controls
2. **Continuous monitoring**: Monitor the latency and error rate metrics closely
3. **Performance testing**: Run load and latency tests before deploying to production
4. **Backup Strategy**: Have a backup and retry strategy for critical controls

---

## 📝 Usage examples

### Example 1: Sending a critical Command

```python
from kafka_utils import create_low_latency_producer, KAFKA_TOPICS

# Create a producer
producer = create_low_latency_producer(KAFKA_TOPICS["CRITICAL_CONTROL_COMMANDS"])

# Send a command
command_data = {
    "command_id": "CMD-001",
    "well_name": "WELL-001",
    "equipment_id": "VALVE-001",
    "command_type": "emergency_shutdown",
    "parameters": {"reason": "pressure_anomaly"}
}

producer.send("CMD-001", command_data)
# Note: flush() is not called
```

### Example 2: Consumer for critical controls

```python
from kafka_utils import create_low_latency_consumer, KAFKA_TOPICS

# Create a consumer
consumer = create_low_latency_consumer(
    topics=[KAFKA_TOPICS["CRITICAL_CONTROL_COMMANDS"]],
    group_id="critical-control-executor",
    auto_offset_reset="latest"
)

# Process messages
def process_critical_command(key, value):
    # Process the command immediately
    execute_command(value)

consumer.consume_messages(process_critical_command, timeout=0.0)
```

---

## 🔗 More resources

- [Kafka Performance Tuning](https://kafka.apache.org/documentation/#performance)
- [Flink Latency Tuning](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/execution/performance/)
- [OGIM Architecture](./ARCHITECTURE.md)
- [OGIM Observability](./OBSERVABILITY.md)

---

**Version:** 1.0.0
**Updated:** December 2025

