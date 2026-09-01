# ویژگی‌های پیشرفته ML و Workflow

این مستند راهنمای ویژگی‌های پیشرفته ML و Workflow سیستم OGIM است.

## 📋 فهرست مطالب

1. [Edge-to-Stream Architecture](#edge-to-stream)
2. [Sensor Health Monitoring & Drift Detection](#sensor-health)
3. [Secure Command Workflow](#secure-workflow)
4. [Remaining Useful Life (RUL) Prediction](#rul-prediction)

---

## <a name="edge-to-stream"></a>⚡ Edge-to-Stream Architecture

### نمای کلی

معماری یکپارچه پردازش لبه و جریان که انتقال داده از پروتکل‌های صنعتی (OPC UA/Modbus) به Apache Flink را با تأخیر زیر ثانیه فراهم می‌کند.

### معماری

```
┌─────────────────────────────────────────────────────────┐
│              Industrial Protocols                       │
│  ┌──────────┐              ┌──────────┐              │
│  │ OPC UA   │              │ Modbus   │              │
│  └────┬─────┘              └────┬─────┘              │
│       │                          │                     │
│       └──────────┬───────────────┘                     │
│                  ▼                                     │
│  ┌──────────────────────────────────────┐            │
│  │   Edge-to-Stream Bridge               │            │
│  │   - Protocol Enrichment                │            │
│  │   - Low-Latency Kafka Producer        │            │
│  │   - Sub-second Latency (< 1s)         │            │
│  └───────────────┬────────────────────────┘            │
│                  │                                     │
│                  ▼                                     │
│  ┌──────────────────────────────────────┐            │
│  │         Kafka (raw-sensor-data)        │            │
│  └───────────────┬────────────────────────┘            │
│                  │                                     │
│                  ▼                                     │
│  ┌──────────────────────────────────────┐            │
│  │      Apache Flink Stream Processing   │            │
│  │      - Data Cleansing                  │            │
│  │      - CEP                              │            │
│  │      - Anomaly Detection                │            │
│  └──────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

### ویژگی‌ها

- ✅ **Sub-second Latency**: تأخیر زیر 1 ثانیه از Edge به Flink
- ✅ **Direct Protocol Integration**: اتصال مستقیم OPC UA/Modbus
- ✅ **Low-Latency Kafka**: استفاده از Kafka Low-Latency Producer
- ✅ **Automatic Batching**: بچینگ خودکار برای بهینه‌سازی

### استفاده

```python
# از OPC UA
POST /data-ingestion/stream/opcua
{
  "node_id": "ns=2;i=1",
  "value": 123.45,
  "metadata": {"unit": "bar", "sensor_type": "pressure"}
}

# از Modbus
POST /data-ingestion/stream/modbus
{
  "device_id": 1,
  "register_address": 40001,
  "value": 67.8,
  "metadata": {"unit": "C", "sensor_type": "temperature"}
}

# دریافت آمار Latency
GET /data-ingestion/edge-stream/stats
```

### تنظیمات

```bash
EDGE_COMPUTING_ENABLED=true
KAFKA_LOW_LATENCY_MODE=true
```

---

## <a name="sensor-health"></a>🔍 Sensor Health Monitoring & Drift Detection

### نمای کلی

الگوریتم خودکار شناسایی انحراف سنسور (Sensor Drift) و اصلاح داده‌ها قبل از ورود به مدل‌های ML.

### الگوریتم Drift Detection

#### 1. Baseline Calculation
- استفاده از median اولین 20% داده‌ها به عنوان baseline
- ذخیره baseline برای هر سنسور

#### 2. Drift Detection
- محاسبه deviation از baseline
- استفاده از threshold (پیش‌فرض: 10%)
- تشخیص drift با Z-score analysis

#### 3. Data Correction
- اصلاح خودکار داده‌های دارای drift
- استفاده از correction factor برای partial correction
- حفظ traceability برای audit

### Health Score

```python
Health Score = 1.0 - (drift_penalty + range_penalty)

# Health Levels:
# 0.9 - 1.0: Good
# 0.7 - 0.9: Degraded
# 0.5 - 0.7: Poor
# < 0.5: Failed
```

### استفاده

```python
# دریافت سلامت یک سنسور
GET /data-ingestion/sensor-health/{sensor_id}

# پاسخ
{
  "health_score": 0.85,
  "drift_detected": true,
  "drift_magnitude": 0.12,
  "calibration_needed": false,
  "last_check": "2025-12-15T10:30:00Z"
}

# دریافت سلامت همه سنسورها
GET /data-ingestion/sensor-health
```

### یکپارچه‌سازی خودکار

Sensor Health Monitoring به صورت خودکار در Data Ingestion Service یکپارچه شده است:

```python
# در /ingest endpoint
health_status = sensor_health_monitor.assess_health(...)
if health_status.correction_applied:
    final_value = health_status.corrected_value
```

---

## <a name="secure-workflow"></a>🔐 Secure Command Workflow

### نمای کلی

چرخه کنترل امن دو مرحله‌ای که ترکیب تاییدیه دو مرحله‌ای (2FA) با شبیه‌سازی همزاد دیجیتال (Digital Twin) قبل از اجرای فرمان را فراهم می‌کند.

### مراحل Workflow

```
1. Request Command
   │
   ▼
2. Two-Factor Authentication (2FA)
   │
   ▼
3. Digital Twin Simulation
   │
   ▼
4. Simulation Review & Approval
   │
   ▼
5. Execute Command
```

### استفاده

#### Stage 1: Request Command

```python
POST /command-control/commands/secure
{
  "command_type": "setpoint",
  "parameters": {"value": 450.0},
  "well_name": "WELL-001",
  "equipment_id": "PUMP-001"
}

# پاسخ
{
  "command_id": "CMD-SECURE-...",
  "stage": "requested",
  "next_step": "two_factor_authentication"
}
```

#### Stage 2: Verify 2FA

```python
POST /command-control/commands/secure
{
  "command_type": "setpoint",
  "parameters": {"value": 450.0},
  "well_name": "WELL-001",
  "equipment_id": "PUMP-001",
  "two_fa_code": "123456"  # 2FA code
}

# پاسخ
{
  "command_id": "CMD-SECURE-...",
  "stage": "digital_twin_simulation",
  "simulation_result": {...},
  "next_step": "review_simulation"
}
```

#### Stage 3: Approve Simulation

```python
POST /command-control/commands/secure/{command_id}/approve
{
  "approval_notes": "Simulation results acceptable"
}

# پاسخ
{
  "command_id": "CMD-SECURE-...",
  "stage": "simulation_approved",
  "next_step": "execute"
}
```

#### Stage 4: Execute

```python
POST /command-control/commands/secure/{command_id}/execute

# پاسخ
{
  "command_id": "CMD-SECURE-...",
  "stage": "executed",
  "execution_timestamp": "2025-12-15T10:30:00Z"
}
```

### بررسی وضعیت

```python
GET /command-control/commands/secure/{command_id}/status

# پاسخ
{
  "command_id": "CMD-SECURE-...",
  "stage": "digital_twin_simulation",
  "two_fa_verified": true,
  "simulation_completed": true,
  "simulation_approved": false,
  "simulation_result": {
    "optimal_flow_rate": 450.5,
    "predicted_pressure": 325.2,
    "efficiency": 0.92
  }
}
```

### Safety Checks

Digital Twin Simulation شامل safety checks است:

- بررسی فشار پیش‌بینی شده
- بررسی دما
- بررسی محدوده‌های ایمن
- رد خودکار در صورت شرایط ناایمن

---

## <a name="rul-prediction"></a>⏱️ Remaining Useful Life (RUL) Prediction

### نمای کلی

مدل پیش‌بینی عمر باقی‌مانده (RUL) اختصاصی برای تجهیزات چاه‌های نفت با الگوریتم‌های Machine Learning بومی‌سازی شده.

### تجهیزات پشتیبانی شده

- **Pumps**: پمپ‌ها
- **Valves**: شیرها
- **Compressors**: کمپرسورها
- **Wellheads**: سر چاه‌ها
- **Pipelines**: خطوط لوله

### ویژگی‌های مدل

#### 1. Random Forest
- مناسب برای داده‌های tabular
- مقاوم در برابر overfitting
- تفسیرپذیری بالا

#### 2. Gradient Boosting
- دقت بالا
- مناسب برای روابط پیچیده

#### 3. Neural Network
- مناسب برای داده‌های پیچیده
- قابلیت یادگیری عمیق

### Features

#### Base Features (همه تجهیزات)
- `temperature`: دما
- `pressure`: فشار
- `vibration`: ارتعاش
- `flow_rate`: نرخ جریان
- `operating_hours`: ساعات کارکرد
- `maintenance_count`: تعداد تعمیرات
- `failure_count`: تعداد خرابی‌ها

#### Equipment-Specific Features

**Pump:**
- `pump_speed`: سرعت پمپ
- `efficiency`: راندمان
- `bearing_temperature`: دمای یاتاقان

**Valve:**
- `valve_position`: موقعیت شیر
- `actuator_pressure`: فشار عملگر
- `leak_rate`: نرخ نشتی

**Compressor:**
- `compression_ratio`: نسبت تراکم
- `discharge_temperature`: دمای تخلیه
- `oil_level`: سطح روغن

**Wellhead:**
- `well_pressure`: فشار چاه
- `production_rate`: نرخ تولید
- `choke_position`: موقعیت choke

### استفاده

```python
POST /ml-inference/rul/predict
{
  "equipment_type": "pump",
  "equipment_id": "PUMP-001",
  "features": {
    "temperature": 85.5,
    "pressure": 450.0,
    "vibration": 2.3,
    "flow_rate": 120.5,
    "operating_hours": 8760,
    "maintenance_count": 3,
    "failure_count": 0,
    "pump_speed": 1450,
    "efficiency": 0.92,
    "bearing_temperature": 75.0
  }
}

# پاسخ
{
  "equipment_id": "PUMP-001",
  "equipment_type": "pump",
  "rul_hours": 4320.5,
  "rul_days": 180.0,
  "confidence": 0.87,
  "urgency": "medium",
  "recommendation": "Schedule maintenance within 1 month",
  "maintenance_window_days": 173.0,
  "prediction_timestamp": "2025-12-15T10:30:00Z"
}
```

### Maintenance Recommendations

بر اساس RUL پیش‌بینی شده:

| RUL Days | Urgency | Recommendation |
|----------|---------|----------------|
| < 7 | Critical | Immediate maintenance required |
| 7 - 30 | High | Schedule maintenance within 1 week |
| 30 - 90 | Medium | Schedule maintenance within 1 month |
| > 90 | Low | Routine maintenance sufficient |

### Training Model

```python
# Train RUL model (requires historical data)
POST /ml-inference/models/rul/train
{
  "equipment_type": "pump",
  "training_data": {
    "X": [[...], [...]],  # Features
    "y": [8760, 4320, ...]  # Actual RUL in hours
  },
  "model_type": "random_forest"  # or "gradient_boosting", "neural_network"
}
```

---

## 🔗 یکپارچه‌سازی

### Edge-to-Stream + Sensor Health

```python
# داده از OPC UA/Modbus → Edge-to-Stream → Sensor Health Check → Flink
stream_from_opcua(...) → assess_health(...) → Kafka → Flink
```

### Secure Workflow + Digital Twin

```python
# Command → 2FA → Digital Twin Simulation → Approval → Execution
initiate_command(...) → verify_2fa(...) → run_simulation(...) → approve(...) → execute(...)
```

### RUL + Maintenance Planning

```python
# RUL Prediction → ERP Integration → Work Order
predict_rul(...) → create_work_order(...) → SAP/Oracle
```

---

## 📊 Monitoring

### Metrics

```promql
# Edge-to-Stream Latency
edge_stream_latency_ms{percentile="p95"}

# Sensor Health
sensor_health_score{sensor_id="TAG-001"}
sensor_drift_detected_total{sensor_id="TAG-001"}

# Secure Workflow
secure_command_stage_total{stage="two_fa_verified"}
secure_command_executed_total

# RUL Prediction
rul_prediction_hours{equipment_type="pump"}
rul_maintenance_urgency_total{urgency="critical"}
```

---

## 🔗 منابع بیشتر

- [OGIM Architecture](./ARCHITECTURE.md)
- [Advanced Features](./ADVANCED_FEATURES.md)
- [ML Operations](./ML_OPERATIONS.md)

---

**نسخه:** 1.0.0  
**به‌روزرسانی:** دسامبر 2025

