# عملیات در حالت قطع ارتباط (Disconnected Operation)

## 📋 خلاصه

این مستندات نحوه کار Edge Computing در حالت قطع ارتباط با سرور مرکزی را توضیح می‌دهد.

## 🎯 اهداف

1. **Local Processing**: پردازش داده‌ها در محل بدون نیاز به سرور مرکزی
2. **Critical Decision Making**: تصمیم‌گیری‌های حیاتی در حالت offline
3. **Data Buffering**: ذخیره داده‌ها برای sync بعدی
4. **Automatic Sync**: همگام‌سازی خودکار هنگام برقراری ارتباط

## 🏗️ معماری

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
│  │  - Local Analysis             │  │
│  │  - Critical Alerts            │  │
│  │  - Local Decisions            │  │
│  └───────────┬──────────────────┘  │
│              ▼                      │
│  ┌──────────────────────────────┐  │
│  │  Disconnected Operation       │  │
│  │  - Local Storage (SQLite)     │  │
│  │  - Offline Buffer             │  │
│  │  - Connection Monitor         │  │
│  └───────────┬──────────────────┘  │
│              │                      │
│              ▼                      │
│  ┌──────────────────────────────┐  │
│  │  Sync Manager                │  │
│  │  (When Online)               │  │
│  └───────────┬──────────────────┘  │
└──────────────┼──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Central Server       │
    │  (Cloud/Data Center)  │
    └──────────────────────┘
```

## ⚙️ ویژگی‌ها

### 1. Local Processing
- **Anomaly Detection**: تشخیص ناهنجاری در محل
- **Threshold Checking**: بررسی thresholdها
- **Trend Analysis**: تحلیل روند
- **Aggregation**: تجمیع داده‌ها

### 2. Critical Alerts
- ذخیره alertهای حیاتی در local storage
- ارسال فوری هنگام برقراری ارتباط
- Priority-based sync

### 3. Local Decisions
- ثبت تصمیم‌گیری‌های محلی
- Sync به سرور مرکزی
- Audit trail کامل

### 4. Data Caching
- Cache نتایج پردازش
- TTL-based expiration
- Storage management

## 🔌 API Endpoints

### Health Check
```
GET /health
```
Returns:
- Service status
- Disconnected operation status
- Pending items count

### Disconnected Status
```
GET /disconnected/status
```
Returns:
- Connection status
- Pending alerts
- Pending decisions
- Storage usage

### Pending Alerts
```
GET /disconnected/pending-alerts?limit=100
```
Returns list of pending critical alerts

### Pending Decisions
```
GET /disconnected/pending-decisions?limit=100
```
Returns list of pending local decisions

### Manual Sync
```
POST /disconnected/sync
```
Manually trigger sync of pending data

## 📊 Local Storage

### Tables

#### critical_alerts
- `alert_id`: Unique alert identifier
- `sensor_id`: Sensor identifier
- `alert_type`: Type of alert
- `severity`: Alert severity
- `message`: Alert message
- `data`: Additional data (JSON)
- `timestamp`: Alert timestamp
- `acknowledged`: Whether acknowledged
- `synced`: Whether synced to central server

#### local_decisions
- `decision_id`: Unique decision identifier
- `decision_type`: Type of decision
- `sensor_id`: Related sensor
- `action_taken`: Action taken
- `reason`: Reason for decision
- `data`: Additional data (JSON)
- `timestamp`: Decision timestamp
- `synced`: Whether synced to central server

#### processed_data_cache
- `cache_key`: Cache key
- `data`: Cached data (JSON)
- `timestamp`: Cache timestamp
- `expires_at`: Expiration time

## 🚀 استفاده

### Configuration
```python
from disconnected_operation import get_disconnected_op_manager

# Initialize manager
disconnected_op = get_disconnected_op_manager(
    data_dir="./data/edge",
    sync_interval=60,  # Sync every 60 seconds when online
    max_local_storage_mb=1000
)
```

### Add Critical Alert
```python
disconnected_op.add_critical_alert(
    alert_id="ALERT-001",
    sensor_id="SENSOR-001",
    alert_type="anomaly",
    severity="critical",
    message="Critical anomaly detected",
    data={"z_score": 4.5, "value": 150.0}
)
```

### Record Local Decision
```python
disconnected_op.record_local_decision(
    decision_id="DEC-001",
    decision_type="emergency_shutdown",
    action_taken="shutdown_pump",
    reason="Pressure exceeded critical threshold",
    sensor_id="PRESSURE-001",
    data={"pressure": 500.0, "threshold": 450.0}
)
```

### Cache Data
```python
disconnected_op.cache_processed_data(
    cache_key="aggregation:well-001:20240101",
    data={"avg": 100.5, "min": 95.0, "max": 105.0},
    ttl_seconds=3600
)

# Retrieve cached data
cached = disconnected_op.get_cached_data("aggregation:well-001:20240101")
```

## 🔄 Sync Mechanism

### Automatic Sync
- Syncs every `sync_interval` seconds when online
- Syncs critical alerts first
- Then syncs local decisions
- Marks items as synced after successful sync

### Manual Sync
```python
# Trigger immediate sync
disconnected_op._trigger_sync()
```

### Connection Monitoring
- Monitors connection status continuously
- Triggers sync when connection restored
- Enters disconnected mode when connection lost

## 📈 Monitoring

### Status Information
```python
status = disconnected_op.get_status()
# Returns:
# {
#     "is_online": True/False,
#     "last_sync_time": timestamp,
#     "pending_alerts": count,
#     "pending_decisions": count,
#     "storage_size_mb": size,
#     "connection_status": {...}
# }
```

## ✅ Best Practices

1. **Critical Alerts**: Always store critical alerts locally
2. **Local Decisions**: Record all local decisions for audit
3. **Data Caching**: Cache frequently accessed data
4. **Storage Management**: Monitor storage usage
5. **Sync Strategy**: Sync critical items first

## 🔍 Troubleshooting

### Sync Not Working
- Check connection status
- Verify sync interval
- Check pending items count
- Review logs for errors

### Storage Full
- Increase `max_local_storage_mb`
- Clean up old cached data
- Remove synced items

### Connection Issues
- Check connection monitor configuration
- Verify check URLs/hosts
- Review connection logs

## 📝 Notes

- Local storage uses SQLite for persistence
- All operations work in both online and offline modes
- Sync happens automatically when connection restored
- Critical alerts are prioritized during sync
- Storage is managed automatically with cleanup

