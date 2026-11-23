# OGIM Service Addresses

This file contains all OGIM service addresses for access and testing.

## 🌐 Frontend

| Environment | Address | Description |
|------|------|---------|
| Development | http://localhost:3000 | Vite Dev Server (default port) |
| Development (Vite) | http://localhost:5173 | Vite Dev Server (alternative port) |
| Production | http://localhost:3000 | Built |

## 🔌 Backend Services

### API Gateway (main entry point)

| Address | Description |
|------|---------|
| http://localhost:8000 | Main API Gateway |
| http://localhost:8000/docs | Swagger UI Documentation |
| http://localhost:8000/redoc | ReDoc Documentation |
| http://localhost:8000/health | Health Check |

### Microservices

| Service | Port | Base address | Health Check | Description |
|-------|------|-----------|--------------|---------|
| **Auth Service** | 8001 | http://localhost:8001 | http://localhost:8001/health | Authentication and user management |
| **Data Ingestion** | 8002 | http://localhost:8002 | http://localhost:8002/health | Receiving data from sensors |
| **ML Inference** | 8003 | http://localhost:8003 | http://localhost:8003/health | ML models and forecasting |
| **Alert Service** | 8004 | http://localhost:8004 | http://localhost:8004/health | Alert management |
| **Reporting** | 8005 | http://localhost:8005 | http://localhost:8005/health | Reporting |
| **Command Control** | 8006 | http://localhost:8006 | http://localhost:8006/health | Control and commands |
| **Tag Catalog** | 8007 | http://localhost:8007 | http://localhost:8007/health | Tag catalog |
| **Digital Twin** | 8008 | http://localhost:8008 | http://localhost:8008/health | Simulation and 3D BIM |
| **Edge Computing** | 8009 | http://localhost:8009 | http://localhost:8009/health | Edge processing |
| **ERP Integration** | 8010 | http://localhost:8010 | http://localhost:8010/health | ERP integration |

## 🗄️ Infrastructure Services

| Service | Port | Address | Description |
|-------|------|------|---------|
| **PostgreSQL** | 5432 | localhost:5432 | Main database (ogim) |
| **TimescaleDB** | 5433 | localhost:5433 | Time-series database (ogim_tsdb) |
| **Redis** | 6379 | localhost:6379 | Cache and Session Management |
| **Kafka** | 9092 | localhost:9092 | Message Broker |
| **Zookeeper** | 2181 | localhost:2181 | Kafka Coordination |

## 📡 API Endpoints

### Authentication

```
POST   /api/auth/register      - Register a new user
POST   /api/auth/login          - Log in
POST   /api/auth/refresh        - Refresh Token
POST   /api/auth/logout         - Log out
GET    /api/auth/me             - Current user information
```

### Data Ingestion

```
POST   /api/data-ingestion/ingest           - Send sensor data
POST   /api/data-ingestion/stream/opcua     - Stream from OPC UA
POST   /api/data-ingestion/stream/modbus    - Stream from Modbus
GET    /api/data-ingestion/sensor-health    - Sensor health
GET    /api/data-ingestion/edge-stream/stats - Edge-to-Stream statistics
```

### ML Inference

```
POST   /api/ml-inference/infer              - Model Inference
POST   /api/ml-inference/forecast           - Time-series forecast
POST   /api/ml-inference/rul/predict        - RUL prediction
GET    /api/ml-inference/models             - List models
POST   /api/ml-inference/models/{type}/train - Train model
```

### Alerts

```
GET    /api/alert/alerts                    - List alerts
POST   /api/alert/alerts                    - Create alert
POST   /api/alert/alerts/{id}/acknowledge   - Acknowledge alert
POST   /api/alert/alerts/{id}/resolve       - Resolve alert
GET    /api/alert/rules                     - Alert rules
```

### Command Control

```
POST   /api/command-control/commands        - Create command
POST   /api/command-control/commands/secure - Create secure command
POST   /api/command-control/commands/{id}/approve - Approve command
POST   /api/command-control/commands/{id}/execute - Execute command
GET    /api/command-control/commands       - List commands
```

### Digital Twin

```
POST   /api/digital-twin/simulate          - Run simulation
GET    /api/digital-twin/simulations       - List simulations
GET    /api/digital-twin/bim3d/scene/{well} - 3D BIM scene
GET    /api/digital-twin/bim3d/model/{id}/state - 3D model state
GET    /api/digital-twin/well/{well}/3d    - Well 3D data with trajectory and risk zone
POST   /api/digital-twin/what-if           - Run a What-if scenario
GET    /api/digital-twin/ar/overlay/{well} - Ready AR overlay payload
```

### Reporting

```
GET    /api/reporting/reports              - List reports
POST   /api/reporting/reports/generate     - Create a basic report
GET    /api/reporting/reports/{id}         - Get report
POST   /api/reporting/reports/data-quality-lineage - Data quality + lineage report
POST   /api/reporting/reports/data-quality-lineage/auto - Create an automatic report
GET    /api/reporting/reports/data-quality-lineage/auto - List automatic reports
POST   /api/reporting/reports/builder      - Advanced BI Report Builder
GET    /api/reporting/bi/metadata          - BI metadata for Power BI/Tableau
POST   /api/reporting/bi/query             - Query endpoint for BI
GET    /api/reporting/bi/connectors        - BI connection template
POST   /api/reporting/workflows            - Create workflow
GET    /api/reporting/workflows            - List workflows
GET    /api/reporting/workflows/{id}       - Workflow details
POST   /api/reporting/workflows/{id}/run   - Run workflow
GET    /api/reporting/workflows/{id}/runs  - Run history
GET    /api/reporting/workflows/visual-builder/step-types - Step catalog
```

### Realtime Streaming (Gateway)

```
WS     /stream/realtime/ws?token=...       - Real-time stream with WebSocket
GET    /stream/realtime/sse?token=...      - Fallback to SSE
```

### Alert Advanced

```
GET    /api/alert/alerts/correlations      - Alert correlation grouping
POST   /api/alert/alerts/{id}/rca          - Root cause analysis (RCA)
POST   /api/alert/notifications/devices/register   - Register Push token
POST   /api/alert/notifications/devices/unregister - Remove Push token
GET    /api/alert/notifications/devices            - List devices (admin)
```

### ML Model Management Advanced

```
GET    /api/ml-inference/models/{type}/versions           - Model versions
POST   /api/ml-inference/models/{type}/compare            - Compare baseline/candidate
POST   /api/ml-inference/models/{type}/ab-test            - Configure A/B test
GET    /api/ml-inference/models/{type}/ab-test            - A/B test status
POST   /api/ml-inference/models/{type}/drift/baseline     - baseline drift
POST   /api/ml-inference/models/{type}/drift/detect       - Drift detection
```

## 🔐 Default Credentials

### Default users

| Username | Password | Role |
|----------|----------|------|
| admin | Admin@123 | system_admin |
| operator1 | Operator@123 | field_operator |
| engineer1 | Engineer@123 | data_engineer |
| viewer1 | Viewer@123 | viewer |

### Database Credentials

```
Database: ogim
Username: ogim_user
Password: ogim_password

TimescaleDB: ogim_tsdb
Username: ogim_user
Password: ogim_password
```

## 🧪 Quick test

### Checking service health

```bash
# API Gateway
curl http://localhost:8000/health

# Other services
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:8004/health
curl http://localhost:8005/health
curl http://localhost:8006/health
curl http://localhost:8007/health
curl http://localhost:8008/health
```

### Testing authentication

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

### Testing Data Ingestion

```bash
# Send data (requires a Token)
curl -X POST http://localhost:8000/api/data-ingestion/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "source": "test",
    "records": [{
      "timestamp": "2025-12-15T10:00:00Z",
      "well_name": "WELL-001",
      "equipment_type": "pump",
      "sensor_type": "pressure",
      "value": 450.5,
      "unit": "bar",
      "sensor_id": "TAG-001",
      "data_quality": "good"
    }]
  }'
```

---

**Note**: All addresses are for the Development environment. For Production, the addresses must be changed.

