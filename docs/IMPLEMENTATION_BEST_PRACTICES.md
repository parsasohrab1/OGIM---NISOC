# 🎯 راهنمای Best Practices پیاده‌سازی - OGIM

**تاریخ:** دسامبر 2025  
**نسخه:** 1.0.0  
**هدف:** راهنمای جامع برای Testing، Documentation، Training، Migration، و Monitoring

---

## 📋 فهرست مطالب

1. [Testing Strategy](#testing)
2. [Documentation Standards](#documentation)
3. [Training Program](#training)
4. [Migration Guide](#migration)
5. [Monitoring & Observability](#monitoring)
6. [Checklists](#checklists)

---

## <a name="testing"></a>1️⃣ Testing Strategy

### Testing Pyramid

```
        /\
       /  \
      / E2E \        (10%)
     /--------\
    /          \
   / Integration \   (30%)
  /--------------\
 /                \
/   Unit Tests      \  (60%)
/--------------------\
```

### 1. Unit Testing

#### Coverage Requirements
```yaml
Target: > 85% code coverage
Current: ~70%
Tools: pytest, Jest
```

#### Best Practices

```python
# backend/tests/test_example.py
import pytest
from unittest.mock import Mock, patch
from backend.service import ServiceClass

class TestServiceClass:
    """Unit tests for ServiceClass"""
    
    def test_successful_operation(self):
        """Test successful operation"""
        # Arrange
        service = ServiceClass()
        input_data = {"key": "value"}
        
        # Act
        result = service.process(input_data)
        
        # Assert
        assert result["status"] == "success"
        assert "data" in result
    
    @patch('backend.service.external_api')
    def test_external_api_call(self, mock_api):
        """Test external API call with mock"""
        # Arrange
        mock_api.return_value = {"data": "test"}
        service = ServiceClass()
        
        # Act
        result = service.call_external_api()
        
        # Assert
        assert result == {"data": "test"}
        mock_api.assert_called_once()
    
    def test_error_handling(self):
        """Test error handling"""
        service = ServiceClass()
        
        with pytest.raises(ValueError):
            service.process(None)
```

#### Frontend Unit Tests

```typescript
// frontend/web/src/components/__tests__/Component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from '../Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const handleClick = jest.fn();
    render(<Component onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Integration Testing

#### API Integration Tests

```python
# backend/tests/integration/test_api.py
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

class TestAPIEndpoints:
    """Integration tests for API endpoints"""
    
    def test_get_wells(self):
        """Test GET /api/wells endpoint"""
        response = client.get("/api/wells")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_alert(self):
        """Test POST /api/alerts endpoint"""
        alert_data = {
            "severity": "high",
            "message": "Test alert",
            "well_name": "WELL-001"
        }
        
        response = client.post("/api/alerts", json=alert_data)
        
        assert response.status_code == 201
        assert response.json()["severity"] == "high"
    
    def test_authentication_required(self):
        """Test that protected endpoints require authentication"""
        response = client.get("/api/users/me")
        
        assert response.status_code == 401
```

#### Database Integration Tests

```python
# backend/tests/integration/test_database.py
import pytest
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Well

def test_create_well(db_session: Session):
    """Test creating a well in database"""
    well = Well(
        well_id="TEST-001",
        well_name="Test Well",
        status="active"
    )
    
    db_session.add(well)
    db_session.commit()
    
    # Verify
    retrieved = db_session.query(Well).filter_by(well_id="TEST-001").first()
    assert retrieved is not None
    assert retrieved.well_name == "Test Well"
```

### 3. End-to-End Testing

#### E2E Test Example

```python
# backend/tests/e2e/test_workflow.py
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By

class TestUserWorkflow:
    """End-to-end tests for user workflows"""
    
    @pytest.fixture
    def driver(self):
        """Setup Selenium driver"""
        driver = webdriver.Chrome()
        yield driver
        driver.quit()
    
    def test_dashboard_workflow(self, driver):
        """Test complete dashboard workflow"""
        # 1. Login
        driver.get("http://localhost:3000/login")
        driver.find_element(By.ID, "username").send_keys("test_user")
        driver.find_element(By.ID, "password").send_keys("test_pass")
        driver.find_element(By.ID, "login-button").click()
        
        # 2. Navigate to dashboard
        assert "Dashboard" in driver.title
        
        # 3. View wells
        driver.find_element(By.LINK_TEXT, "Wells").click()
        assert "WELL-001" in driver.page_source
        
        # 4. Create alert
        driver.find_element(By.ID, "create-alert").click()
        # ... fill form and submit
```

### 4. Performance Testing

#### Load Testing

```python
# backend/tests/performance/test_load.py
import pytest
from locust import HttpUser, task, between

class OGIMUser(HttpUser):
    """Load testing user"""
    wait_time = between(1, 3)
    
    @task(3)
    def view_dashboard(self):
        """Most common task"""
        self.client.get("/api/dashboard")
    
    @task(2)
    def get_wells(self):
        """Second most common"""
        self.client.get("/api/wells")
    
    @task(1)
    def create_alert(self):
        """Less common task"""
        self.client.post("/api/alerts", json={
            "severity": "medium",
            "message": "Test"
        })

# Run: locust -f test_load.py --host=http://localhost:8000
```

### 5. Security Testing

#### Security Test Example

```python
# backend/tests/security/test_security.py
import pytest
from fastapi.testclient import TestClient

def test_sql_injection_protection(client: TestClient):
    """Test SQL injection protection"""
    malicious_input = "'; DROP TABLE users; --"
    
    response = client.get(f"/api/wells?name={malicious_input}")
    
    # Should not cause error or data loss
    assert response.status_code in [200, 400]
    
def test_xss_protection(client: TestClient):
    """Test XSS protection"""
    xss_payload = "<script>alert('XSS')</script>"
    
    response = client.post("/api/alerts", json={
        "message": xss_payload
    })
    
    # Should sanitize input
    assert "<script>" not in response.json()["message"]
```

### Testing Checklist

- [ ] Unit tests برای تمام functions/methods
- [ ] Integration tests برای API endpoints
- [ ] E2E tests برای critical workflows
- [ ] Performance tests برای load scenarios
- [ ] Security tests برای vulnerabilities
- [ ] Test coverage > 85%
- [ ] CI/CD pipeline integration
- [ ] Automated test execution

---

## <a name="documentation"></a>2️⃣ Documentation Standards

### 1. Code Documentation

#### Python Docstrings

```python
def process_sensor_data(
    sensor_id: str,
    data: Dict[str, Any],
    validate: bool = True
) -> Dict[str, Any]:
    """
    Process sensor data with validation and enrichment.
    
    Args:
        sensor_id: Unique identifier for the sensor
        data: Raw sensor data dictionary
        validate: Whether to validate data before processing
        
    Returns:
        Dictionary containing processed data with:
        - processed_data: Cleaned and enriched data
        - quality_score: Data quality score (0-100)
        - timestamp: Processing timestamp
        
    Raises:
        ValueError: If sensor_id is invalid
        DataValidationError: If data validation fails
        
    Example:
        >>> data = {"temperature": 25.5, "pressure": 101.3}
        >>> result = process_sensor_data("SENSOR-001", data)
        >>> print(result["quality_score"])
        95
    """
    # Implementation
    pass
```

#### TypeScript Documentation

```typescript
/**
 * Processes sensor data with validation and enrichment.
 * 
 * @param sensorId - Unique identifier for the sensor
 * @param data - Raw sensor data object
 * @param validate - Whether to validate data before processing (default: true)
 * @returns Processed data with quality score and timestamp
 * @throws {Error} If sensorId is invalid
 * @throws {ValidationError} If data validation fails
 * 
 * @example
 * ```typescript
 * const data = { temperature: 25.5, pressure: 101.3 };
 * const result = processSensorData("SENSOR-001", data);
 * console.log(result.qualityScore); // 95
 * ```
 */
function processSensorData(
  sensorId: string,
  data: SensorData,
  validate: boolean = true
): ProcessedData {
  // Implementation
}
```

### 2. API Documentation

#### OpenAPI/Swagger

```python
# backend/api/endpoints.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class AlertCreate(BaseModel):
    """Alert creation request model"""
    severity: str = Field(..., description="Alert severity", example="high")
    message: str = Field(..., description="Alert message", example="High pressure detected")
    well_name: str = Field(..., description="Well name", example="WELL-001")

@router.post(
    "/alerts",
    response_model=AlertResponse,
    status_code=201,
    summary="Create new alert",
    description="Creates a new alert with the specified severity and message",
    responses={
        201: {"description": "Alert created successfully"},
        400: {"description": "Invalid input data"},
        401: {"description": "Authentication required"},
        500: {"description": "Internal server error"}
    }
)
async def create_alert(alert: AlertCreate):
    """
    Create a new alert.
    
    - **severity**: Alert severity level (info, warning, critical)
    - **message**: Alert message description
    - **well_name**: Name of the well associated with alert
    """
    # Implementation
    pass
```

### 3. Architecture Documentation

#### Architecture Decision Records (ADR)

```markdown
# ADR-001: استفاده از WebSocket برای Real-Time Updates

## وضعیت
قبول شده

## Context
نیاز به به‌روزرسانی لحظه‌ای داده‌ها در dashboard

## Decision
استفاده از WebSocket به جای polling

## Consequences
- ✅ کاهش latency
- ✅ کاهش بار سرور
- ❌ پیچیدگی بیشتر در پیاده‌سازی
```

### 4. User Documentation

#### User Guide Template

```markdown
# User Guide: [Feature Name]

## Overview
[توضیح کلی feature]

## Getting Started
[مراحل شروع کار]

## Common Tasks
### Task 1: [Description]
1. Step 1
2. Step 2
3. Step 3

## Troubleshooting
### Problem: [Description]
**Solution:** [Solution]

## FAQ
**Q:** [Question]
**A:** [Answer]
```

### Documentation Checklist

- [ ] Code comments و docstrings
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Architecture documentation
- [ ] User guides
- [ ] Developer guides
- [ ] Deployment guides
- [ ] Troubleshooting guides
- [ ] FAQ section
- [ ] Changelog
- [ ] Migration guides

---

## <a name="training"></a>3️⃣ Training Program

### 1. Training Modules

#### Module 1: System Overview
```yaml
Duration: 2 hours
Audience: All users
Content:
  - System architecture
  - Key features
  - Navigation basics
  - User roles and permissions
```

#### Module 2: Dashboard Usage
```yaml
Duration: 3 hours
Audience: Operators, Engineers
Content:
  - Dashboard navigation
  - Real-time data viewing
  - Chart interpretation
  - Alert management
```

#### Module 3: Advanced Features
```yaml
Duration: 4 hours
Audience: Engineers, Administrators
Content:
  - ML model management
  - Workflow automation
  - Report generation
  - System configuration
```

### 2. Training Materials

#### Video Tutorials
```yaml
Videos:
  - Getting Started (10 min)
  - Dashboard Overview (15 min)
  - Creating Alerts (10 min)
  - Generating Reports (15 min)
  - Advanced Features (20 min)
```

#### Interactive Tutorials
```typescript
// frontend/web/src/components/Tutorial.tsx
export function InteractiveTutorial() {
  return (
    <TutorialProvider>
      <Step
        target=".dashboard-button"
        content="Click here to view the dashboard"
        onNext={() => {}}
      />
      <Step
        target=".alert-button"
        content="Create alerts from here"
        onNext={() => {}}
      />
    </TutorialProvider>
  );
}
```

### 3. Training Schedule

```yaml
Week 1:
  - Day 1: System Overview (All users)
  - Day 2: Dashboard Basics (Operators)
  - Day 3: Advanced Features (Engineers)

Week 2:
  - Day 1: Hands-on Practice
  - Day 2: Q&A Session
  - Day 3: Assessment

Ongoing:
  - Monthly refresher sessions
  - New feature training
  - Best practices workshops
```

### Training Checklist

- [ ] Training materials prepared
- [ ] Training schedule defined
- [ ] Trainers assigned
- [ ] Training environment setup
- [ ] Assessment criteria defined
- [ ] Feedback mechanism in place
- [ ] Certification program (if applicable)

---

## <a name="migration"></a>4️⃣ Migration Guide

### 1. Database Migration

#### Alembic Migration Example

```python
# backend/migrations/versions/001_add_alert_table.py
"""Add alert table

Revision ID: 001
Revises: 
Create Date: 2025-12-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    """Upgrade database schema"""
    op.create_table(
        'alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_alerts_severity', 'alerts', ['severity'])

def downgrade():
    """Downgrade database schema"""
    op.drop_index('ix_alerts_severity', table_name='alerts')
    op.drop_table('alerts')
```

#### Migration Best Practices

```python
# Safe migration pattern
def upgrade():
    # 1. Add new column as nullable
    op.add_column('users', sa.Column('new_field', sa.String(50), nullable=True))
    
    # 2. Backfill data
    op.execute("UPDATE users SET new_field = 'default' WHERE new_field IS NULL")
    
    # 3. Make column non-nullable
    op.alter_column('users', 'new_field', nullable=False)
```

### 2. Data Migration

#### Data Migration Script

```python
# scripts/migrate_data.py
import asyncio
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import OldModel, NewModel

async def migrate_data():
    """Migrate data from old model to new model"""
    db: Session = next(get_db())
    
    try:
        old_records = db.query(OldModel).all()
        
        for old_record in old_records:
            new_record = NewModel(
                id=old_record.id,
                # Map old fields to new fields
                new_field=old_record.old_field,
                # ... other mappings
            )
            db.add(new_record)
        
        db.commit()
        print(f"Migrated {len(old_records)} records")
        
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(migrate_data())
```

### 3. API Migration

#### Versioning Strategy

```python
# API versioning
from fastapi import APIRouter

# v1 API (deprecated)
v1_router = APIRouter(prefix="/api/v1")

# v2 API (current)
v2_router = APIRouter(prefix="/api/v2")

@v1_router.get("/wells")
async def get_wells_v1():
    """Deprecated: Use /api/v2/wells"""
    # Redirect or return deprecation notice
    pass

@v2_router.get("/wells")
async def get_wells_v2():
    """Current API version"""
    # Implementation
    pass
```

### 4. Migration Checklist

```yaml
Pre-Migration:
  - [ ] Backup database
  - [ ] Test migration on staging
  - [ ] Review migration script
  - [ ] Prepare rollback plan
  - [ ] Notify stakeholders

During Migration:
  - [ ] Stop services (if needed)
  - [ ] Run migration script
  - [ ] Verify data integrity
  - [ ] Run smoke tests

Post-Migration:
  - [ ] Verify all services running
  - [ ] Monitor for errors
  - [ ] Validate data
  - [ ] Update documentation
  - [ ] Communicate completion
```

---

## <a name="monitoring"></a>5️⃣ Monitoring & Observability

### 1. Metrics Collection

#### Prometheus Metrics

```python
# backend/shared/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Counters
api_requests_total = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

# Histograms
api_latency = Histogram(
    'api_request_duration_seconds',
    'API request latency',
    ['endpoint'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

# Gauges
active_users = Gauge(
    'active_users_total',
    'Number of active users'
)

# Usage
api_requests_total.labels(method='GET', endpoint='/api/wells', status='200').inc()
api_latency.labels(endpoint='/api/wells').observe(0.05)
active_users.set(150)
```

### 2. Logging

#### Structured Logging

```python
# backend/shared/logging_config.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "service": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

# Usage
logger = logging.getLogger("service_name")
logger.info("Processing request", extra={"user_id": 123, "request_id": "req-456"})
```

### 3. Distributed Tracing

#### OpenTelemetry Setup

```python
# backend/shared/tracing.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

def setup_tracing(service_name: str):
    """Setup distributed tracing"""
    trace.set_tracer_provider(TracerProvider())
    
    otlp_exporter = OTLPSpanExporter(
        endpoint="http://jaeger:4317",
        insecure=True
    )
    
    span_processor = BatchSpanProcessor(otlp_exporter)
    trace.get_tracer_provider().add_span_processor(span_processor)
    
    return trace.get_tracer(service_name)

# Usage
tracer = setup_tracing("api-gateway")

@tracer.start_as_current_span("process_request")
def process_request():
    with tracer.start_as_current_span("database_query"):
        # Database query
        pass
```

### 4. Alerting

#### Alert Rules

```yaml
# infrastructure/prometheus/rules/alerts.yml
groups:
  - name: ogim_alerts
    rules:
      - alert: HighLatency
        expr: api_request_duration_seconds{quantile="0.95"} > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency detected"
          description: "P95 latency is {{ $value }}s"
      
      - alert: HighErrorRate
        expr: rate(api_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate"
          description: "Error rate is {{ $value }}"
```

### Monitoring Checklist

- [ ] Metrics collection setup (Prometheus)
- [ ] Logging infrastructure (ELK/Loki)
- [ ] Distributed tracing (Jaeger/Zipkin)
- [ ] Dashboards (Grafana)
- [ ] Alerting rules defined
- [ ] Health check endpoints
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] User analytics

---

## <a name="checklists"></a>✅ Checklists

### Pre-Release Checklist

```yaml
Testing:
  - [ ] All unit tests passing
  - [ ] Integration tests passing
  - [ ] E2E tests passing
  - [ ] Performance tests passing
  - [ ] Security tests passing
  - [ ] Test coverage > 85%

Documentation:
  - [ ] Code documentation complete
  - [ ] API documentation updated
  - [ ] User guides updated
  - [ ] Migration guides prepared
  - [ ] Changelog updated

Training:
  - [ ] Training materials prepared
  - [ ] Training schedule defined
  - [ ] Users notified

Migration:
  - [ ] Migration scripts tested
  - [ ] Rollback plan prepared
  - [ ] Backup completed

Monitoring:
  - [ ] Metrics collection verified
  - [ ] Alerts configured
  - [ ] Dashboards updated
```

### Post-Release Checklist

```yaml
Verification:
  - [ ] All services running
  - [ ] Health checks passing
  - [ ] No critical errors
  - [ ] Performance metrics normal

Monitoring:
  - [ ] Monitor error rates
  - [ ] Monitor latency
  - [ ] Monitor resource usage
  - [ ] Review alerts

Communication:
  - [ ] Release notes published
  - [ ] Users notified
  - [ ] Support team briefed
```

---

**نسخه:** 1.0.0  
**تاریخ:** دسامبر 2025

