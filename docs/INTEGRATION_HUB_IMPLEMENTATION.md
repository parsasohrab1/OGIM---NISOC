# 🔗 Integration Hub - راهنمای پیاده‌سازی

## 📋 فهرست مطالب

1. [نمای کلی](#overview)
2. [معماری](#architecture)
3. [Pre-built Connectors](#pre-built-connectors)
4. [Custom Connector Builder](#custom-connector-builder)
5. [Integration Marketplace](#integration-marketplace)
6. [API Documentation](#api-documentation)
7. [Integration Testing Tools](#testing-tools)
8. [پیاده‌سازی](#implementation)

---

## <a name="overview"></a>🎯 نمای کلی

Integration Hub یک پلتفرم مرکزی برای مدیریت و یکپارچه‌سازی سیستم OGIM با سیستم‌های خارجی است. این Hub امکان اتصال سریع و آسان به سیستم‌های مختلف را فراهم می‌کند.

### ویژگی‌های کلیدی

- ✅ **Pre-built Connectors**: اتصال آماده به سیستم‌های رایج
- ✅ **Custom Connector Builder**: ساخت connector سفارشی
- ✅ **Integration Marketplace**: اشتراک‌گذاری connectorها
- ✅ **API Documentation**: مستندات کامل API
- ✅ **Testing Tools**: ابزارهای تست integration

---

## <a name="architecture"></a>🏗️ معماری

```
┌─────────────────────────────────────────────────────────┐
│                    Integration Hub                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Connector   │  │  Connector   │  │  Connector   │  │
│  │   Manager    │  │   Builder    │  │  Marketplace │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Connector  │  │   Connector │  │   Connector  │  │
│  │   Registry   │  │   Runtime   │  │   Testing    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   External   │    │   External   │    │   External   │
│   System 1   │    │   System 2   │    │   System N   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### اجزای اصلی

1. **Connector Manager**: مدیریت connectorها
2. **Connector Builder**: ساخت connectorهای سفارشی
3. **Connector Registry**: ثبت و نگهداری connectorها
4. **Connector Runtime**: اجرای connectorها
5. **Connector Testing**: تست connectorها
6. **Marketplace**: اشتراک‌گذاری connectorها

---

## <a name="pre-built-connectors"></a>🔌 Pre-built Connectors

### سیستم‌های پشتیبانی شده

#### 1. ERP Systems

##### SAP
```python
# Connector: SAPConnector
from integration_hub.connectors.sap import SAPConnector

connector = SAPConnector(
    base_url="https://sap.example.com",
    client_id="client123",
    client_secret="secret123",
    username="user",
    password="pass"
)

# ایجاد Work Order
work_order = await connector.create_work_order({
    "equipment_id": "PUMP-001",
    "description": "Maintenance required",
    "priority": "high"
})
```

**قابلیت‌ها:**
- Work Order Management
- Equipment Data Sync
- Maintenance Scheduling
- Inventory Management

##### Oracle ERP
```python
from integration_hub.connectors.oracle import OracleERPConnector

connector = OracleERPConnector(
    base_url="https://oracle.example.com",
    api_key="api_key_here"
)
```

##### Microsoft Dynamics
```python
from integration_hub.connectors.dynamics import DynamicsConnector

connector = DynamicsConnector(
    tenant_id="tenant_id",
    client_id="client_id",
    client_secret="client_secret"
)
```

#### 2. CMMS Systems

##### Maximo
```python
from integration_hub.connectors.maximo import MaximoConnector

connector = MaximoConnector(
    base_url="https://maximo.example.com",
    username="user",
    password="pass"
)
```

##### SAP PM (Plant Maintenance)
```python
from integration_hub.connectors.sap_pm import SAPPMConnector
```

#### 3. SCADA/PLC Systems

##### OPC UA
```python
from integration_hub.connectors.opcua import OPCUAConnector

connector = OPCUAConnector(
    endpoint_url="opc.tcp://localhost:4840",
    security_policy="Basic256Sha256",
    security_mode="SignAndEncrypt"
)
```

##### Modbus TCP
```python
from integration_hub.connectors.modbus import ModbusTCPConnector

connector = ModbusTCPConnector(
    host="192.168.1.100",
    port=502
)
```

#### 4. Cloud Services

##### AWS IoT Core
```python
from integration_hub.connectors.aws_iot import AWSIoTConnector

connector = AWSIoTConnector(
    endpoint="xxxxx.iot.region.amazonaws.com",
    thing_name="ogim-device-001",
    certificate_path="/path/to/cert.pem"
)
```

##### Azure IoT Hub
```python
from integration_hub.connectors.azure_iot import AzureIoTHubConnector

connector = AzureIoTHubConnector(
    connection_string="HostName=...",
    device_id="device-001"
)
```

#### 5. Analytics & BI Tools

##### Tableau
```python
from integration_hub.connectors.tableau import TableauConnector

connector = TableauConnector(
    server_url="https://tableau.example.com",
    site_id="site_id",
    username="user",
    password="pass"
)
```

##### Power BI
```python
from integration_hub.connectors.powerbi import PowerBIConnector

connector = PowerBIConnector(
    tenant_id="tenant_id",
    client_id="client_id",
    client_secret="client_secret"
)
```

##### Grafana
```python
from integration_hub.connectors.grafana import GrafanaConnector

connector = GrafanaConnector(
    base_url="https://grafana.example.com",
    api_key="api_key"
)
```

#### 6. Communication Services

##### Email (SMTP)
```python
from integration_hub.connectors.email import EmailConnector

connector = EmailConnector(
    smtp_server="smtp.example.com",
    smtp_port=587,
    username="user",
    password="pass"
)
```

##### SMS (Twilio)
```python
from integration_hub.connectors.sms import TwilioConnector

connector = TwilioConnector(
    account_sid="account_sid",
    auth_token="auth_token",
    from_number="+1234567890"
)
```

##### Slack
```python
from integration_hub.connectors.slack import SlackConnector

connector = SlackConnector(
    webhook_url="https://hooks.slack.com/services/...",
    channel="#alerts"
)
```

##### Microsoft Teams
```python
from integration_hub.connectors.teams import TeamsConnector

connector = TeamsConnector(
    webhook_url="https://outlook.office.com/webhook/..."
)
```

#### 7. Weather Services

##### OpenWeatherMap
```python
from integration_hub.connectors.weather import OpenWeatherMapConnector

connector = OpenWeatherMapConnector(
    api_key="api_key"
)
```

---

## <a name="custom-connector-builder"></a>🛠️ Custom Connector Builder

### ساخت Connector سفارشی

#### 1. تعریف Connector Schema

```python
from integration_hub.builder import ConnectorBuilder, ConnectorSchema

schema = ConnectorSchema(
    name="CustomSystemConnector",
    version="1.0.0",
    description="Connector for custom system",
    author="Your Name",
    category="custom",
    
    # Configuration fields
    config_fields=[
        {
            "name": "base_url",
            "type": "string",
            "required": True,
            "description": "Base URL of the system"
        },
        {
            "name": "api_key",
            "type": "string",
            "required": True,
            "secret": True,
            "description": "API key for authentication"
        }
    ],
    
    # Actions
    actions=[
        {
            "name": "get_data",
            "description": "Get data from system",
            "parameters": [
                {
                    "name": "resource_id",
                    "type": "string",
                    "required": True
                }
            ]
        },
        {
            "name": "send_data",
            "description": "Send data to system",
            "parameters": [
                {
                    "name": "data",
                    "type": "object",
                    "required": True
                }
            ]
        }
    ]
)
```

#### 2. پیاده‌سازی Connector

```python
from integration_hub.builder import BaseConnector

class CustomSystemConnector(BaseConnector):
    """Custom system connector implementation"""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.base_url = config["base_url"]
        self.api_key = config["api_key"]
        self.session = None
    
    async def connect(self) -> bool:
        """Establish connection to the system"""
        try:
            # Implement connection logic
            self.session = await self._create_session()
            return True
        except Exception as e:
            self.logger.error(f"Connection failed: {e}")
            return False
    
    async def disconnect(self):
        """Close connection"""
        if self.session:
            await self.session.close()
    
    async def get_data(self, resource_id: str) -> dict:
        """Get data from system"""
        url = f"{self.base_url}/api/resources/{resource_id}"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        async with self.session.get(url, headers=headers) as response:
            return await response.json()
    
    async def send_data(self, data: dict) -> dict:
        """Send data to system"""
        url = f"{self.base_url}/api/data"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        async with self.session.post(url, json=data, headers=headers) as response:
            return await response.json()
    
    async def health_check(self) -> bool:
        """Check system health"""
        try:
            url = f"{self.base_url}/health"
            async with self.session.get(url) as response:
                return response.status == 200
        except:
            return False
```

#### 3. ثبت Connector

```python
from integration_hub.registry import ConnectorRegistry

registry = ConnectorRegistry()

# Register connector
registry.register(
    connector_class=CustomSystemConnector,
    schema=schema,
    enabled=True
)
```

#### 4. استفاده از Connector Builder UI

```typescript
// Frontend: Connector Builder Component
import { ConnectorBuilder } from '@/components/ConnectorBuilder';

<ConnectorBuilder
  onSave={(connector) => {
    // Save connector definition
    api.post('/integration-hub/connectors', connector);
  }}
/>
```

---

## <a name="integration-marketplace"></a>🛒 Integration Marketplace

### ویژگی‌های Marketplace

1. **Connector Discovery**: جستجو و کشف connectorها
2. **Rating & Reviews**: امتیازدهی و نظرات
3. **Version Management**: مدیریت نسخه‌ها
4. **Installation**: نصب آسان connectorها
5. **Updates**: به‌روزرسانی خودکار

### API Endpoints

```python
# لیست connectorهای موجود
GET /integration-hub/marketplace/connectors
Query Parameters:
  - category: Filter by category
  - search: Search term
  - sort: Sort by (popularity, rating, date)
  - page: Page number
  - limit: Items per page

# جزئیات connector
GET /integration-hub/marketplace/connectors/{connector_id}

# نصب connector
POST /integration-hub/marketplace/connectors/{connector_id}/install

# ارسال connector به marketplace
POST /integration-hub/marketplace/connectors
Body: {
  "connector_id": "...",
  "name": "...",
  "description": "...",
  "category": "...",
  "version": "...",
  "public": true
}

# امتیازدهی
POST /integration-hub/marketplace/connectors/{connector_id}/rate
Body: {
  "rating": 5,
  "review": "Great connector!"
}
```

### Frontend Marketplace UI

```typescript
// Marketplace Page
import { Marketplace } from '@/pages/Marketplace';

<Marketplace
  categories={['ERP', 'CMMS', 'SCADA', 'Cloud', 'Analytics']}
  onInstall={(connector) => {
    // Install connector
    api.post(`/integration-hub/marketplace/connectors/${connector.id}/install`);
  }}
/>
```

---

## <a name="api-documentation"></a>📚 API Documentation

### Interactive API Documentation

#### 1. OpenAPI/Swagger Integration

```python
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="OGIM Integration Hub API",
    version="1.0.0",
    description="Comprehensive API for OGIM Integration Hub"
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="OGIM Integration Hub API",
        version="1.0.0",
        description="""
        ## Integration Hub API
        
        این API امکان مدیریت connectorها و integrations را فراهم می‌کند.
        
        ### ویژگی‌ها:
        - مدیریت connectorها
        - ساخت connectorهای سفارشی
        - تست integrations
        - مدیریت marketplace
        """,
        routes=app.routes,
    )
    
    # Add connector schemas
    openapi_schema["components"]["schemas"].update({
        "Connector": {...},
        "ConnectorConfig": {...},
        "Integration": {...}
    })
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

#### 2. API Documentation UI

```typescript
// API Documentation Page
import { APIDocumentation } from '@/pages/APIDocumentation';

<APIDocumentation
  apiUrl="/api/v1"
  swaggerUrl="/api/v1/openapi.json"
  examples={[
    {
      endpoint: "POST /connectors",
      description: "Create a new connector",
      request: {
        method: "POST",
        url: "/api/v1/connectors",
        headers: {
          "Authorization": "Bearer <token>",
          "Content-Type": "application/json"
        },
        body: {
          name: "MyConnector",
          type: "custom",
          config: {...}
        }
      },
      response: {
        status: 201,
        body: {
          connector_id: "conn_123",
          status: "created"
        }
      }
    }
  ]}
/>
```

#### 3. Code Examples

```python
# Python SDK
from ogim_integration_hub import IntegrationHubClient

client = IntegrationHubClient(
    base_url="https://api.ogim.example.com",
    api_key="your_api_key"
)

# List connectors
connectors = client.connectors.list()

# Create connector
connector = client.connectors.create(
    name="MyConnector",
    type="custom",
    config={...}
)

# Test connector
result = client.connectors.test(connector_id="conn_123")
```

```javascript
// JavaScript SDK
import { IntegrationHubClient } from '@ogim/integration-hub';

const client = new IntegrationHubClient({
  baseUrl: 'https://api.ogim.example.com',
  apiKey: 'your_api_key'
});

// List connectors
const connectors = await client.connectors.list();

// Create connector
const connector = await client.connectors.create({
  name: 'MyConnector',
  type: 'custom',
  config: {...}
});

// Test connector
const result = await client.connectors.test('conn_123');
```

---

## <a name="testing-tools"></a>🧪 Integration Testing Tools

### 1. Connector Testing Framework

```python
from integration_hub.testing import ConnectorTester, TestCase

class CustomConnectorTests(TestCase):
    """Test cases for custom connector"""
    
    async def test_connection(self):
        """Test connector connection"""
        connector = CustomSystemConnector({
            "base_url": "https://test.example.com",
            "api_key": "test_key"
        })
        
        result = await connector.connect()
        self.assertTrue(result)
    
    async def test_get_data(self):
        """Test get data action"""
        connector = await self.get_connector()
        data = await connector.get_data("resource_123")
        
        self.assertIsNotNone(data)
        self.assertIn("id", data)
    
    async def test_send_data(self):
        """Test send data action"""
        connector = await self.get_connector()
        result = await connector.send_data({
            "key": "value"
        })
        
        self.assertEqual(result["status"], "success")

# Run tests
tester = ConnectorTester()
tester.run(CustomConnectorTests)
```

### 2. Integration Testing UI

```typescript
// Integration Testing Page
import { IntegrationTester } from '@/pages/IntegrationTester';

<IntegrationTester
  connectorId="conn_123"
  onTest={(testConfig) => {
    // Run integration test
    api.post(`/integration-hub/connectors/${connectorId}/test`, testConfig);
  }}
  testResults={testResults}
/>
```

### 3. Mock Server برای Testing

```python
from integration_hub.testing import MockServer

# Create mock server
mock_server = MockServer(
    base_url="https://mock.example.com",
    responses={
        "GET /api/resources/{id}": {
            "status": 200,
            "body": {"id": "123", "name": "Resource"}
        },
        "POST /api/data": {
            "status": 201,
            "body": {"status": "success"}
        }
    }
)

# Use in tests
async with mock_server:
    connector = CustomSystemConnector({
        "base_url": mock_server.url,
        "api_key": "test_key"
    })
    # Test connector...
```

---

## <a name="implementation"></a>🚀 پیاده‌سازی

### ساختار فایل‌ها

```
backend/
├── integration-hub-service/
│   ├── main.py                    # FastAPI application
│   ├── connectors/
│   │   ├── __init__.py
│   │   ├── base.py                # Base connector class
│   │   ├── sap.py                 # SAP connector
│   │   ├── oracle.py              # Oracle connector
│   │   ├── maximo.py              # Maximo connector
│   │   ├── opcua.py               # OPC UA connector
│   │   ├── modbus.py              # Modbus connector
│   │   ├── tableau.py             # Tableau connector
│   │   ├── powerbi.py             # Power BI connector
│   │   ├── email.py               # Email connector
│   │   ├── sms.py                 # SMS connector
│   │   └── weather.py             # Weather connector
│   ├── builder/
│   │   ├── __init__.py
│   │   ├── schema.py              # Connector schema
│   │   ├── builder.py             # Connector builder
│   │   └── validator.py           # Schema validator
│   ├── registry/
│   │   ├── __init__.py
│   │   ├── registry.py            # Connector registry
│   │   └── storage.py             # Storage backend
│   ├── marketplace/
│   │   ├── __init__.py
│   │   ├── marketplace.py         # Marketplace logic
│   │   └── ratings.py             # Rating system
│   ├── testing/
│   │   ├── __init__.py
│   │   ├── tester.py              # Testing framework
│   │   └── mock_server.py         # Mock server
│   ├── api/
│   │   ├── __init__.py
│   │   ├── connectors.py          # Connector endpoints
│   │   ├── marketplace.py         # Marketplace endpoints
│   │   ├── builder.py             # Builder endpoints
│   │   └── testing.py             # Testing endpoints
│   └── requirements.txt
```

### Backend Implementation

```python
# backend/integration-hub-service/main.py
from fastapi import FastAPI
from integration_hub.api import connectors, marketplace, builder, testing

app = FastAPI(
    title="OGIM Integration Hub",
    version="1.0.0"
)

app.include_router(connectors.router, prefix="/api/v1/connectors", tags=["Connectors"])
app.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["Marketplace"])
app.include_router(builder.router, prefix="/api/v1/builder", tags=["Builder"])
app.include_router(testing.router, prefix="/api/v1/testing", tags=["Testing"])
```

### Frontend Implementation

```typescript
// frontend/web/src/pages/IntegrationHub.tsx
import { useState } from 'react';
import { ConnectorList } from '@/components/ConnectorList';
import { ConnectorBuilder } from '@/components/ConnectorBuilder';
import { Marketplace } from '@/components/Marketplace';
import { IntegrationTester } from '@/components/IntegrationTester';

export function IntegrationHub() {
  const [activeTab, setActiveTab] = useState('connectors');
  
  return (
    <div className="integration-hub">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="connectors">Connectors</Tab>
        <Tab value="builder">Builder</Tab>
        <Tab value="marketplace">Marketplace</Tab>
        <Tab value="testing">Testing</Tab>
      </Tabs>
      
      {activeTab === 'connectors' && <ConnectorList />}
      {activeTab === 'builder' && <ConnectorBuilder />}
      {activeTab === 'marketplace' && <Marketplace />}
      {activeTab === 'testing' && <IntegrationTester />}
    </div>
  );
}
```

---

## 📊 معیارهای موفقیت

### معیارهای فنی
- ✅ پشتیبانی از 20+ pre-built connector
- ✅ زمان ساخت connector سفارشی < 1 ساعت
- ✅ Test coverage > 90%
- ✅ API response time < 100ms

### معیارهای کسب‌وکار
- ✅ کاهش 50% در زمان integration
- ✅ افزایش 30% در تعداد integrations
- ✅ بهبود 40% در developer experience

---

## 🔗 منابع مرتبط

- [OGIM Architecture](./ARCHITECTURE.md)
- [API Gateway](./GATEWAY_SECURITY.md)
- [ERP Integration](./ADVANCED_FEATURES.md#erp-integration)

---

**نسخه:** 1.0.0  
**تاریخ:** دسامبر 2025

