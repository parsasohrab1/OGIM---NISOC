# Advanced ML and Workflow Features

This document is a guide to the advanced ML and Workflow features of the OGIM system.

## 📋 Table of Contents

1. [Edge-to-Stream Architecture](#edge-to-stream)
2. [Sensor Health Monitoring & Drift Detection](#sensor-health)
3. [Secure Command Workflow](#secure-workflow)
4. [Remaining Useful Life (RUL) Prediction](#rul-prediction)

---

## <a name="edge-to-stream"></a>⚡ Edge-to-Stream Architecture

### Overview

A unified edge and stream processing architecture that provides data transfer from industrial protocols (OPC UA/Modbus) to Apache Flink with sub-second latency.

### Architecture

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

### Features

- ✅ **Sub-second Latency**: Latency under 1 second from Edge to Flink
- ✅ **Direct Protocol Integration**: Direct OPC UA/Modbus connection
- ✅ **Low-Latency Kafka**: Uses the Kafka Low-Latency Producer
- ✅ **Automatic Batching**: Automatic batching for optimization

### Usage

```python
# From OPC UA
POST /data-ingestion/stream/opcua
{
  "node_id": "ns=2;i=1",
  "value": 123.45,
  "metadata": {"unit": "bar", "sensor_type": "pressure"}
}

# From Modbus
POST /data-ingestion/stream/modbus
{
  "device_id": 1,
  "register_address": 40001,
  "value": 67.8,
  "metadata": {"unit": "C", "sensor_type": "temperature"}
}

# Get Latency statistics
GET /data-ingestion/edge-stream/stats
```

### Settings

```bash
EDGE_COMPUTING_ENABLED=true
KAFKA_LOW_LATENCY_MODE=true
```

---

## <a name="sensor-health"></a>🔍 Sensor Health Monitoring & Drift Detection

### Overview

An automatic algorithm for detecting sensor drift (Sensor Drift) and correcting the data before it enters the ML models.

### Drift Detection algorithm

#### 1. Baseline Calculation
- Uses the median of the first 20% of the data as the baseline
- Stores the baseline for each sensor

#### 2. Drift Detection
- Calculates the deviation from the baseline
- Uses a threshold (default: 10%)
- Detects drift with Z-score analysis

#### 3. Data Correction
- Automatic correction of data with drift
- Uses a correction factor for partial correction
- Maintains traceability for audit

### Health Score

```python
Health Score = 1.0 - (drift_penalty + range_penalty)

# Health Levels:
# 0.9 - 1.0: Good
# 0.7 - 0.9: Degraded
# 0.5 - 0.7: Poor
# < 0.5: Failed
```

### Usage

```python
# Get the health of a sensor
GET /data-ingestion/sensor-health/{sensor_id}

# Response
{
  "health_score": 0.85,
  "drift_detected": true,
  "drift_magnitude": 0.12,
  "calibration_needed": false,
  "last_check": "2025-12-15T10:30:00Z"
}

# Get the health of all sensors
GET /data-ingestion/sensor-health
```

### Automatic integration

Sensor Health Monitoring is automatically integrated into the Data Ingestion Service:

```python
# In the /ingest endpoint
health_status = sensor_health_monitor.assess_health(...)
if health_status.correction_applied:
    final_value = health_status.corrected_value
```

---

## <a name="secure-workflow"></a>🔐 Secure Command Workflow

### Overview

A secure two-step control loop that combines two-factor authentication (2FA) with Digital Twin simulation before executing a command.

### Workflow steps

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

### Usage

#### Stage 1: Request Command

```python
POST /command-control/commands/secure
{
  "command_type": "setpoint",
  "parameters": {"value": 450.0},
  "well_name": "WELL-001",
  "equipment_id": "PUMP-001"
}

# Response
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

# Response
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

# Response
{
  "command_id": "CMD-SECURE-...",
  "stage": "simulation_approved",
  "next_step": "execute"
}
```

#### Stage 4: Execute

```python
POST /command-control/commands/secure/{command_id}/execute

# Response
{
  "command_id": "CMD-SECURE-...",
  "stage": "executed",
  "execution_timestamp": "2025-12-15T10:30:00Z"
}
```

### Checking the status

```python
GET /command-control/commands/secure/{command_id}/status

# Response
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

Digital Twin Simulation includes safety checks:

- Check of the predicted pressure
- Check of the temperature
- Check of the safe ranges
- Automatic rejection in case of unsafe conditions

---

## <a name="rul-prediction"></a>⏱️ Remaining Useful Life (RUL) Prediction

### Overview

A Remaining Useful Life (RUL) prediction model dedicated to oil well equipment, with localized native Machine Learning algorithms.

### Supported equipment

- **Pumps**: Pumps
- **Valves**: Valves
- **Compressors**: Compressors
- **Wellheads**: Wellheads
- **Pipelines**: Pipelines

### Model features

#### 1. Random Forest
- Suitable for tabular data
- Robust against overfitting
- High interpretability

#### 2. Gradient Boosting
- High accuracy
- Suitable for complex relationships

#### 3. Neural Network
- Suitable for complex data
- Deep learning capability

### Features

#### Base Features (all equipment)
- `temperature`: Temperature
- `pressure`: Pressure
- `vibration`: Vibration
- `flow_rate`: Flow rate
- `operating_hours`: Operating hours
- `maintenance_count`: Number of maintenance events
- `failure_count`: Number of failures

#### Equipment-Specific Features

**Pump:**
- `pump_speed`: Pump speed
- `efficiency`: Efficiency
- `bearing_temperature`: Bearing temperature

**Valve:**
- `valve_position`: Valve position
- `actuator_pressure`: Actuator pressure
- `leak_rate`: Leak rate

**Compressor:**
- `compression_ratio`: Compression ratio
- `discharge_temperature`: Discharge temperature
- `oil_level`: Oil level

**Wellhead:**
- `well_pressure`: Well pressure
- `production_rate`: Production rate
- `choke_position`: Choke position

### Usage

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

# Response
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

Based on the predicted RUL:

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

## 🔗 Integration

### Edge-to-Stream + Sensor Health

```python
# Data from OPC UA/Modbus → Edge-to-Stream → Sensor Health Check → Flink
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

## 🔗 More resources

- [OGIM Architecture](./ARCHITECTURE.md)
- [Advanced Features](./ADVANCED_FEATURES.md)
- [ML Operations](./ML_OPERATIONS.md)

---

**Version:** 1.0.0
**Updated:** December 2025

