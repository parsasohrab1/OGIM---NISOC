# بهینه‌سازی تاخیر (Latency Optimization)

این مستند راهنمای بهینه‌سازی تاخیر سیستم OGIM برای کنترل‌های بحرانی است که نیاز به زمان‌های میلی‌ثانیه‌ای دارند.

## 📋 فهرست مطالب

1. [نمای کلی](#overview)
2. [بهینه‌سازی Kafka](#kafka-optimization)
3. [بهینه‌سازی Flink](#flink-optimization)
4. [استفاده از Low-Latency Mode](#usage)
5. [تنظیمات پیشنهادی](#recommended-settings)
6. [نظارت و متریک‌ها](#monitoring)

---

## <a name="overview"></a>🎯 نمای کلی

برای کنترل‌های بحرانی که نیاز به زمان‌های میلی‌ثانیه‌ای دارند، سیستم OGIM از حالت **Low-Latency Mode** پشتیبانی می‌کند که شامل بهینه‌سازی‌های زیر است:

- ✅ **Kafka Producer**: ارسال فوری بدون batching
- ✅ **Kafka Consumer**: دریافت فوری با کمترین تاخیر
- ✅ **Flink Processing**: پردازش بدون checkpointing برای کمترین تاخیر
- ✅ **Command Control**: مسیر جداگانه برای کنترل‌های بحرانی

### اهداف عملکردی

| سناریو | هدف تاخیر | حالت |
|--------|-----------|------|
| کنترل‌های بحرانی | < 10ms | Low-Latency |
| کنترل‌های عادی | < 100ms | Standard |
| پردازش داده | < 1s | Standard |

---

## <a name="kafka-optimization"></a>⚡ بهینه‌سازی Kafka

### Producer Settings (Low-Latency)

برای کنترل‌های بحرانی، تنظیمات زیر استفاده می‌شود:

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

### مقایسه تنظیمات

| پارامتر | Standard Mode | Low-Latency Mode | تاثیر |
|---------|---------------|------------------|-------|
| `acks` | `all` | `1` | کاهش 50-70% تاخیر |
| `linger.ms` | 10ms | 0ms | حذف تاخیر batching |
| `batch.size` | 16KB | 1 byte | ارسال فوری |
| `compression.type` | `snappy` | `none` | حذف overhead فشرده‌سازی |
| `fetch.max.wait.ms` | 500ms | 0ms | دریافت فوری |

---

## <a name="flink-optimization"></a>🔄 بهینه‌سازی Flink

### تنظیمات Low-Latency Flink Job

```python
# Low-Latency Flink Configuration
env.set_parallelism(4)              # Higher parallelism
env.set_buffer_timeout(0)           # No buffering - immediate processing
# Checkpointing disabled            # No checkpoint overhead
```

### مقایسه Flink Modes

| ویژگی | Standard Mode | Low-Latency Mode |
|--------|---------------|------------------|
| Checkpointing | 60s interval | Disabled |
| Buffer Timeout | 100ms | 0ms |
| Parallelism | 2 | 4 |
| Processing Time | Event Time | Processing Time |
| Semantics | Exactly-once | At-most-once |

**نکته مهم**: در Low-Latency Mode، exactly-once semantics قربانی می‌شود برای دستیابی به کمترین تاخیر. این برای کنترل‌های بحرانی که نیاز به سرعت دارند قابل قبول است.

---

## <a name="usage"></a>🚀 استفاده از Low-Latency Mode

### 1. فعال‌سازی در Config

```bash
# در فایل .env یا environment variables
KAFKA_LOW_LATENCY_MODE=true
KAFKA_PRODUCER_ACKS=1
KAFKA_PRODUCER_LINGER_MS=0
KAFKA_PRODUCER_BATCH_SIZE=1
KAFKA_PRODUCER_COMPRESSION_TYPE=none
KAFKA_CONSUMER_FETCH_MIN_BYTES=1
KAFKA_CONSUMER_FETCH_MAX_WAIT_MS=0
```

### 2. استفاده در Command Control Service

```python
from kafka_utils import create_low_latency_producer

# ایجاد producer با low-latency mode
producer = create_low_latency_producer("critical-control-commands")

# ارسال command بحرانی
producer.send(command_id, command_data, flush_immediately=False)
# توجه: flush() صدا زده نمی‌شود برای جلوگیری از blocking
```

### 3. استفاده در Flink Job

```bash
# اجرای Flink job با low-latency mode
python flink-job-example.py --low-latency
```

یا در کد:

```python
from flink_job_example import create_critical_control_job

env = create_critical_control_job()
env.execute("Critical Control Processing Job")
```

### 4. علامت‌گذاری Commands بحرانی

```python
# در API request
POST /commands
{
    "well_name": "WELL-001",
    "equipment_id": "VALVE-001",
    "command_type": "emergency_shutdown",
    "parameters": {...},
    "critical": true  # علامت‌گذاری به عنوان بحرانی
}
```

---

## <a name="recommended-settings"></a>⚙️ تنظیمات پیشنهادی

### برای کنترل‌های بحرانی (Critical Controls)

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

### برای کنترل‌های عادی (Standard Controls)

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

## <a name="monitoring"></a>📊 نظارت و متریک‌ها

### متریک‌های کلیدی

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

### داشبورد Grafana

پنل‌های پیشنهادی:
- **Critical Control Latency**: p50, p95, p99
- **Kafka Producer/Consumer Metrics**
- **Flink Processing Time**
- **Error Rate** برای low-latency path

### هشدارها

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

## 🔧 تنظیمات Kafka Broker

برای دستیابی به کمترین تاخیر در سطح broker:

```properties
# Kafka Broker Settings (server.properties)
num.network.threads=8
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600

# برای low-latency topics
log.flush.interval.messages=1
log.flush.interval.ms=0
```

---

## ⚠️ ملاحظات و Trade-offs

### مزایای Low-Latency Mode

- ✅ تاخیر بسیار پایین (< 10ms)
- ✅ مناسب برای کنترل‌های بحرانی
- ✅ پردازش فوری

### معایب و Trade-offs

- ❌ **Exactly-once semantics**: در Low-Latency Mode، at-most-once semantics استفاده می‌شود
- ❌ **Durability**: با `acks=1`، احتمال از دست رفتن داده در صورت crash broker وجود دارد
- ❌ **Throughput**: بدون batching، throughput کاهش می‌یابد
- ❌ **Resource Usage**: parallelism بالاتر نیاز به منابع بیشتر دارد

### توصیه‌ها

1. **استفاده انتخابی**: فقط برای کنترل‌های واقعاً بحرانی از Low-Latency Mode استفاده کنید
2. **نظارت مداوم**: متریک‌های latency و error rate را به دقت نظارت کنید
3. **تست عملکرد**: قبل از استقرار در production، تست‌های load و latency انجام دهید
4. **Backup Strategy**: برای کنترل‌های بحرانی، استراتژی backup و retry داشته باشید

---

## 📝 مثال‌های استفاده

### مثال 1: ارسال Command بحرانی

```python
from kafka_utils import create_low_latency_producer, KAFKA_TOPICS

# ایجاد producer
producer = create_low_latency_producer(KAFKA_TOPICS["CRITICAL_CONTROL_COMMANDS"])

# ارسال command
command_data = {
    "command_id": "CMD-001",
    "well_name": "WELL-001",
    "equipment_id": "VALVE-001",
    "command_type": "emergency_shutdown",
    "parameters": {"reason": "pressure_anomaly"}
}

producer.send("CMD-001", command_data)
# توجه: flush() صدا زده نمی‌شود
```

### مثال 2: Consumer برای کنترل‌های بحرانی

```python
from kafka_utils import create_low_latency_consumer, KAFKA_TOPICS

# ایجاد consumer
consumer = create_low_latency_consumer(
    topics=[KAFKA_TOPICS["CRITICAL_CONTROL_COMMANDS"]],
    group_id="critical-control-executor",
    auto_offset_reset="latest"
)

# پردازش messages
def process_critical_command(key, value):
    # پردازش فوری command
    execute_command(value)

consumer.consume_messages(process_critical_command, timeout=0.0)
```

---

## 🔗 منابع بیشتر

- [Kafka Performance Tuning](https://kafka.apache.org/documentation/#performance)
- [Flink Latency Tuning](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/execution/performance/)
- [OGIM Architecture](./ARCHITECTURE.md)
- [OGIM Observability](./OBSERVABILITY.md)

---

**نسخه:** 1.0.0  
**به‌روزرسانی:** دسامبر 2025

