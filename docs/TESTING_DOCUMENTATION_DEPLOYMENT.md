# 🧪 راهنمای Testing, Documentation و Deployment - Phase 1

**تاریخ:** دسامبر 2025  
**نسخه:** 1.0.0  
**هدف:** راهنمای جامع برای Integration Testing، Performance Testing، User Acceptance Testing، Documentation، و Deployment

---

## 📋 فهرست مطالب

1. [Integration Testing](#integration-testing)
2. [Performance Testing](#performance-testing)
3. [User Acceptance Testing (UAT)](#uat)
4. [Documentation](#documentation)
5. [Deployment Plan](#deployment)
6. [Checklists](#checklists)

---

## <a name="integration-testing"></a>1️⃣ Integration Testing

### هدف
تست کردن تعامل بین سرویس‌های مختلف و اطمینان از صحت عملکرد end-to-end

### معماری Testing

```
┌─────────────────────────────────────────────────┐
│         Integration Test Environment              │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Test Client  │  │ Test Runner  │            │
│  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                    │
│         └──────────┬───────┘                    │
│                    │                             │
│         ┌──────────▼──────────┐                 │
│         │  Test Orchestrator  │                 │
│         └──────────┬──────────┘                 │
│                    │                             │
│    ┌───────────────┼───────────────┐            │
│    │               │               │            │
│    ▼               ▼               ▼            │
│ ┌────────┐   ┌────────┐   ┌────────┐          │
│ │Service1│   │Service2│   │Service3│          │
│ └────────┘   └────────┘   └────────┘          │
│    │             │             │               │
│    └─────────────┼─────────────┘               │
│                  │                              │
│         ┌────────▼────────┐                   │
│         │  Test Database   │                   │
│         └──────────────────┘                  │
└─────────────────────────────────────────────────┘
```

### 1. WebSocket Integration Tests

```python
# backend/tests/integration/test_websocket.py
import pytest
from fastapi.testclient import TestClient
from websockets import connect
import asyncio
import json

@pytest.mark.integration
class TestWebSocketIntegration:
    """Integration tests for WebSocket"""
    
    @pytest.fixture
    def client(self):
        """Test client"""
        return TestClient(app)
    
    @pytest.mark.asyncio
    async def test_websocket_connection(self):
        """Test WebSocket connection"""
        uri = "ws://localhost:8000/ws/test-client-123"
        
        async with connect(uri) as websocket:
            # Send subscription message
            await websocket.send(json.dumps({
                "action": "subscribe",
                "topics": ["well-data", "alerts"]
            }))
            
            # Receive confirmation
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(response)
            
            assert data["status"] == "subscribed"
            assert "well-data" in data["topics"]
            assert "alerts" in data["topics"]
    
    @pytest.mark.asyncio
    async def test_websocket_data_streaming(self):
        """Test real-time data streaming"""
        uri = "ws://localhost:8000/ws/test-client-456"
        
        async with connect(uri) as websocket:
            # Subscribe to well-data
            await websocket.send(json.dumps({
                "action": "subscribe",
                "topics": ["well-data"]
            }))
            
            # Wait for subscription confirmation
            await asyncio.wait_for(websocket.recv(), timeout=5.0)
            
            # Simulate data ingestion
            # (This would trigger Kafka message)
            
            # Receive data message
            message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            data = json.loads(message)
            
            assert data["type"] == "well-data"
            assert "well_id" in data
            assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_websocket_reconnection(self):
        """Test WebSocket auto-reconnection"""
        uri = "ws://localhost:8000/ws/test-client-789"
        
        # First connection
        async with connect(uri) as websocket1:
            await websocket1.send(json.dumps({
                "action": "subscribe",
                "topics": ["alerts"]
            }))
            await asyncio.wait_for(websocket1.recv(), timeout=5.0)
        
        # Simulate disconnection
        await asyncio.sleep(1)
        
        # Reconnect
        async with connect(uri) as websocket2:
            await websocket2.send(json.dumps({
                "action": "subscribe",
                "topics": ["alerts"]
            }))
            
            response = await asyncio.wait_for(websocket2.recv(), timeout=5.0)
            data = json.loads(response)
            
            assert data["status"] == "subscribed"
```

### 2. ML Model Integration Tests

```python
# backend/tests/integration/test_ml_models.py
import pytest
from fastapi.testclient import TestClient
import mlflow

@pytest.mark.integration
class TestMLModelIntegration:
    """Integration tests for ML Model Management"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    @pytest.fixture
    def test_model(self):
        """Create test model"""
        # Register test model in MLflow
        with mlflow.start_run():
            mlflow.log_param("model_type", "test")
            mlflow.log_metric("accuracy", 0.95)
            model_uri = mlflow.get_artifact_uri("model")
            return model_uri
    
    def test_model_listing(self, client):
        """Test model listing"""
        response = client.get("/api/v1/ml/models")
        
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert isinstance(data["models"], list)
    
    def test_model_deployment(self, client, test_model):
        """Test model deployment"""
        response = client.post(
            "/api/v1/ml/models/deploy",
            json={
                "model_name": "test-model",
                "version": "1",
                "environment": "staging"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deployed"
    
    def test_model_inference(self, client, test_model):
        """Test model inference"""
        # Deploy model first
        client.post(
            "/api/v1/ml/models/deploy",
            json={"model_name": "test-model", "version": "1"}
        )
        
        # Run inference
        response = client.post(
            "/api/v1/ml/models/infer",
            json={
                "model_name": "test-model",
                "data": {"feature1": 1.0, "feature2": 2.0}
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "prediction" in data
```

### 3. Alert Correlation Integration Tests

```python
# backend/tests/integration/test_alert_correlation.py
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

@pytest.mark.integration
class TestAlertCorrelation:
    """Integration tests for Alert Correlation"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_alert_correlation(self, client):
        """Test alert correlation"""
        # Create multiple related alerts
        alerts = [
            {
                "alert_type": "pressure_high",
                "equipment_id": "EQ-001",
                "severity": "high",
                "timestamp": datetime.utcnow().isoformat()
            },
            {
                "alert_type": "temperature_high",
                "equipment_id": "EQ-001",
                "severity": "medium",
                "timestamp": (datetime.utcnow() + timedelta(seconds=30)).isoformat()
            },
            {
                "alert_type": "vibration_high",
                "equipment_id": "EQ-001",
                "severity": "medium",
                "timestamp": (datetime.utcnow() + timedelta(seconds=60)).isoformat()
            }
        ]
        
        # Send alerts
        for alert in alerts:
            client.post("/api/v1/alerts", json=alert)
        
        # Get correlated alerts
        response = client.get("/api/v1/alerts/correlated")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have at least one correlated group
        assert len(data["correlated_groups"]) > 0
        
        # Check if alerts are grouped
        group = data["correlated_groups"][0]
        assert "primary_alert" in group
        assert "related_alerts" in group
        assert len(group["related_alerts"]) >= 2
    
    def test_root_cause_analysis(self, client):
        """Test root cause analysis"""
        # Create alerts
        alerts = [
            {
                "alert_type": "pump_failure",
                "equipment_id": "PUMP-001",
                "severity": "critical"
            },
            {
                "alert_type": "pressure_drop",
                "equipment_id": "PUMP-001",
                "severity": "high"
            }
        ]
        
        for alert in alerts:
            client.post("/api/v1/alerts", json=alert)
        
        # Get RCA
        response = client.get("/api/v1/alerts/rca/PUMP-001")
        
        assert response.status_code == 200
        data = response.json()
        assert "root_cause" in data
        assert "confidence" in data
```

### 4. Data Quality Integration Tests

```python
# backend/tests/integration/test_data_quality.py
import pytest
from fastapi.testclient import TestClient

@pytest.mark.integration
class TestDataQuality:
    """Integration tests for Data Quality"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_data_quality_validation(self, client):
        """Test data quality validation"""
        # Send data with quality issues
        data = {
            "well_id": "WELL-001",
            "pressure": None,  # Missing value
            "temperature": 150.0,  # Outlier
            "flow_rate": -10.0  # Invalid negative value
        }
        
        response = client.post("/api/v1/data/ingest", json=data)
        
        assert response.status_code == 200
        
        # Check quality score
        quality_response = client.get(f"/api/v1/data/quality/WELL-001")
        
        assert quality_response.status_code == 200
        quality_data = quality_response.json()
        
        assert "quality_score" in quality_data
        assert quality_data["quality_score"] < 0.8  # Should be low due to issues
        assert "issues" in quality_data
        assert len(quality_data["issues"]) > 0
    
    def test_data_quality_trends(self, client):
        """Test data quality trend tracking"""
        # Ingest multiple data points
        for i in range(10):
            data = {
                "well_id": "WELL-002",
                "pressure": 100.0 + i,
                "temperature": 50.0,
                "flow_rate": 10.0
            }
            client.post("/api/v1/data/ingest", json=data)
        
        # Get quality trends
        response = client.get("/api/v1/data/quality/trends/WELL-002")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "trends" in data
        assert len(data["trends"]) > 0
```

### 5. End-to-End Integration Test

```python
# backend/tests/integration/test_e2e.py
import pytest
from fastapi.testclient import TestClient
import asyncio
from websockets import connect
import json

@pytest.mark.integration
@pytest.mark.e2e
class TestEndToEnd:
    """End-to-end integration tests"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    @pytest.mark.asyncio
    async def test_complete_workflow(self, client):
        """Test complete workflow from data ingestion to alert"""
        # 1. Ingest data
        data = {
            "well_id": "WELL-E2E-001",
            "pressure": 200.0,
            "temperature": 100.0,
            "flow_rate": 15.0
        }
        
        ingest_response = client.post("/api/v1/data/ingest", json=data)
        assert ingest_response.status_code == 200
        
        # 2. Subscribe to WebSocket for real-time updates
        uri = "ws://localhost:8000/ws/e2e-client"
        
        async with connect(uri) as websocket:
            await websocket.send(json.dumps({
                "action": "subscribe",
                "topics": ["well-data", "alerts"]
            }))
            
            # Wait for subscription
            await asyncio.wait_for(websocket.recv(), timeout=5.0)
            
            # 3. Trigger ML inference
            inference_response = client.post(
                "/api/v1/ml/infer",
                json={
                    "well_id": "WELL-E2E-001",
                    "model_type": "anomaly_detection"
                }
            )
            assert inference_response.status_code == 200
            
            # 4. Check if alert is generated (if anomaly detected)
            # This would be received via WebSocket
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                alert_data = json.loads(message)
                
                if alert_data.get("type") == "alert":
                    assert "alert_id" in alert_data
                    assert "severity" in alert_data
```

### 6. Test Configuration

```python
# backend/tests/integration/conftest.py
import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Test database
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://test_user:test_pass@localhost:5432/test_db"
)

@pytest.fixture(scope="session")
def test_db():
    """Create test database"""
    engine = create_engine(TEST_DATABASE_URL)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Cleanup
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(test_db):
    """Create database session"""
    SessionLocal = sessionmaker(bind=test_db)
    session = SessionLocal()
    
    yield session
    
    session.rollback()
    session.close()

@pytest.fixture
def client(db_session):
    """Create test client"""
    app.dependency_overrides[get_db] = lambda: db_session
    return TestClient(app)
```

### 7. Running Integration Tests

```bash
# Run all integration tests
pytest backend/tests/integration/ -v -m integration

# Run specific integration test
pytest backend/tests/integration/test_websocket.py -v

# Run with coverage
pytest backend/tests/integration/ -v --cov=backend --cov-report=html
```

---

## <a name="performance-testing"></a>2️⃣ Performance Testing

### هدف
اطمینان از عملکرد سیستم در شرایط بار بالا و شناسایی bottlenecks

### Performance Test Plan

| Test Type | Target | Tool |
|-----------|--------|------|
| Latency Test | P95 < 100ms | Locust, k6 |
| Load Test | 1000+ concurrent users | Locust |
| Stress Test | System limits | Locust |
| Endurance Test | 24 hours | Locust |

### 1. WebSocket Performance Tests

```python
# backend/tests/performance/test_websocket_performance.py
import asyncio
import time
from locust import User, task, events
from websockets import connect
import json

class WebSocketUser(User):
    """Locust user for WebSocket performance testing"""
    
    def on_start(self):
        """Called when user starts"""
        self.websocket = None
        self.uri = "ws://localhost:8000/ws/load-test"
    
    async def connect(self):
        """Connect to WebSocket"""
        try:
            start_time = time.time()
            self.websocket = await connect(self.uri)
            latency = (time.time() - start_time) * 1000
            
            events.request_success.fire(
                request_type="WebSocket",
                name="connect",
                response_time=latency,
                response_length=0
            )
        except Exception as e:
            events.request_failure.fire(
                request_type="WebSocket",
                name="connect",
                response_time=0,
                response_length=0,
                exception=e
            )
    
    @task(3)
    async def subscribe_to_topics(self):
        """Subscribe to topics"""
        if not self.websocket:
            await self.connect()
        
        try:
            start_time = time.time()
            
            await self.websocket.send(json.dumps({
                "action": "subscribe",
                "topics": ["well-data", "alerts"]
            }))
            
            response = await asyncio.wait_for(
                self.websocket.recv(),
                timeout=5.0
            )
            
            latency = (time.time() - start_time) * 1000
            
            events.request_success.fire(
                request_type="WebSocket",
                name="subscribe",
                response_time=latency,
                response_length=len(response)
            )
        except Exception as e:
            events.request_failure.fire(
                request_type="WebSocket",
                name="subscribe",
                response_time=0,
                response_length=0,
                exception=e
            )
    
    @task(1)
    async def receive_message(self):
        """Receive message"""
        if not self.websocket:
            await self.connect()
        
        try:
            start_time = time.time()
            message = await asyncio.wait_for(
                self.websocket.recv(),
                timeout=10.0
            )
            latency = (time.time() - start_time) * 1000
            
            events.request_success.fire(
                request_type="WebSocket",
                name="receive",
                response_time=latency,
                response_length=len(message)
            )
        except asyncio.TimeoutError:
            # Timeout is expected sometimes
            pass
        except Exception as e:
            events.request_failure.fire(
                request_type="WebSocket",
                name="receive",
                response_time=0,
                response_length=0,
                exception=e
            )
```

### 2. API Performance Tests

```python
# backend/tests/performance/test_api_performance.py
from locust import HttpUser, task, between

class APIUser(HttpUser):
    """Locust user for API performance testing"""
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login and get token"""
        response = self.client.post(
            "/api/v1/auth/login",
            json={
                "username": "test_user",
                "password": "test_pass"
            }
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(5)
    def get_wells(self):
        """Get wells list"""
        self.client.get(
            "/api/v1/wells",
            headers=self.headers,
            name="GET /wells"
        )
    
    @task(3)
    def get_well_data(self):
        """Get well data"""
        self.client.get(
            "/api/v1/wells/WELL-001/data",
            headers=self.headers,
            name="GET /wells/{id}/data"
        )
    
    @task(2)
    def get_alerts(self):
        """Get alerts"""
        self.client.get(
            "/api/v1/alerts",
            headers=self.headers,
            name="GET /alerts"
        )
    
    @task(1)
    def post_data_ingestion(self):
        """Post data ingestion"""
        self.client.post(
            "/api/v1/data/ingest",
            json={
                "well_id": "WELL-001",
                "pressure": 100.0,
                "temperature": 50.0
            },
            headers=self.headers,
            name="POST /data/ingest"
        )
```

### 3. ML Model Performance Tests

```python
# backend/tests/performance/test_ml_performance.py
import time
import pytest
from fastapi.testclient import TestClient

@pytest.mark.performance
class TestMLPerformance:
    """Performance tests for ML models"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_inference_latency(self, client):
        """Test ML inference latency"""
        # Target: < 1 second
        start_time = time.perf_counter()
        
        response = client.post(
            "/api/v1/ml/infer",
            json={
                "model_type": "anomaly_detection",
                "data": {"feature1": 1.0, "feature2": 2.0}
            }
        )
        
        latency = (time.perf_counter() - start_time) * 1000  # ms
        
        assert response.status_code == 200
        assert latency < 1000  # < 1 second
    
    def test_batch_inference_performance(self, client):
        """Test batch inference performance"""
        # Target: 100 inferences in < 10 seconds
        batch_size = 100
        start_time = time.perf_counter()
        
        for i in range(batch_size):
            client.post(
                "/api/v1/ml/infer",
                json={
                    "model_type": "anomaly_detection",
                    "data": {"feature1": float(i), "feature2": float(i * 2)}
                }
            )
        
        total_time = time.perf_counter() - start_time
        
        assert total_time < 10.0  # < 10 seconds
        assert (batch_size / total_time) > 10  # > 10 inferences/second
```

### 4. Running Performance Tests

```bash
# Run Locust performance tests
locust -f backend/tests/performance/test_websocket_performance.py \
    --host=http://localhost:8000 \
    --users=1000 \
    --spawn-rate=100 \
    --run-time=5m

# Run with HTML report
locust -f backend/tests/performance/test_api_performance.py \
    --host=http://localhost:8000 \
    --users=500 \
    --spawn-rate=50 \
    --run-time=10m \
    --html=performance_report.html
```

---

## <a name="uat"></a>3️⃣ User Acceptance Testing (UAT)

### هدف
اطمینان از رضایت کاربران و عملکرد صحیح سیستم از دیدگاه business

### UAT Test Scenarios

### 1. Real-Time Data Streaming UAT

```gherkin
# uat/scenarios/realtime_streaming.feature
Feature: Real-Time Data Streaming
  As a field operator
  I want to see real-time well data
  So that I can monitor operations immediately

  Scenario: View real-time well data
    Given I am logged in as a field operator
    When I navigate to the well dashboard
    Then I should see real-time pressure updates
    And the data should update within 100ms
    And I should see a connection status indicator

  Scenario: Handle connection loss
    Given I am viewing real-time well data
    When my internet connection is lost
    Then the system should show "Reconnecting..." status
    And when connection is restored
    Then data should resume automatically
    And I should not lose any critical alerts
```

### 2. ML Model Management UAT

```gherkin
# uat/scenarios/ml_management.feature
Feature: ML Model Management
  As a data scientist
  I want to manage ML models
  So that I can deploy and compare models

  Scenario: Deploy new model
    Given I have a trained model
    When I upload the model to the system
    Then I should see the model in the model list
    And I should be able to deploy it to staging
    And the deployment should complete within 30 seconds

  Scenario: Compare models
    Given I have multiple model versions
    When I select two models to compare
    Then I should see side-by-side metrics
    And I should see which model performs better
    And I should be able to deploy the better model
```

### 3. Alert Management UAT

```gherkin
# uat/scenarios/alert_management.feature
Feature: Alert Management
  As an operations manager
  I want to receive intelligent alerts
  So that I can respond to issues quickly

  Scenario: Receive correlated alerts
    Given multiple related alerts occur
    When I view the alert dashboard
    Then I should see alerts grouped together
    And I should see the root cause analysis
    And I should not see duplicate alerts

  Scenario: Alert fatigue detection
    Given I receive many similar alerts
    When the system detects alert fatigue
    Then similar alerts should be grouped
    And I should see a summary instead of individual alerts
```

### 4. UAT Test Execution

```python
# uat/test_runner.py
import subprocess
import json
from datetime import datetime

class UATTestRunner:
    """Run UAT tests and generate report"""
    
    def run_uat_tests(self):
        """Run all UAT tests"""
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "scenarios": []
        }
        
        # Run each feature file
        feature_files = [
            "uat/scenarios/realtime_streaming.feature",
            "uat/scenarios/ml_management.feature",
            "uat/scenarios/alert_management.feature"
        ]
        
        for feature_file in feature_files:
            result = self.run_feature(feature_file)
            results["scenarios"].append(result)
        
        # Generate report
        self.generate_report(results)
        
        return results
    
    def run_feature(self, feature_file):
        """Run a single feature file"""
        # Use behave or pytest-bdd
        result = subprocess.run(
            ["behave", feature_file, "--format", "json"],
            capture_output=True,
            text=True
        )
        
        return json.loads(result.stdout)
    
    def generate_report(self, results):
        """Generate UAT report"""
        total = sum(len(s["elements"]) for s in results["scenarios"])
        passed = sum(
            sum(1 for e in s["elements"] if e["status"] == "passed")
            for s in results["scenarios"]
        )
        
        report = f"""
        UAT Test Report
        ================
        Date: {results["timestamp"]}
        Total Scenarios: {total}
        Passed: {passed}
        Failed: {total - passed}
        Success Rate: {(passed/total)*100:.1f}%
        """
        
        print(report)
        
        # Save to file
        with open("uat_report.txt", "w") as f:
            f.write(report)
```

---

## <a name="documentation"></a>4️⃣ Documentation

### هدف
ایجاد مستندات جامع برای توسعه‌دهندگان، کاربران، و مدیران

### Documentation Structure

```
docs/
├── API/
│   ├── api-gateway.md
│   ├── auth-service.md
│   ├── data-ingestion-service.md
│   └── ml-inference-service.md
├── ARCHITECTURE/
│   ├── system-overview.md
│   ├── microservices.md
│   └── data-flow.md
├── DEPLOYMENT/
│   ├── docker.md
│   ├── kubernetes.md
│   └── production.md
├── USER_GUIDES/
│   ├── getting-started.md
│   ├── dashboard-guide.md
│   └── troubleshooting.md
└── DEVELOPER_GUIDES/
    ├── setup.md
    ├── contributing.md
    └── testing.md
```

### 1. API Documentation

```python
# backend/api-gateway/main.py
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="OGIM API Gateway",
    description="API Gateway for OGIM Platform",
    version="1.0.0"
)

@app.get(
    "/api/v1/wells",
    summary="Get wells list",
    description="Retrieve a list of all wells with their basic information",
    response_description="List of wells",
    tags=["Wells"]
)
async def get_wells(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get wells list.
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    
    Returns a list of wells with their IDs, names, and status.
    """
    wells = db.query(Well).offset(skip).limit(limit).all()
    return {"wells": [{"id": w.well_id, "name": w.well_name} for w in wells]}

def custom_openapi():
    """Custom OpenAPI schema"""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="OGIM API",
        version="1.0.0",
        description="OGIM Platform API Documentation",
        routes=app.routes,
    )
    
    # Add custom info
    openapi_schema["info"]["x-logo"] = {
        "url": "https://example.com/logo.png"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

### 2. Architecture Documentation

```markdown
# docs/ARCHITECTURE/system-overview.md
# System Overview

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│           API Gateway                    │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌──────┐  ┌──────┐  ┌──────┐
│ Auth │  │ Data│  │  ML  │
└──────┘  └──────┘  └──────┘
```

## Components

### API Gateway
- Routes requests to appropriate services
- Handles authentication
- Rate limiting

### Auth Service
- User authentication
- JWT token management
- Role-based access control

### Data Ingestion Service
- Receives data from edge devices
- Validates and stores data
- Publishes to Kafka
```

### 3. User Guide

```markdown
# docs/USER_GUIDES/getting-started.md
# Getting Started Guide

## First Steps

1. **Login**
   - Navigate to https://ogim.example.com
   - Enter your credentials
   - Click "Login"

2. **Dashboard Overview**
   - View real-time well data
   - Monitor alerts
   - Access ML predictions

3. **Key Features**
   - Real-time data streaming
   - ML model management
   - Alert correlation
```

### 4. Developer Guide

```markdown
# docs/DEVELOPER_GUIDES/setup.md
# Development Setup

## Prerequisites

- Python 3.10+
- PostgreSQL 15+
- Redis 7+
- Kafka 3+

## Setup Steps

1. Clone repository
2. Install dependencies
3. Configure environment variables
4. Run migrations
5. Start services
```

### 5. Documentation Generation

```python
# scripts/generate_docs.py
import subprocess
import os

def generate_api_docs():
    """Generate API documentation from OpenAPI schema"""
    # Generate OpenAPI JSON
    subprocess.run([
        "python", "-m", "fastapi", "openapi",
        "--app", "backend/api-gateway/main:app",
        "--output", "docs/API/openapi.json"
    ])
    
    # Generate HTML docs
    subprocess.run([
        "redoc-cli", "build",
        "docs/API/openapi.json",
        "--output", "docs/API/index.html"
    ])

def generate_architecture_docs():
    """Generate architecture diagrams"""
    # Use graphviz or mermaid
    subprocess.run([
        "python", "scripts/generate_architecture_diagram.py"
    ])

if __name__ == "__main__":
    generate_api_docs()
    generate_architecture_docs()
    print("Documentation generated successfully!")
```

---

## <a name="deployment"></a>5️⃣ Deployment Plan

### هدف
استقرار ایمن و قابل اعتماد سیستم در محیط production

### Deployment Phases

### Phase 1: Staging Deployment

```yaml
# infrastructure/staging/docker-compose.yml
version: '3.8'

services:
  api-gateway:
    image: ogim/api-gateway:staging
    environment:
      - ENVIRONMENT=staging
      - DATABASE_URL=postgresql://user:pass@postgres:5432/ogim_staging
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=ogim_staging
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Phase 2: Gradual Rollout

```python
# scripts/gradual_rollout.py
import requests
import time
from typing import Dict

class GradualRollout:
    """Manage gradual rollout of new version"""
    
    def __init__(self, api_url: str):
        self.api_url = api_url
        self.percentages = [10, 50, 100]
    
    def rollout(self, version: str):
        """Gradual rollout to production"""
        for percentage in self.percentages:
            print(f"Rolling out {version} to {percentage}% of traffic")
            
            # Update load balancer configuration
            self.update_traffic_split(version, percentage)
            
            # Monitor for issues
            if not self.monitor_health(duration=3600):  # 1 hour
                print(f"Rollback due to issues at {percentage}%")
                self.rollback()
                return False
            
            print(f"Successfully rolled out to {percentage}%")
        
        return True
    
    def update_traffic_split(self, version: str, percentage: int):
        """Update traffic split in load balancer"""
        # Update NGINX or load balancer config
        pass
    
    def monitor_health(self, duration: int) -> bool:
        """Monitor system health"""
        start_time = time.time()
        
        while time.time() - start_time < duration:
            # Check error rate
            error_rate = self.get_error_rate()
            if error_rate > 0.05:  # 5% error rate threshold
                return False
            
            # Check latency
            latency = self.get_latency()
            if latency > 0.2:  # 200ms latency threshold
                return False
            
            time.sleep(60)  # Check every minute
        
        return True
    
    def get_error_rate(self) -> float:
        """Get current error rate"""
        # Query Prometheus or monitoring system
        return 0.01
    
    def get_latency(self) -> float:
        """Get current latency"""
        # Query Prometheus or monitoring system
        return 0.05
    
    def rollback(self):
        """Rollback to previous version"""
        print("Rolling back to previous version...")
        # Revert load balancer configuration
        pass
```

### Phase 3: Production Deployment

```bash
#!/bin/bash
# scripts/deploy_production.sh

set -e

echo "Starting production deployment..."

# 1. Run tests
echo "Running tests..."
pytest backend/tests/ -v --cov

# 2. Build Docker images
echo "Building Docker images..."
docker build -t ogim/api-gateway:latest backend/api-gateway/
docker build -t ogim/auth-service:latest backend/auth-service/
# ... other services

# 3. Push to registry
echo "Pushing to registry..."
docker push ogim/api-gateway:latest
docker push ogim/auth-service:latest
# ... other services

# 4. Deploy to Kubernetes
echo "Deploying to Kubernetes..."
kubectl apply -f infrastructure/kubernetes/

# 5. Wait for rollout
echo "Waiting for rollout..."
kubectl rollout status deployment/api-gateway -n ogim-production

# 6. Run smoke tests
echo "Running smoke tests..."
pytest backend/tests/smoke/ -v

# 7. Monitor
echo "Monitoring deployment..."
# Monitor metrics for 10 minutes
sleep 600

echo "Deployment completed successfully!"
```

### Kubernetes Deployment

```yaml
# infrastructure/kubernetes/api-gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: ogim-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: ogim/api-gateway:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ogim-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: ogim-production
spec:
  selector:
    app: api-gateway
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

---

## <a name="checklists"></a>6️⃣ Checklists

### Pre-Deployment Checklist

- [ ] All unit tests passing (> 85% coverage)
- [ ] All integration tests passing
- [ ] Performance tests meeting targets
- [ ] UAT completed and approved
- [ ] Documentation updated
- [ ] Security audit completed
- [ ] Backup and rollback plan ready
- [ ] Monitoring and alerting configured
- [ ] Database migrations tested
- [ ] Environment variables configured

### Deployment Checklist

- [ ] Staging deployment successful
- [ ] Staging tests passing
- [ ] Performance validation completed
- [ ] Gradual rollout plan ready
- [ ] Rollback procedure tested
- [ ] Team notified of deployment
- [ ] Monitoring dashboards ready

### Post-Deployment Checklist

- [ ] Production deployment successful
- [ ] Smoke tests passing
- [ ] Monitoring metrics normal
- [ ] No critical errors
- [ ] User acceptance confirmed
- [ ] Documentation updated
- [ ] Deployment log recorded

---

**نسخه:** 1.0.0  
**تاریخ:** دسامبر 2025

