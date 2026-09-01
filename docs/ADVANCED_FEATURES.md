# ویژگی‌های پیشرفته OGIM

این مستند راهنمای ویژگی‌های پیشرفته سیستم OGIM است که برای محیط‌های صنعتی و دورافتاده طراحی شده‌اند.

## 📋 فهرست مطالب

1. [Edge Computing Layer](#edge-computing)
2. [امنیت صنعتی (Industrial Security)](#industrial-security)
3. [Digital Twin 3D BIM](#digital-twin-3d)
4. [اتصال 5G و Satellite](#connectivity)
5. [یکپارچگی ERP](#erp-integration)

---

## <a name="edge-computing"></a>🌐 Edge Computing Layer

### نمای کلی

Edge Computing Layer امکان پردازش و تحلیل داده‌ها را در محل (on-site) فراهم می‌کند، بدون نیاز به ارسال تمام داده‌ها به مرکز داده.

### مزایا

- ✅ **کاهش Latency**: پردازش فوری در محل
- ✅ **کاهش Bandwidth**: ارسال فقط نتایج تحلیل
- ✅ **Offline Operation**: کار در شرایط قطع ارتباط
- ✅ **Privacy**: داده‌های حساس در محل باقی می‌مانند

### معماری

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

### استفاده

```python
# ارسال داده برای تحلیل در Edge
POST /edge-computing/analyze
{
  "sensor_data": [...],
  "analysis_type": "anomaly",  # anomaly, threshold, trend, aggregation
  "well_name": "WELL-001"
}

# پاسخ
{
  "analysis_id": "EDGE-...",
  "results": {...},
  "alerts": [...],
  "processed_locally": true
}
```

### تنظیمات

```bash
EDGE_COMPUTING_ENABLED=true
EDGE_SERVICE_URL=http://edge-computing-service:8009
```

---

## <a name="industrial-security"></a>🔒 امنیت صنعتی

### نمای کلی

لایه امنیت صنعتی محافظت در برابر حملات خاص صنعتی را فراهم می‌کند:

- **Layer 1 (Physical)**: محافظت در سطح فیزیکی
- **Layer 2 (Data Link)**: محافظت در برابر ARP poisoning و MAC spoofing
- **Protocol Security**: محافظت در برابر حملات Modbus و OPC-UA

### ویژگی‌های امنیتی

#### 1. Modbus Security

```python
from industrial_security import industrial_firewall, ModbusSecurityValidator

# ثبت دستگاه مجاز
validator = ModbusSecurityValidator()
validator.register_device(device_id=1, device_key="secret_key")

# اعتبارسنجی packet
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

# اعتبارسنجی ARP
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

# اعتبارسنجی packet صنعتی
is_valid, error = industrial_firewall.validate_industrial_packet(
    protocol="modbus",
    source_ip="10.0.0.1",
    source_mac="00:11:22:33:44:55",
    packet_data=b"..."
)

# Block کردن دستگاه
industrial_firewall.block_device("10.0.0.100", "ip")
```

### محافظت در برابر حملات

| نوع حمله | محافظت |
|---------|--------|
| Packet Injection | ✅ Transaction ID validation |
| Replay Attack | ✅ Command history tracking |
| ARP Poisoning | ✅ MAC-IP binding validation |
| MAC Spoofing | ✅ Device fingerprinting |
| Rate Limiting | ✅ Command rate limiting |
| Unauthorized Writes | ✅ Address range validation |

### تنظیمات

```bash
INDUSTRIAL_SECURITY_ENABLED=true
MODBUS_SECURITY_ENABLED=true
LAYER1_SECURITY_ENABLED=true
LAYER2_SECURITY_ENABLED=true
```

---

## <a name="digital-twin-3d"></a>🎨 Digital Twin 3D BIM

### نمای کلی

Digital Twin 3D BIM مدل‌های سه‌بعدی تعاملی از تجهیزات را با وضعیت لحظه‌ای نمایش می‌دهد.

### ویژگی‌ها

- ✅ **3D Models**: مدل‌های سه‌بعدی تجهیزات
- ✅ **Real-time State**: وضعیت لحظه‌ای از سنسورها
- ✅ **Color Coding**: رنگ‌بندی بر اساس وضعیت
- ✅ **Animation**: انیمیشن برای هشدارها
- ✅ **Interactive**: قابلیت تعامل با مدل

### API

```python
# دریافت صحنه 3D کامل
GET /digital-twin/bim3d/scene/{well_name}

# پاسخ
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

# دریافت وضعیت یک مدل خاص
GET /digital-twin/bim3d/model/{model_id}/state
```

### یکپارچه‌سازی Frontend

```typescript
// استفاده از Three.js یا Babylon.js برای رندرینگ 3D
import * as THREE from 'three';

// بارگذاری مدل 3D
const scene = await fetch('/api/digital-twin/bim3d/scene/WELL-001');
const { models, states } = await scene.json();

// ایجاد مدل 3D
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

## <a name="connectivity"></a>📡 اتصال 5G و Satellite

### نمای کلی

Connectivity Manager مدیریت چندگانه اتصال را با failover خودکار فراهم می‌کند.

### انواع اتصال

| نوع | Latency | Bandwidth | Cost | Use Case |
|-----|---------|-----------|------|----------|
| Ethernet | < 1ms | High | Low | Local network |
| 5G | 5-20ms | Very High | Medium | Remote fields |
| 4G | 20-50ms | High | Medium | Backup |
| Satellite | 500-700ms | Medium | High | Very remote |

### استفاده

```python
from connectivity_manager import connectivity_manager, ConnectionType

# ثبت اتصال 5G
connectivity_manager.register_connection(
    connection_id="5g-primary",
    connection_type=ConnectionType.CELLULAR_5G,
    config={
        "test_host": "8.8.8.8",
        "test_port": 53,
        "cost_per_mb": 0.01
    }
)

# ثبت اتصال Satellite
connectivity_manager.register_connection(
    connection_id="satellite-backup",
    connection_type=ConnectionType.SATELLITE,
    config={
        "satellite_gateway": "satellite.example.com",
        "port": 53,
        "cost_per_mb": 0.05
    }
)

# انتخاب بهترین اتصال
best_connection = await connectivity_manager.select_best_connection()

# شروع monitoring
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

### تنظیمات

```bash
CONNECTIVITY_MANAGER_ENABLED=true
CONNECTION_PRIORITY=ethernet,5g,4g,satellite
```

---

## <a name="erp-integration"></a>🔗 یکپارچگی ERP

### نمای کلی

ERP Integration Service امکان اتصال به سیستم‌های مدیریت منابع سازمانی (SAP, Oracle, Maximo) را فراهم می‌کند.

### ویژگی‌ها

- ✅ **Work Order Creation**: ایجاد خودکار Work Order از Alert
- ✅ **Status Tracking**: ردیابی وضعیت Work Order
- ✅ **Multi-ERP Support**: پشتیبانی از چندین سیستم ERP
- ✅ **Auto-Integration**: یکپارچگی خودکار با Alert Service

### استفاده

#### 1. اتصال به SAP

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

#### 2. ایجاد Work Order دستی

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

#### 3. ایجاد خودکار از Alert

```python
# فعال‌سازی auto-create
ERP_AUTO_CREATE_WORK_ORDERS=true

# هنگام ایجاد Alert بحرانی، Work Order به صورت خودکار ایجاد می‌شود
POST /alert-service/alerts
{
  "severity": "critical",
  ...
}
# → Work Order در SAP ایجاد می‌شود
```

### جریان کار

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

### تنظیمات

```bash
ERP_INTEGRATION_ENABLED=true
ERP_SERVICE_URL=http://erp-integration-service:8010
ERP_DEFAULT_SYSTEM=sap
ERP_AUTO_CREATE_WORK_ORDERS=true
```

---

## 🔧 یکپارچه‌سازی با سیستم موجود

### Edge Computing + Data Ingestion

```python
# در data-ingestion-service
if settings.EDGE_COMPUTING_ENABLED:
    # ارسال به Edge برای پردازش اولیه
    edge_result = await edge_service.analyze(sensor_data)
    # فقط نتایج مهم به Cloud ارسال می‌شوند
```

### Industrial Security + Modbus

```python
# در data-ingestion-service
modbus_client = ModbusTCPClient(host, port)
# تمام packetها به صورت خودکار validate می‌شوند
```

### Digital Twin 3D + Real-time Data

```python
# Digital Twin به صورت خودکار از TimescaleDB داده می‌خواند
# و وضعیت لحظه‌ای را در مدل 3D نمایش می‌دهد
```

### ERP + Alert Service

```python
# Alert Service به صورت خودکار Work Order ایجاد می‌کند
# برای Alertهای بحرانی
```

---

## 📊 Monitoring و Metrics

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

## 🔗 منابع بیشتر

- [OGIM Architecture](./ARCHITECTURE.md)
- [Edge Computing Best Practices](https://www.edgecomputing.org/)
- [Industrial Security Standards](https://www.isa.org/)
- [SAP Integration Guide](https://help.sap.com/)

---

**نسخه:** 1.0.0  
**به‌روزرسانی:** دسامبر 2025

