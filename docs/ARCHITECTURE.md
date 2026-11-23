# 🏗️ OGIM System Architecture

## 📋 Table of Contents

1. [Overview](#overview)
2. [Overall architecture](#overall-architecture)
3. [System layers](#system-layers)
4. [Microservices](#microservices)
5. [Data flow](#data-flow)
6. [Data management](#data-management)
7. [Security](#security)
8. [Scalability](#scalability)

---

## <a name="overview"></a>🎯 Overview

OGIM is an intelligent monitoring and analytics system with a microservice architecture that processes, analyzes and displays oil and gas field data in real time.

### Key architectural features:
- ✅ **Microservices**: Independent, separate services
- ✅ **Event-Driven**: Event-based with Kafka
- ✅ **Stream Processing**: Stream processing with Apache Flink
- ✅ **Cloud-Native**: Ready for deployment on Kubernetes
- ✅ **Horizontally Scalable**: Horizontal scalability
- ✅ **Resilient**: Fault tolerant

---

## <a name="overall-architecture"></a>🏛️ Overall architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                     OGIM System Architecture                        │
│                        (Oil & Gas Intelligent Monitoring)           │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        🌐 Presentation Layer                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│    │ Web Portal   │    │ Mobile App   │    │  Dashboard   │      │
│    │ React + TS   │    │  (Future)    │    │  (Grafana)   │      │
│    └──────────────┘    └──────────────┘    └──────────────┘      │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        🚪 API Gateway Layer                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                     ┌──────────────────────┐                       │
│                     │   API Gateway        │                       │
│                     │   (NGINX/FastAPI)    │                       │
│                     │   - Routing          │                       │
│                     │   - Load Balancing   │                       │
│                     │   - Rate Limiting    │                       │
│                     └──────────────────────┘                       │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     🔧 Microservices Layer                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Auth Service │  │ Data Ingestion│ │ ML Inference │             │
│  │   (JWT)      │  │  (OPC UA)     │ │  (MLflow)    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │Alert Service │  │Tag Catalog   │  │ Command &    │             │
│  │              │  │  Service     │  │  Control     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │  Reporting   │  │ Digital Twin │                                │
│  │   Service    │  │   Service    │                                │
│  └──────────────┘  └──────────────┘                                │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    📨 Message Bus Layer                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                     ┌──────────────────────┐                       │
│                     │   Apache Kafka       │                       │
│                     │   Message Broker     │                       │
│                     │   - Topics           │                       │
│                     │   - Partitions       │                       │
│                     │   - Replication      │                       │
│                     └──────────────────────┘                       │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ⚡ Stream Processing Layer                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                    ┌──────────────────────┐                        │
│                    │  Apache Flink Jobs   │                        │
│                    │  - Data Cleansing    │                        │
│                    │  - Enrichment        │                        │
│                    │  - CEP               │                        │
│                    │  - Anomaly Detection │                        │
│                    └──────────────────────┘                        │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      💾 Data Storage Layer                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ PostgreSQL   │  │ TimescaleDB  │  │    Redis     │             │
│  │ (Relational) │  │ (Time-Series)│  │   (Cache)    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │
┌─────────────────────────────────────────────────────────────────────┐
│                   🏭 Data Source Layer                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  SCADA/PLC   │  │    Sensors   │  │   Modbus     │             │
│  │   (OPC UA)   │  │              │  │     TCP      │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## <a name="system-layers"></a>📚 System layers

### 1️⃣ Data Source Layer

**Responsibility:** Collecting data from physical sources

**Components:**
- SCADA Systems
- PLC Controllers
- Field Sensors
- Edge Devices

**Protocols:**
- OPC UA
- Modbus TCP
- REST API
- MQTT (future)

### 2️⃣ Data Storage Layer

**Responsibility:** Storing different kinds of data

**Components:**

| Database | Type | Use |
|----------|-----|--------|
| PostgreSQL | Relational | Structured data (users, tags, alerts) |
| TimescaleDB | Time-Series | Time-series data (sensors) |
| Redis | Cache/KV | Cache, Session, Rate Limiting |
| Kafka | Stream | Message Bus, Event Sourcing |

### 3️⃣ Stream Processing Layer

**Responsibility:** Real-time processing of data

**Apache Flink Jobs:**
- **Data Cleansing**: Cleaning and validation
- **Data Enrichment**: Enrichment with metadata
- **CEP (Complex Event Processing)**: Detecting complex patterns
- **Anomaly Detection**: Identifying anomalies
- **Aggregation**: Statistical calculations

**Features:**
- Stateful processing
- Checkpointing
- Exactly-once semantics
- Window operations (Tumbling, Sliding, Session)

### 4️⃣ Message Bus Layer

**Responsibility:** Transferring messages between services

**Apache Kafka:**

| Topic | Producer | Consumer | Description |
|-------|----------|----------|---------|
| raw-sensor-data | Data Ingestion | Flink Jobs | Raw sensor data |
| processed-data | Flink Jobs | ML Inference, Alert | Processed data |
| alerts | Flink, Alert Service | Web Portal, Email | Alerts |
| commands | Command Service | SCADA Connector | Control commands |
| audit-logs | All Services | Audit Service | Audit logs |

### 5️⃣ Microservices Layer

**Responsibility:** Business logic

[Details in the next section](#microservices)

### 6️⃣ API Gateway Layer

**Responsibility:** Traffic and security management

**Features:**
- Routing
- Load Balancing
- Authentication/Authorization
- Rate Limiting
- Request/Response transformation
- Logging & Monitoring

### 7️⃣ Presentation Layer

**Responsibility:** User interface

**Components:**
- React Web Portal
- Mobile App (future)
- Grafana Dashboards
- Jupyter Notebooks (analysis)

---

## <a name="microservices"></a>🔧 Microservices

### 1. Auth Service

**Responsibility:** User management and authentication

**Capabilities:**
- User registration & login
- JWT token generation & validation
- Password hashing (bcrypt)
- Role-based access control (RBAC)
- Session management
- Audit logging

**API Endpoints:**
- `POST /token` - Get a token
- `GET /users/me` - User information
- `POST /users` - Create a user
- `PUT /users/{id}` - Edit a user
- `DELETE /users/{id}` - Delete a user

**Database Tables:**
- users
- roles
- permissions
- audit_logs

### 2. Data Ingestion Service

**Responsibility:** Collecting data from various sources

**Capabilities:**
- OPC UA client
- Modbus TCP client
- REST API endpoint
- Kafka producer
- Data validation
- Connector management

**API Endpoints:**
- `POST /ingest` - Receive data (bulk)
- `GET /connectors` - List connectors
- `POST /connectors` - Create a connector
- `POST /opcua/start_polling` - Start polling from OPC UA

**Kafka Topics:**
- Producer: `raw-sensor-data`

### 3. ML Inference Service

**Responsibility:** Applying ML models

**Capabilities:**
- Model loading (MLflow)
- Anomaly detection (Isolation Forest)
- Failure prediction (Random Forest)
- Model versioning
- A/B testing
- Feature engineering

**API Endpoints:**
- `POST /infer` - Inference request
- `POST /train` - Train a new model
- `GET /models` - List models
- `GET /models/{id}/metrics` - Model metrics

**ML Models:**
- Isolation Forest (anomaly detection)
- Random Forest (failure prediction)
- ✅ LSTM (time series forecasting) - implemented

### 4. Alert Service

**Responsibility:** Alert management

**Capabilities:**
- Alert creation
- Rule engine
- Alert routing
- Notification (Email, SMS)
- Alert deduplication
- Escalation
- Alert history

**API Endpoints:**
- `GET /alerts` - List alerts
- `POST /alerts` - Create an alert
- `POST /alerts/{id}/acknowledge` - Acknowledge an alert
- `POST /alerts/{id}/resolve` - Resolve an alert
- `GET /rules` - Alert rules
- `POST /rules` - Create a rule

**Kafka Topics:**
- Consumer: `processed-data`, `alerts`
- Producer: `alerts`

### 5. Command & Control Service

**Responsibility:** Sending commands to equipment

**Capabilities:**
- Command queuing
- 2FA validation
- Approval workflow
- Command execution
- Rollback capability
- Audit logging

**API Endpoints:**
- `POST /commands` - Send a command
- `POST /commands/{id}/approve` - Approve a command
- `POST /commands/{id}/execute` - Execute a command
- `POST /commands/{id}/rollback` - Roll back a command
- `GET /commands/history` - Command history

**Security:**
- 2FA required for critical commands
- Role-based permissions
- Command approval workflow
- Full audit trail

### 6. Tag Catalog Service

**Responsibility:** Managing tag metadata

**Capabilities:**
- Tag CRUD operations
- Tag metadata management
- Tag search & filter
- Tag validation
- Tag versioning

**API Endpoints:**
- `GET /tags` - List tags
- `GET /tags/{id}` - Tag details
- `POST /tags` - Create a tag
- `PUT /tags/{id}` - Edit a tag
- `DELETE /tags/{id}` - Delete a tag

### 7. Reporting Service

**Responsibility:** Generating reports

**Capabilities:**
- Report generation (PDF, Excel, CSV)
- Scheduled reports
- Custom queries
- Data aggregation
- Historical analysis

### 8. Digital Twin Service

**Responsibility:** Simulation and modeling

**Capabilities:**
- Well modeling
- Production optimization
- What-if analysis
- Predictive maintenance

---

## <a name="data-flow"></a>🔄 Data flow

### 1️⃣ Data Ingestion Flow

```
SCADA/PLC
    │
    │ (OPC UA/Modbus)
    ▼
Data Ingestion Service
    │
    │ (validate & enrich)
    ▼
Kafka Topic: raw-sensor-data
    │
    ▼
Apache Flink
    │
    │ (process & analyze)
    ▼
Kafka Topic: processed-data
    │
    ├─────────────┬─────────────┐
    ▼             ▼             ▼
TimescaleDB  ML Inference  Alert Service
```

### 2️⃣ Alert Flow

```
Flink (anomaly detected)
    │
    ▼
Kafka Topic: alerts
    │
    ▼
Alert Service
    │
    ├───────────┬───────────┐
    ▼           ▼           ▼
Database   Web Portal   Email/SMS
```

### 3️⃣ Command Flow

```
Web Portal
    │
    ▼
API Gateway
    │
    ▼
Command & Control Service
    │
    │ (2FA validation)
    ▼
Approval Workflow
    │
    ▼
Kafka Topic: commands
    │
    ▼
SCADA Connector
    │
    ▼
PLC/SCADA
```

---

## <a name="data-management"></a>💾 Data management

### Data Retention Policy

| Type | Retention | Storage |
|------|-----------|---------|
| Raw sensor data | 90 days | TimescaleDB (compressed) |
| Aggregated data (1 min) | 1 year | TimescaleDB |
| Aggregated data (1 hour) | 5 years | TimescaleDB |
| Alerts | Permanent | PostgreSQL |
| Audit logs | Permanent | PostgreSQL |
| Commands | Permanent | PostgreSQL |

### Data Compression

TimescaleDB compression:
- Raw data: 10x compression ratio
- Storage savings: ~90%
- Query performance: Similar to uncompressed

### Backup Strategy

- **Daily**: Full backup (02:00 AM)
- **Hourly**: Incremental backup
- **Retention**: 30 days
- **Off-site**: Weekly backup to S3/Minio

---

## <a name="security"></a>🔐 Security

### Authentication & Authorization

- **JWT tokens**: Short-lived (30 min)
- **Refresh tokens**: Long-lived (7 days)
- **RBAC**: Role-based access control
- **2FA**: For critical operations

### Network Security

- **TLS/SSL**: All communications encrypted
- **Firewall**: Whitelist-based
- **VPN**: For remote access
- **Network segmentation**: DMZ, Internal, Database

### Data Security

- **Encryption at rest**: Database encryption
- **Encryption in transit**: TLS 1.3
- **Key management**: Vault or AWS KMS
- **PII protection**: Data masking

### Audit & Compliance

- **Audit logging**: All operations logged
- **Retention**: Permanent storage
- **Compliance**: GDPR, ISO 27001
- **Regular audits**: Quarterly

---

## <a name="scalability"></a>📈 Scalability

### Horizontal Scaling

**Stateless Services:**
- Auth Service: 3+ instances
- Data Ingestion: 5+ instances
- ML Inference: 3+ instances
- Alert Service: 3+ instances

**Stateful Services:**
- Kafka: 3+ brokers
- Flink: 5+ task managers
- PostgreSQL: Master-replica setup
- TimescaleDB: Multi-node cluster

### Load Balancing

```
                  ┌─────────────┐
                  │ Load Balancer│
                  └──────┬──────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │Instance 1│     │Instance 2│     │Instance 3│
   └─────────┘     └─────────┘     └─────────┘
```

### Auto-Scaling (Kubernetes HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ogim-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ogim-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Performance Targets

| Metric | Target | Current | Critical Controls |
|--------|--------|---------|-------------------|
| API Response Time | < 100ms | ~50ms | < 10ms |
| Throughput | 10K req/sec | 8K req/sec | 5K req/sec |
| Kafka Latency | < 50ms | ~30ms | < 5ms |
| Flink Processing | < 1 sec | ~500ms | < 10ms |
| Database Queries | < 10ms | ~5ms | < 5ms |
| End-to-End Latency | < 1 sec | ~500ms | < 10ms |
| Uptime | 99.9% | 99.95% | 99.9% |

**Note**: For critical controls, Low-Latency Mode is enabled, which brings the latency below 10ms. For more details, see [`docs/LATENCY_OPTIMIZATION.md`](LATENCY_OPTIMIZATION.md).

---

**Version:** 1.0.0
**Updated:** November 2025

