# OGIM Advanced Features

This document is a guide to the advanced features of the OGIM system, designed for industrial and remote environments.

## 📋 Table of Contents

1. [Edge Computing Layer](#edge-computing)
2. [Industrial Security](#industrial-security)
3. [Digital Twin 3D BIM](#digital-twin-3d)
4. [5G and Satellite Connectivity](#connectivity)
5. [ERP Integration](#erp-integration)

---

## <a name="edge-computing"></a>🌐 Edge Computing Layer

### Overview

The Edge Computing Layer makes it possible to process and analyze data on-site, without needing to send all the data to the data center.

### Benefits

- ✅ **Reduced Latency**: Immediate on-site processing
- ✅ **Reduced Bandwidth**: Only the analysis results are sent
- ✅ **Offline Operation**: Works when the connection is lost
- ✅ **Privacy**: Sensitive data stays on-site

### Architecture

```
┌─────────────────────────────────────┐
│      Edge Device (Oil Field)        │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │  Sensors (OPC-UA/Modbus)      │  │
│  └───────────┬──────────────────┘  │
│              ▼                      │
│  ┌──────────────────────────────┐  │
│  │  Edge Computing Service       │  │
│  │  - Anomaly Detection          │  │
│  │  - Threshold Checking         │  │
│  │  - Trend Analysis             │  │
│  │  - Local ML Inference        │  │
│  └───────────┬──────────────────┘  │
│              ▼                      │
│  ┌──────────────────────────────┐  │
│  │  Results Only (Filtered)     │  │
│  └───────────┬──────────────────┘  │
└──────────────┼──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Cloud/Data Center               │
│  (Receives only processed results)   │
└─────────────────────────────────────┘
```

### Usage

```python
# Send data for analysis at the Edge
POST /edge-computing/analyze
{
  "sensor_data": [...],
  "analysis_type": "anomaly",  # anomaly, threshold, trend, aggregation
  "well_name": "WELL-001"
}

# Response
{
  "analysis_id": "EDGE-...",
  "results": {...},
  "alerts": [...],
  "processed_locally": true
}
```

### Settings

```bash
EDGE_COMPUTING_ENABLED=true
EDGE_SERVICE_URL=http://edge-computing-service:8009
```

---

## <a name="industrial-security"></a>🔒 Industrial Security

### Overview

The industrial security layer provides protection against industry-specific attacks:

- **Layer 1 (Physical)**: Protection at the physical level
- **Layer 2 (Data Link)**: Protection against ARP poisoning and MAC spoofing
- **Protocol Security**: Protection against Modbus and OPC-UA attacks

### Security features

#### 1. Modbus Security

```python
from industrial_security import industrial_firewall, ModbusSecurityValidator

# Register an authorized device
validator = ModbusSecurityValidator()
validator.register_device(device_id=1, device_key="secret_key")

# Packet validation
is_valid, error = validator.validate_modbus_packet(
    transaction_id=1,
    protocol_id=0,
    unit_id=1,
    function_code=3,
    data=b"...",
    source_ip="10.0.0.1"
)
```

#### 2. Layer 2 Security

```python
from industrial_security import Layer2Security

layer2 = Layer2Security()
layer2.register_mac_ip_binding("00:11:22:33:44:55", "10.0.0.1")

# ARP validation
is_valid, error = layer2.validate_arp_packet(
    source_mac="00:11:22:33:44:55",
    source_ip="10.0.0.1",
    target_ip="10.0.0.2",
    operation="request"
)
```

#### 3. Industrial Protocol Firewall

```python
from industrial_security import industrial_firewall

# Industrial packet validation
is_valid, error = industrial_firewall.validate_industrial_packet(
    protocol="modbus",
    source_ip="10.0.0.1",
    source_mac="00:11:22:33:44:55",
    packet_data=b"..."
)

# Block a device
industrial_firewall.block_device("10.0.0.100", "ip")
```

### Protection against attacks

| Attack type | Protection |
|---------|--------|
| Packet Injection | ✅ Transaction ID validation |
| Replay Attack | ✅ Command history tracking |
| ARP Poisoning | ✅ MAC-IP binding validation |
| MAC Spoofing | ✅ Device fingerprinting |
| Rate Limiting | ✅ Command rate limiting |
| Unauthorized Writes | ✅ Address range validation |

### Settings

```bash
INDUSTRIAL_SECURITY_ENABLED=true
MODBUS_SECURITY_ENABLED=true
LAYER1_SECURITY_ENABLED=true
LAYER2_SECURITY_ENABLED=true
```

---

## <a name="digital-twin-3d"></a>🎨 Digital Twin 3D BIM

### Overview

Digital Twin 3D BIM displays interactive 3D models of the equipment with their real-time status.

### Features

- ✅ **3D Models**: 3D models of the equipment
- ✅ **Real-time State**: Real-time status from the sensors
- ✅ **Color Coding**: Color coding by status
- ✅ **Animation**: Animation for alerts
- ✅ **Interactive**: Ability to interact with the model

### API

```python
# Get the complete 3D scene
GET /digital-twin/bim3d/scene/{well_name}

# Response
{
  "scene_id": "scene-WELL-001",
  "well_name": "WELL-001",
  "models": [
    {
      "model_id": "pump-TAG-001",
      "model_type": "pump",
      "geometry": {...},
      "position": {"x": 0, "y": 0, "z": 0},
      "metadata": {...}
    }
  ],
  "states": [
    {
      "model_id": "pump-TAG-001",
      "sensor_id": "TAG-001",
      "current_value": 123.45,
      "status": "warning",
      "color": "#ffaa00",
      "animation": "pulse"
    }
  ]
}

# Get the state of a specific model
GET /digital-twin/bim3d/model/{model_id}/state
```

### Frontend integration

```typescript
// Use Three.js or Babylon.js for 3D rendering
import * as THREE from 'three';

// Load the 3D model
const scene = await fetch('/api/digital-twin/bim3d/scene/WELL-001');
const { models, states } = await scene.json();

// Create the 3D model
models.forEach(model => {
  const geometry = new THREE.BoxGeometry(...);
  const material = new THREE.MeshBasicMaterial({ 
    color: states.find(s => s.model_id === model.model_id)?.color 
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
});
```

---

## <a name="connectivity"></a>📡 5G and Satellite Connectivity

### Overview

The Connectivity Manager provides multi-connection management with automatic failover.

### Connection types

| Type | Latency | Bandwidth | Cost | Use Case |
|-----|---------|-----------|------|----------|
| Ethernet | < 1ms | High | Low | Local network |
| 5G | 5-20ms | Very High | Medium | Remote fields |
| 4G | 20-50ms | High | Medium | Backup |
| Satellite | 500-700ms | Medium | High | Very remote |

### Usage

```python
from connectivity_manager import connectivity_manager, ConnectionType

# Register a 5G connection
connectivity_manager.register_connection(
    connection_id="5g-primary",
    connection_type=ConnectionType.CELLULAR_5G,
    config={
        "test_host": "8.8.8.8",
        "test_port": 53,
        "cost_per_mb": 0.01
    }
)

# Register a Satellite connection
connectivity_manager.register_connection(
    connection_id="satellite-backup",
    connection_type=ConnectionType.SATELLITE,
    config={
        "satellite_gateway": "satellite.example.com",
        "port": 53,
        "cost_per_mb": 0.05
    }
)

# Select the best connection
best_connection = await connectivity_manager.select_best_connection()

# Start monitoring
await connectivity_manager.start_monitoring()
```

### Failover Strategy

```
Priority Order:
1. Ethernet (if available)
2. 5G (low latency, high bandwidth)
3. 4G (backup)
4. Satellite (last resort)
```

### Settings

```bash
CONNECTIVITY_MANAGER_ENABLED=true
CONNECTION_PRIORITY=ethernet,5g,4g,satellite
```

---

## <a name="erp-integration"></a>🔗 ERP Integration

### Overview

The ERP Integration Service makes it possible to connect to enterprise resource planning systems (SAP, Oracle, Maximo).

### Features

- ✅ **Work Order Creation**: Automatic Work Order creation from an Alert
- ✅ **Status Tracking**: Work Order status tracking
- ✅ **Multi-ERP Support**: Support for multiple ERP systems
- ✅ **Auto-Integration**: Automatic integration with the Alert Service

### Usage

#### 1. Connecting to SAP

```python
POST /erp-integration/erp/connect
{
  "erp_type": "sap",
  "base_url": "https://sap.example.com",
  "username": "user",
  "password": "pass",
  "client_id": "client123",
  "client_secret": "secret123"
}
```

#### 2. Creating a manual Work Order

```python
POST /erp-integration/work-orders
{
  "equipment_id": "PUMP-001",
  "well_name": "WELL-001",
  "issue_description": "High pressure detected",
  "priority": "critical",
  "work_type": "repair",
  "estimated_duration": 120
}
```

#### 3. Automatic creation from an Alert

```python
# Enable auto-create
ERP_AUTO_CREATE_WORK_ORDERS=true

# When a critical Alert is created, a Work Order is created automatically
POST /alert-service/alerts
{
  "severity": "critical",
  ...
}
# → The Work Order is created in SAP
```

### Workflow

```
Alert Created (Critical)
    │
    ▼
Auto-create Work Order
    │
    ▼
ERP System (SAP)
    │
    ▼
Work Order Created
    │
    ▼
Linked to Alert
    │
    ▼
Status Tracking
```

### Settings

```bash
ERP_INTEGRATION_ENABLED=true
ERP_SERVICE_URL=http://erp-integration-service:8010
ERP_DEFAULT_SYSTEM=sap
ERP_AUTO_CREATE_WORK_ORDERS=true
```

---

## 🔧 Integration with the existing system

### Edge Computing + Data Ingestion

```python
# In data-ingestion-service
if settings.EDGE_COMPUTING_ENABLED:
    # Send to the Edge for initial processing
    edge_result = await edge_service.analyze(sensor_data)
    # Only the important results are sent to the Cloud
```

### Industrial Security + Modbus

```python
# In data-ingestion-service
modbus_client = ModbusTCPClient(host, port)
# All packets are validated automatically
```

### Digital Twin 3D + Real-time Data

```python
# The Digital Twin reads data from TimescaleDB automatically
# and displays the real-time status in the 3D model
```

### ERP + Alert Service

```python
# The Alert Service creates a Work Order automatically
# for critical Alerts
```

---

## 📊 Monitoring and Metrics

### Edge Computing Metrics

```promql
edge_analysis_requests_total{analysis_type="anomaly"}
edge_ml_inference_latency_seconds
edge_processed_locally_total
```

### Industrial Security Metrics

```promql
industrial_packets_validated_total{protocol="modbus"}
industrial_packets_blocked_total{reason="packet_injection"}
arp_poisoning_detected_total
```

### Connectivity Metrics

```promql
connection_status{connection_type="5g"}
connection_latency_seconds{connection_type="5g"}
connection_switches_total
```

### ERP Integration Metrics

```promql
erp_work_orders_created_total{erp_system="sap"}
erp_work_orders_auto_created_total
erp_integration_errors_total
```

---

## 🔗 More resources

- [OGIM Architecture](./ARCHITECTURE.md)
- [Edge Computing Best Practices](https://www.edgecomputing.org/)
- [Industrial Security Standards](https://www.isa.org/)
- [SAP Integration Guide](https://help.sap.com/)

---

**Version:** 1.0.0
**Updated:** December 2025

