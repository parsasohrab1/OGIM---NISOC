# پروتکل‌های بی‌سیم (MQTT & LoRaWAN)

## 📋 خلاصه

این مستندات نحوه استفاده از پروتکل‌های بی‌سیم MQTT و LoRaWAN برای دریافت داده از سنسورهای بی‌سیم را توضیح می‌دهد.

## 📡 MQTT

### نمای کلی

MQTT (Message Queuing Telemetry Transport) یک پروتکل سبک برای ارتباطات IoT است.

### ویژگی‌ها

- ✅ **Lightweight**: پروتکل سبک و کم‌مصرف
- ✅ **Publish/Subscribe**: مدل publish/subscribe
- ✅ **QoS Levels**: سطوح مختلف کیفیت سرویس (0, 1, 2)
- ✅ **Retain Messages**: امکان retain کردن پیام‌ها
- ✅ **Wildcard Topics**: پشتیبانی از wildcards (+ و #)

### معماری

```
┌─────────────┐                    ┌─────────────┐
│  MQTT       │                    │  OGIM Data  │
│  Broker     │ ◄─── Subscribe ────│  Ingestion  │
│  (Mosquitto)│                    │  Service    │
└──────┬──────┘                    └─────────────┘
       │
       │ Publish
       │
       ▼
┌─────────────┐
│  Wireless   │
│  Sensors    │
│  (MQTT)     │
└─────────────┘
```

### پیکربندی

```bash
# Enable MQTT
MQTT_ENABLED=true

# Broker configuration
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_USERNAME=ogim_user
MQTT_PASSWORD=ogim_password
MQTT_QOS=1

# Topics to subscribe (comma-separated)
MQTT_TOPICS=sensors/+/data,sensors/+/status,alerts/#
```

### Topic Structure

```
sensors/{sensor_id}/data      # Sensor data
sensors/{sensor_id}/status    # Sensor status
alerts/{severity}/#           # Alerts (wildcard)
```

### Message Format

```json
{
    "sensor_id": "SENSOR-001",
    "value": 123.45,
    "timestamp": "2025-01-15T10:30:00Z",
    "unit": "bar",
    "sensor_type": "pressure",
    "well_name": "PROD-001",
    "equipment_type": "wellhead"
}
```

### استفاده

#### Subscribe to Topics
```python
from mqtt_client import get_mqtt_client, MQTTMessageHandler

# Create client
mqtt_client = get_mqtt_client(
    broker_host="localhost",
    broker_port=1883,
    username="ogim_user",
    password="ogim_password"
)

# Connect
mqtt_client.connect()

# Create handler
handler = MQTTMessageHandler(mqtt_client)

# Subscribe with callback
mqtt_client.subscribe("sensors/+/data", callback=handler.handle_sensor_data)
```

#### Publish Message
```python
# Publish sensor data
mqtt_client.publish(
    topic="sensors/SENSOR-001/data",
    payload={
        "sensor_id": "SENSOR-001",
        "value": 123.45,
        "timestamp": datetime.utcnow().isoformat()
    },
    qos=1
)
```

## 📻 LoRaWAN

### نمای کلی

LoRaWAN (Long Range Wide Area Network) یک پروتکل کم‌مصرف برای سنسورهای دوربرد است.

### ویژگی‌ها

- ✅ **Low Power**: مصرف انرژی بسیار کم
- ✅ **Long Range**: برد تا 15 کیلومتر
- ✅ **Network Support**: پشتیبانی از TTN و ChirpStack
- ✅ **Payload Decoding**: Decode خودکار payload
- ✅ **RSSI/SNR**: دریافت اطلاعات سیگنال

### معماری

```
┌─────────────┐                    ┌─────────────┐
│  LoRaWAN    │                    │  OGIM Data  │
│  Gateway    │                    │  Ingestion  │
└──────┬──────┘                    │  Service    │
       │                           └──────┬───────┘
       │                                  │
       │ Uplink                           │ Webhook
       │                                  │
       ▼                                  │
┌─────────────┐                          │
│  Network    │ ─────────────────────────┘
│  Server     │
│  (TTN/CS)   │
└─────────────┘
       │
       │ Radio
       │
       ▼
┌─────────────┐
│  LoRaWAN    │
│  Sensors    │
└─────────────┘
```

### پیکربندی

#### TTN (The Things Network)
```bash
LORAWAN_ENABLED=true
LORAWAN_NETWORK_TYPE=ttn
LORAWAN_API_URL=https://eu1.cloud.thethings.network/api/v3
LORAWAN_API_KEY=your_api_key
LORAWAN_APP_ID=ogim-app
LORAWAN_WEBHOOK_URL=https://your-server.com/api/lorawan/webhook
```

#### ChirpStack
```bash
LORAWAN_ENABLED=true
LORAWAN_NETWORK_TYPE=chirpstack
LORAWAN_API_URL=http://localhost:8080/api
LORAWAN_API_KEY=your_api_key
LORAWAN_WEBHOOK_URL=https://your-server.com/api/lorawan/webhook
```

### Payload Decoding

#### Default Decoder
```python
# Automatic decoding:
# - Try JSON first
# - Then try hex with simple format:
#   - Byte 0-1: Sensor type
#   - Byte 2-5: Value (IEEE 754 float)
```

#### Custom Decoder
```python
def custom_decoder(payload_bytes: bytes) -> Dict[str, Any]:
    # Custom decoding logic
    sensor_type = payload_bytes[0]
    value = struct.unpack('>f', payload_bytes[2:6])[0]
    return {
        "sensor_type": sensor_type,
        "value": value
    }

lorawan_client.decode_payload(payload_base64, decoder=custom_decoder)
```

### Webhook Format

#### TTN Uplink
```json
{
    "end_device_ids": {
        "device_id": "sensor-001",
        "application_ids": {"application_id": "ogim-app"}
    },
    "received_at": "2025-01-15T10:30:00Z",
    "uplink_message": {
        "f_port": 1,
        "f_cnt": 123,
        "frm_payload": "base64_encoded",
        "decoded_payload": {
            "temperature": 25.5,
            "humidity": 60.0
        },
        "rx_metadata": [{
            "rssi": -120,
            "snr": 5.5
        }]
    }
}
```

#### ChirpStack Uplink
```json
{
    "deviceInfo": {
        "devEui": "0102030405060708",
        "deviceName": "sensor-001"
    },
    "data": {
        "fPort": 1,
        "fCnt": 123,
        "data": "base64_encoded"
    },
    "rxInfo": [{
        "rssi": -120,
        "loRaSNR": 5.5
    }]
}
```

### استفاده

```python
from lorawan_client import get_lorawan_client

# Create client
lorawan_client = get_lorawan_client(
    network_type="ttn",
    api_url="https://eu1.cloud.thethings.network/api/v3",
    api_key="your_api_key",
    app_id="ogim-app"
)

# Add callback
def on_lorawan_message(sensor_data):
    print(f"Received from {sensor_data['device_id']}: {sensor_data['value']}")

lorawan_client.add_message_callback(on_lorawan_message)

# Handle uplink (usually via webhook)
sensor_data = lorawan_client.handle_uplink(uplink_data)
```

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

## 🚀 راه‌اندازی

### 1. راه‌اندازی MQTT Broker (Mosquitto)

```bash
# Docker
docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto

# Or install locally
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# Start broker
sudo systemctl start mosquitto
```

### 2. پیکربندی MQTT

```bash
# Create mosquitto.conf
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd

# Create user
mosquitto_passwd -c /etc/mosquitto/passwd ogim_user
```

### 3. راه‌اندازی LoRaWAN Network Server

#### TTN
1. Create account at https://www.thethingsnetwork.org/
2. Create application
3. Register devices
4. Configure webhook to point to your server

#### ChirpStack
```bash
# Docker Compose
docker-compose -f docker-compose.chirpstack.yml up -d
```

### 4. پیکربندی Environment Variables

```bash
# MQTT
export MQTT_ENABLED=true
export MQTT_BROKER_HOST=localhost
export MQTT_BROKER_PORT=1883
export MQTT_USERNAME=ogim_user
export MQTT_PASSWORD=ogim_password
export MQTT_TOPICS="sensors/+/data"

# LoRaWAN
export LORAWAN_ENABLED=true
export LORAWAN_NETWORK_TYPE=ttn
export LORAWAN_API_KEY=your_api_key
export LORAWAN_APP_ID=ogim-app
```

## 📊 Monitoring

### MQTT Statistics
- Connection status
- Subscribed topics
- Message count
- Error count

### LoRaWAN Statistics
- Network type
- Message count
- Error count
- Success rate

## ✅ Best Practices

### MQTT
1. **Use QoS 1**: برای اطمینان از delivery
2. **Topic Structure**: استفاده از ساختار منظم
3. **Authentication**: همیشه از username/password استفاده کنید
4. **TLS**: در production از MQTT over TLS استفاده کنید

### LoRaWAN
1. **Payload Size**: محدودیت 51 bytes (LoRaWAN Class A)
2. **Duty Cycle**: رعایت محدودیت‌های duty cycle
3. **Battery Management**: مدیریت مصرف باتری
4. **Decoder Configuration**: تنظیم decoder در network server

## 🔍 Troubleshooting

### MQTT Issues
- **Connection failed**: Check broker host/port
- **Authentication failed**: Verify username/password
- **No messages**: Check topic subscriptions

### LoRaWAN Issues
- **Webhook not received**: Check network server configuration
- **Payload decode failed**: Verify decoder configuration
- **No data**: Check device registration and gateway coverage

## 📝 Notes

- MQTT برای سنسورهای نزدیک و با برق مناسب است
- LoRaWAN برای سنسورهای دور و کم‌مصرف مناسب است
- هر دو پروتکل به صورت خودکار با Data Ingestion Service یکپارچه می‌شوند
- داده‌ها به Kafka و TimescaleDB ارسال می‌شوند

