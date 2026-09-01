# ✅ پشتیبانی از پروتکل‌های بی‌سیم (MQTT & LoRaWAN)

## 📊 خلاصه پیاده‌سازی

پشتیبانی بومی از پروتکل‌های بی‌سیم MQTT و LoRaWAN با موفقیت پیاده‌سازی شد.

## 📡 MQTT

### ویژگی‌های پیاده‌سازی شده

1. **MQTT Client**
   - اتصال به MQTT broker
   - Subscribe به topics
   - Publish messages
   - QoS support (0, 1, 2)

2. **Message Handler**
   - پردازش خودکار پیام‌های MQTT
   - Extract sensor data
   - Validation و parsing

3. **Topic Support**
   - Wildcard topics (+ و #)
   - Multiple topic subscriptions
   - Topic-based routing

### پیکربندی

```bash
MQTT_ENABLED=true
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_USERNAME=ogim_user
MQTT_PASSWORD=ogim_password
MQTT_QOS=1
MQTT_TOPICS=sensors/+/data,sensors/+/status
```

## 📻 LoRaWAN

### ویژگی‌های پیاده‌سازی شده

1. **Network Support**
   - TTN (The Things Network)
   - ChirpStack
   - Extensible for other networks

2. **Payload Decoding**
   - Automatic JSON decoding
   - Hex decoding with custom format
   - Custom decoder support

3. **Webhook Integration**
   - TTN webhook format
   - ChirpStack webhook format
   - Automatic sensor data extraction

### پیکربندی

```bash
LORAWAN_ENABLED=true
LORAWAN_NETWORK_TYPE=ttn  # or chirpstack
LORAWAN_API_URL=https://eu1.cloud.thethings.network/api/v3
LORAWAN_API_KEY=your_api_key
LORAWAN_APP_ID=ogim-app
LORAWAN_WEBHOOK_URL=https://your-server.com/api/lorawan/webhook
```

## 📁 فایل‌های ایجاد شده

### Backend
- `backend/shared/mqtt_client.py` - MQTT Client
- `backend/shared/lorawan_client.py` - LoRaWAN Client
- `backend/data-ingestion-service/main.py` - به‌روزرسانی شده

### Documentation
- `docs/WIRELESS_PROTOCOLS.md` - مستندات کامل

## 🔌 API Endpoints

### MQTT Ingest
```
POST /data-ingestion/mqtt/ingest?topic=sensors/SENSOR-001/data
{
    "sensor_id": "SENSOR-001",
    "value": 123.45,
    "timestamp": "2025-01-15T10:30:00Z"
}
```

### LoRaWAN Webhook
```
POST /data-ingestion/lorawan/webhook
{
    "end_device_ids": {...},
    "uplink_message": {...}
}
```

### Wireless Status
```
GET /data-ingestion/wireless/status
```

## 🏗️ معماری

### MQTT Flow
```
MQTT Sensors
    │
    │ Publish
    ▼
MQTT Broker (Mosquitto)
    │
    │ Subscribe
    ▼
MQTT Client (OGIM)
    │
    │ Process
    ▼
Data Ingestion Service
    │
    ▼
Kafka / TimescaleDB
```

### LoRaWAN Flow
```
LoRaWAN Sensors
    │
    │ Radio (LoRa)
    ▼
LoRaWAN Gateway
    │
    │ Uplink
    ▼
Network Server (TTN/ChirpStack)
    │
    │ Webhook
    ▼
OGIM Data Ingestion Service
    │
    ▼
Kafka / TimescaleDB
```

## 🚀 راه‌اندازی

### 1. راه‌اندازی MQTT Broker

```bash
# Docker
docker run -it -p 1883:1883 eclipse-mosquitto

# Or install
sudo apt-get install mosquitto mosquitto-clients
```

### 2. راه‌اندازی LoRaWAN Network Server

#### TTN
1. Create account at https://www.thethingsnetwork.org/
2. Create application
3. Register devices
4. Configure webhook

#### ChirpStack
```bash
docker-compose -f docker-compose.chirpstack.yml up -d
```

### 3. پیکربندی Environment Variables

```bash
# MQTT
export MQTT_ENABLED=true
export MQTT_BROKER_HOST=localhost
export MQTT_BROKER_PORT=1883
export MQTT_TOPICS="sensors/+/data"

# LoRaWAN
export LORAWAN_ENABLED=true
export LORAWAN_NETWORK_TYPE=ttn
export LORAWAN_API_KEY=your_api_key
```

## 📊 Message Formats

### MQTT
```json
{
    "sensor_id": "SENSOR-001",
    "value": 123.45,
    "timestamp": "2025-01-15T10:30:00Z",
    "unit": "bar",
    "sensor_type": "pressure"
}
```

### LoRaWAN (TTN)
```json
{
    "end_device_ids": {
        "device_id": "sensor-001",
        "application_ids": {"application_id": "ogim-app"}
    },
    "uplink_message": {
        "frm_payload": "base64_encoded",
        "decoded_payload": {"temperature": 25.5}
    }
}
```

## ✅ وضعیت

- ✅ MQTT Client پیاده‌سازی شد
- ✅ LoRaWAN Client پیاده‌سازی شد
- ✅ TTN support اضافه شد
- ✅ ChirpStack support اضافه شد
- ✅ Payload decoding اضافه شد
- ✅ Webhook endpoints اضافه شدند
- ✅ یکپارچه‌سازی با Data Ingestion Service
- ✅ مستندات کامل نوشته شد

## 📝 نکات

- MQTT برای سنسورهای نزدیک و با برق مناسب است
- LoRaWAN برای سنسورهای دور و کم‌مصرف مناسب است
- هر دو پروتکل به صورت خودکار با Data Ingestion Service یکپارچه می‌شوند
- داده‌ها به Kafka و TimescaleDB ارسال می‌شوند
- در production از TLS برای MQTT استفاده کنید

