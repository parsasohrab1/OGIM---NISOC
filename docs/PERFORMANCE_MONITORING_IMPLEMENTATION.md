# ⚡ راهنمای پیاده‌سازی Performance Monitoring

**تاریخ:** دسامبر 2025  
**نسخه:** 1.0.0  
**هدف:** شناسایی سریع‌تر bottlenecks عملکردی با APM و end-to-end tracking

---

## 📋 فهرست مطالب

1. [نمای کلی](#overview)
2. [معماری](#architecture)
3. [OpenTelemetry Setup](#opentelemetry)
4. [Performance Dashboard](#dashboard)
5. [End-to-end Latency Tracking](#latency-tracking)
6. [Service Dependency Map](#dependency-map)
7. [Bottleneck Detection](#bottleneck-detection)
8. [Testing Strategy](#testing)
9. [Best Practices](#best-practices)

---

## <a name="overview"></a>🎯 نمای کلی

این سند راهنمای کامل پیاده‌سازی سیستم Performance Monitoring است که شامل APM با OpenTelemetry، Performance Dashboard، End-to-end Latency Tracking، و Service Dependency Map می‌شود.

### اهداف

- ✅ شناسایی real-time bottlenecks
- ✅ End-to-end latency tracking
- ✅ Service dependency visualization
- ✅ Automated performance alerts
- ✅ Performance trend analysis

---

## <a name="architecture"></a>🏗️ معماری

```
┌─────────────────────────────────────────────────────────┐
│              Application Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ API Gateway  │  │ Auth Service │  │ Data Service │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
│              OpenTelemetry Instrumentation                │
└────────────────────────────┼─────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Jaeger     │    │  Prometheus  │    │    Grafana   │
│  (Tracing)   │    │  (Metrics)   │    │  (Dashboard) │
└──────────────┘    └──────────────┘    └──────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│         Performance Analysis Engine                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  - Bottleneck Detection                          │   │
│  │  - Dependency Analysis                           │   │
│  │  - Latency Analysis                              │   │
│  │  - Trend Analysis                                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## <a name="opentelemetry"></a>🔍 OpenTelemetry Setup

### 1. Enhanced Tracing Configuration

```python
# backend/shared/opentelemetry_instrumentation.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.kafka import KafkaInstrumentor
import logging

logger = logging.getLogger(__name__)

def setup_opentelemetry(
    service_name: str,
    environment: str = "production",
    jaeger_endpoint: str = "http://jaeger:4317"
) -> None:
    """Setup OpenTelemetry for distributed tracing"""
    
    # Create resource
    resource = Resource.create({
        "service.name": service_name,
        "service.version": "1.0.0",
        "deployment.environment": environment
    })
    
    # Create tracer provider
    trace.set_tracer_provider(TracerProvider(resource=resource))
    
    # Create OTLP exporter
    otlp_exporter = OTLPSpanExporter(
        endpoint=jaeger_endpoint,
        insecure=True
    )
    
    # Create span processor
    span_processor = BatchSpanProcessor(otlp_exporter)
    trace.get_tracer_provider().add_span_processor(span_processor)
    
    logger.info(f"OpenTelemetry setup complete for {service_name}")
    
    return trace.get_tracer(service_name)

def instrument_fastapi_app(app, service_name: str):
    """Instrument FastAPI application"""
    FastAPIInstrumentor.instrument_app(app)
    logger.info(f"FastAPI instrumented: {service_name}")

def instrument_database():
    """Instrument SQLAlchemy"""
    SQLAlchemyInstrumentor().instrument()
    logger.info("SQLAlchemy instrumented")

def instrument_http_client():
    """Instrument HTTP clients"""
    HTTPXClientInstrumentor().instrument()
    logger.info("HTTP clients instrumented")

def instrument_redis():
    """Instrument Redis"""
    try:
        RedisInstrumentor().instrument()
        logger.info("Redis instrumented")
    except Exception as e:
        logger.warning(f"Redis instrumentation failed: {e}")

def instrument_kafka():
    """Instrument Kafka"""
    try:
        KafkaInstrumentor().instrument()
        logger.info("Kafka instrumented")
    except Exception as e:
        logger.warning(f"Kafka instrumentation failed: {e}")
```

### 2. Usage in Services

```python
# backend/api-gateway/main.py
from backend.shared.opentelemetry_instrumentation import (
    setup_opentelemetry,
    instrument_fastapi_app,
    instrument_http_client
)

# Setup tracing
tracer = setup_opentelemetry("api-gateway", environment="production")
instrument_fastapi_app(app, "api-gateway")
instrument_http_client()

@app.get("/api/wells")
async def get_wells(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get wells with tracing"""
    with tracer.start_as_current_span("get_wells") as span:
        # Add attributes
        span.set_attribute("endpoint", "/api/wells")
        span.set_attribute("user_id", request.state.user_id if hasattr(request.state, 'user_id') else None)
        
        # Child span for database query
        with tracer.start_as_current_span("db_query_wells") as db_span:
            wells = db.query(Well).all()
            db_span.set_attribute("wells.count", len(wells))
        
        # Child span for data transformation
        with tracer.start_as_current_span("transform_wells_data") as transform_span:
            result = [{"id": w.well_id, "name": w.well_name} for w in wells]
            transform_span.set_attribute("result.count", len(result))
        
        span.set_attribute("result.count", len(result))
        return {"wells": result}
```

---

## <a name="dashboard"></a>📊 Performance Dashboard

### 1. Dashboard Service

```python
# backend/performance-service/main.py
from fastapi import FastAPI, Depends
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from prometheus_client import REGISTRY
import prometheus_client
from opentelemetry import trace

app = FastAPI(title="OGIM Performance Service")

tracer = trace.get_tracer(__name__)

class PerformanceAnalyzer:
    """Analyze performance metrics"""
    
    def __init__(self):
        self.prometheus_client = None
    
    def get_service_metrics(
        self,
        service_name: str,
        time_range: timedelta = timedelta(minutes=5)
    ) -> Dict:
        """Get performance metrics for a service"""
        with tracer.start_as_current_span("get_service_metrics") as span:
            span.set_attribute("service.name", service_name)
            
            # Query Prometheus metrics
            metrics = {
                "service_name": service_name,
                "request_rate": self._get_request_rate(service_name, time_range),
                "error_rate": self._get_error_rate(service_name, time_range),
                "latency_p50": self._get_latency_percentile(service_name, 0.50, time_range),
                "latency_p95": self._get_latency_percentile(service_name, 0.95, time_range),
                "latency_p99": self._get_latency_percentile(service_name, 0.99, time_range),
                "cpu_usage": self._get_cpu_usage(service_name),
                "memory_usage": self._get_memory_usage(service_name),
                "active_connections": self._get_active_connections(service_name)
            }
            
            span.set_attribute("metrics.count", len(metrics))
            return metrics
    
    def get_all_services_metrics(self) -> List[Dict]:
        """Get metrics for all services"""
        services = [
            "api-gateway",
            "auth-service",
            "data-ingestion-service",
            "ml-inference-service",
            "alert-service",
            "command-control-service"
        ]
        
        return [self.get_service_metrics(service) for service in services]
    
    def _get_request_rate(self, service_name: str, time_range: timedelta) -> float:
        """Get request rate (requests per second)"""
        # Query Prometheus: rate(service_requests_total[5m])
        # This is a simplified version
        return 100.0  # Placeholder
    
    def _get_error_rate(self, service_name: str, time_range: timedelta) -> float:
        """Get error rate"""
        # Query Prometheus: rate(service_request_errors_total[5m])
        return 0.01  # Placeholder
    
    def _get_latency_percentile(
        self,
        service_name: str,
        percentile: float,
        time_range: timedelta
    ) -> float:
        """Get latency percentile"""
        # Query Prometheus: histogram_quantile(0.95, ...)
        return 0.05  # Placeholder
    
    def _get_cpu_usage(self, service_name: str) -> float:
        """Get CPU usage percentage"""
        return 45.0  # Placeholder
    
    def _get_memory_usage(self, service_name: str) -> float:
        """Get memory usage percentage"""
        return 65.0  # Placeholder
    
    def _get_active_connections(self, service_name: str) -> int:
        """Get active connections"""
        return 150  # Placeholder

performance_analyzer = PerformanceAnalyzer()

@app.get("/api/v1/performance/services")
async def get_services_performance():
    """Get performance metrics for all services"""
    metrics = performance_analyzer.get_all_services_metrics()
    return {"services": metrics}

@app.get("/api/v1/performance/services/{service_name}")
async def get_service_performance(service_name: str):
    """Get performance metrics for a specific service"""
    metrics = performance_analyzer.get_service_metrics(service_name)
    return metrics
```

### 2. Frontend Dashboard

```typescript
// frontend/web/src/pages/Performance.tsx
import { useQuery } from '@tanstack/react-query';
import { PerformanceCard } from '@/components/PerformanceCard';
import { ServiceMetricsChart } from '@/components/ServiceMetricsChart';
import { DependencyMap } from '@/components/DependencyMap';

export function Performance() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['performance-services'],
    queryFn: async () => {
      const response = await fetch('/api/v1/performance/services');
      return response.json();
    },
    refetchInterval: 5000  // Refresh every 5 seconds
  });

  if (isLoading) return <div>Loading performance data...</div>;

  return (
    <div className="performance-dashboard">
      <h1>Performance Monitoring</h1>
      
      <div className="services-grid">
        {services?.services?.map((service: any) => (
          <PerformanceCard
            key={service.service_name}
            service={service}
          />
        ))}
      </div>
      
      <ServiceMetricsChart services={services?.services} />
      <DependencyMap />
    </div>
  );
}
```

### 3. Performance Card Component

```typescript
// frontend/web/src/components/PerformanceCard.tsx
export function PerformanceCard({ service }: { service: any }) {
  const getStatusColor = (latency: number) => {
    if (latency < 0.05) return 'green';
    if (latency < 0.1) return 'yellow';
    return 'red';
  };

  return (
    <div className="performance-card">
      <div className="card-header">
        <h3>{service.service_name}</h3>
        <span className={`status-indicator ${getStatusColor(service.latency_p95)}`}>
          {service.latency_p95 < 0.1 ? 'Healthy' : 'Degraded'}
        </span>
      </div>
      
      <div className="metrics">
        <MetricRow
          label="Request Rate"
          value={`${service.request_rate.toFixed(1)} req/s`}
        />
        <MetricRow
          label="Error Rate"
          value={`${(service.error_rate * 100).toFixed(2)}%`}
          status={service.error_rate < 0.01 ? 'good' : 'warning'}
        />
        <MetricRow
          label="P95 Latency"
          value={`${(service.latency_p95 * 1000).toFixed(0)}ms`}
          status={getStatusColor(service.latency_p95)}
        />
        <MetricRow
          label="CPU Usage"
          value={`${service.cpu_usage.toFixed(1)}%`}
          status={service.cpu_usage < 70 ? 'good' : 'warning'}
        />
        <MetricRow
          label="Memory Usage"
          value={`${service.memory_usage.toFixed(1)}%`}
          status={service.memory_usage < 80 ? 'good' : 'warning'}
        />
      </div>
    </div>
  );
}
```

---

## <a name="latency-tracking"></a>⏱️ End-to-end Latency Tracking

### 1. Latency Tracker

```python
# backend/shared/latency_tracker.py
from opentelemetry import trace
from typing import Dict, Optional
from datetime import datetime
import time

class EndToEndLatencyTracker:
    """Track end-to-end latency across services"""
    
    def __init__(self):
        self.tracer = trace.get_tracer(__name__)
        self.request_traces: Dict[str, Dict] = {}
    
    def start_trace(self, request_id: str, endpoint: str) -> Dict:
        """Start end-to-end trace"""
        trace_data = {
            "request_id": request_id,
            "endpoint": endpoint,
            "start_time": time.perf_counter(),
            "start_timestamp": datetime.utcnow().isoformat(),
            "services": [],
            "total_latency": None
        }
        
        self.request_traces[request_id] = trace_data
        
        return trace_data
    
    def add_service_span(
        self,
        request_id: str,
        service_name: str,
        operation: str,
        duration: float
    ):
        """Add service span to trace"""
        if request_id not in self.request_traces:
            return
        
        self.request_traces[request_id]["services"].append({
            "service": service_name,
            "operation": operation,
            "duration_ms": duration * 1000,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def end_trace(self, request_id: str) -> Dict:
        """End trace and calculate total latency"""
        if request_id not in self.request_traces:
            return None
        
        trace_data = self.request_traces[request_id]
        end_time = time.perf_counter()
        total_latency = (end_time - trace_data["start_time"]) * 1000  # ms
        
        trace_data["total_latency"] = total_latency
        trace_data["end_timestamp"] = datetime.utcnow().isoformat()
        
        # Identify slowest service
        if trace_data["services"]:
            slowest = max(trace_data["services"], key=lambda x: x["duration_ms"])
            trace_data["slowest_service"] = slowest
        
        # Cleanup (keep last 1000 traces)
        if len(self.request_traces) > 1000:
            oldest = min(self.request_traces.keys(), key=lambda k: self.request_traces[k]["start_timestamp"])
            del self.request_traces[oldest]
        
        return trace_data
    
    def get_trace(self, request_id: str) -> Optional[Dict]:
        """Get trace by request ID"""
        return self.request_traces.get(request_id)
    
    def get_latency_stats(self, endpoint: Optional[str] = None) -> Dict:
        """Get latency statistics"""
        traces = list(self.request_traces.values())
        
        if endpoint:
            traces = [t for t in traces if t["endpoint"] == endpoint]
        
        if not traces:
            return {
                "count": 0,
                "avg_latency_ms": 0,
                "p50_latency_ms": 0,
                "p95_latency_ms": 0,
                "p99_latency_ms": 0,
                "max_latency_ms": 0
            }
        
        latencies = [t["total_latency"] for t in traces if t["total_latency"]]
        latencies.sort()
        
        n = len(latencies)
        
        return {
            "count": n,
            "avg_latency_ms": sum(latencies) / n if latencies else 0,
            "p50_latency_ms": latencies[int(n * 0.50)] if n > 0 else 0,
            "p95_latency_ms": latencies[int(n * 0.95)] if n > 0 else 0,
            "p99_latency_ms": latencies[int(n * 0.99)] if n > 0 else 0,
            "max_latency_ms": max(latencies) if latencies else 0
        }

# Global instance
latency_tracker = EndToEndLatencyTracker()
```

### 2. Middleware Integration

```python
# backend/api-gateway/main.py
from backend.shared.latency_tracker import latency_tracker
import uuid

@app.middleware("http")
async def latency_tracking_middleware(request: Request, call_next):
    """Track end-to-end latency"""
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Start trace
    trace_data = latency_tracker.start_trace(
        request_id=request_id,
        endpoint=request.url.path
    )
    
    start_time = time.perf_counter()
    
    try:
        response = await call_next(request)
        
        # Calculate gateway latency
        gateway_latency = time.perf_counter() - start_time
        latency_tracker.add_service_span(
            request_id=request_id,
            service_name="api-gateway",
            operation="request_handling",
            duration=gateway_latency
        )
        
        # Add trace ID to response header
        response.headers["X-Trace-Id"] = request_id
        
        return response
        
    finally:
        # End trace
        trace_data = latency_tracker.end_trace(request_id)
        
        # Log if latency is high
        if trace_data and trace_data["total_latency"] > 100:  # > 100ms
            logger.warning(
                f"High latency detected: {trace_data['total_latency']:.2f}ms "
                f"for {trace_data['endpoint']}"
            )
```

### 3. Latency API

```python
@app.get("/api/v1/performance/latency/trace/{request_id}")
async def get_trace(request_id: str):
    """Get trace by request ID"""
    trace_data = latency_tracker.get_trace(request_id)
    
    if not trace_data:
        raise HTTPException(status_code=404, detail="Trace not found")
    
    return trace_data

@app.get("/api/v1/performance/latency/stats")
async def get_latency_stats(endpoint: Optional[str] = None):
    """Get latency statistics"""
    stats = latency_tracker.get_latency_stats(endpoint)
    return stats
```

---

## <a name="dependency-map"></a>🗺️ Service Dependency Map

### 1. Dependency Analyzer

```python
# backend/performance-service/dependency_analyzer.py
from typing import Dict, List, Set
from collections import defaultdict
from opentelemetry import trace

class ServiceDependencyAnalyzer:
    """Analyze service dependencies from traces"""
    
    def __init__(self):
        self.dependencies: Dict[str, Set[str]] = defaultdict(set)
        self.call_counts: Dict[tuple, int] = defaultdict(int)
        self.latency_by_dependency: Dict[tuple, List[float]] = defaultdict(list)
    
    def analyze_trace(self, trace_data: Dict):
        """Analyze trace to extract dependencies"""
        services = trace_data.get("services", [])
        
        if len(services) < 2:
            return
        
        # Build dependency chain
        for i in range(len(services) - 1):
            caller = services[i]["service"]
            callee = services[i + 1]["service"]
            
            self.dependencies[caller].add(callee)
            self.call_counts[(caller, callee)] += 1
            self.latency_by_dependency[(caller, callee)].append(
                services[i + 1]["duration_ms"]
            )
    
    def get_dependency_map(self) -> Dict:
        """Get service dependency map"""
        nodes = []
        edges = []
        
        # Create nodes
        all_services = set()
        for caller, callees in self.dependencies.items():
            all_services.add(caller)
            all_services.update(callees)
        
        for service in all_services:
            nodes.append({
                "id": service,
                "label": service,
                "type": "service"
            })
        
        # Create edges
        for (caller, callee), count in self.call_counts.items():
            avg_latency = sum(self.latency_by_dependency[(caller, callee)]) / len(
                self.latency_by_dependency[(caller, callee)]
            ) if self.latency_by_dependency[(caller, callee)] else 0
            
            edges.append({
                "from": caller,
                "to": callee,
                "label": f"{count} calls",
                "value": count,
                "avg_latency_ms": avg_latency,
                "width": min(count / 10, 5)  # Normalize width
            })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "total_services": len(all_services),
            "total_dependencies": len(edges)
        }
    
    def get_critical_path(self, start_service: str, end_service: str) -> List[str]:
        """Find critical path between services"""
        # Simple BFS to find path
        from collections import deque
        
        queue = deque([(start_service, [start_service])])
        visited = {start_service}
        
        while queue:
            current, path = queue.popleft()
            
            if current == end_service:
                return path
            
            for neighbor in self.dependencies.get(current, set()):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))
        
        return []  # No path found
```

### 2. Dependency Map API

```python
@app.get("/api/v1/performance/dependencies")
async def get_service_dependencies():
    """Get service dependency map"""
    analyzer = ServiceDependencyAnalyzer()
    
    # Analyze recent traces
    recent_traces = [
        trace for trace in latency_tracker.request_traces.values()
        if trace.get("total_latency")
    ][-1000:]  # Last 1000 traces
    
    for trace in recent_traces:
        analyzer.analyze_trace(trace)
    
    dependency_map = analyzer.get_dependency_map()
    
    return dependency_map
```

### 3. Frontend Dependency Map Component

```typescript
// frontend/web/src/components/DependencyMap.tsx
import { useQuery } from '@tanstack/react-query';
import { Network } from 'vis-network';

export function DependencyMap() {
  const { data: dependencyMap, isLoading } = useQuery({
    queryKey: ['service-dependencies'],
    queryFn: async () => {
      const response = await fetch('/api/v1/performance/dependencies');
      return response.json();
    },
    refetchInterval: 30000  // Refresh every 30 seconds
  });

  useEffect(() => {
    if (!dependencyMap) return;

    const nodes = dependencyMap.nodes.map((node: any) => ({
      id: node.id,
      label: node.label,
      color: getServiceColor(node.id)
    }));

    const edges = dependencyMap.edges.map((edge: any) => ({
      from: edge.from,
      to: edge.to,
      label: `${edge.avg_latency_ms.toFixed(0)}ms`,
      width: edge.width,
      color: getLatencyColor(edge.avg_latency_ms)
    }));

    const data = { nodes, edges };
    const options = {
      nodes: {
        shape: 'box',
        font: { size: 14 }
      },
      edges: {
        arrows: 'to',
        smooth: { type: 'curvedCW' }
      },
      physics: {
        enabled: true,
        stabilization: { iterations: 100 }
      }
    };

    const network = new Network(
      document.getElementById('dependency-map')!,
      data,
      options
    );

    return () => network.destroy();
  }, [dependencyMap]);

  if (isLoading) return <div>Loading dependency map...</div>;

  return (
    <div className="dependency-map-container">
      <h2>Service Dependency Map</h2>
      <div id="dependency-map" style={{ height: '600px', width: '100%' }} />
      <div className="legend">
        <LegendItem color="green" label="< 50ms" />
        <LegendItem color="yellow" label="50-100ms" />
        <LegendItem color="red" label="> 100ms" />
      </div>
    </div>
  );
}
```

---

## <a name="bottleneck-detection"></a>🔍 Bottleneck Detection

### 1. Bottleneck Detector

```python
# backend/performance-service/bottleneck_detector.py
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class BottleneckDetector:
    """Detect performance bottlenecks"""
    
    def __init__(self):
        self.thresholds = {
            "api_latency_p95": 0.1,  # 100ms
            "api_latency_p99": 0.2,  # 200ms
            "db_query_time": 0.01,  # 10ms
            "cpu_usage": 0.80,  # 80%
            "memory_usage": 0.85,  # 85%
            "error_rate": 0.05,  # 5%
            "request_rate": 10000  # requests/second
        }
    
    def detect_bottlenecks(self, service_metrics: Dict) -> List[Dict]:
        """Detect bottlenecks in service"""
        bottlenecks = []
        
        # Check API latency
        if service_metrics.get("latency_p95", 0) > self.thresholds["api_latency_p95"]:
            bottlenecks.append({
                "type": "high_latency",
                "severity": "high",
                "metric": "latency_p95",
                "value": service_metrics["latency_p95"],
                "threshold": self.thresholds["api_latency_p95"],
                "service": service_metrics["service_name"],
                "recommendation": "Check database queries, external API calls, or processing logic"
            })
        
        # Check error rate
        if service_metrics.get("error_rate", 0) > self.thresholds["error_rate"]:
            bottlenecks.append({
                "type": "high_error_rate",
                "severity": "critical",
                "metric": "error_rate",
                "value": service_metrics["error_rate"],
                "threshold": self.thresholds["error_rate"],
                "service": service_metrics["service_name"],
                "recommendation": "Review error logs and fix underlying issues"
            })
        
        # Check CPU usage
        if service_metrics.get("cpu_usage", 0) > self.thresholds["cpu_usage"]:
            bottlenecks.append({
                "type": "high_cpu",
                "severity": "medium",
                "metric": "cpu_usage",
                "value": service_metrics["cpu_usage"],
                "threshold": self.thresholds["cpu_usage"],
                "service": service_metrics["service_name"],
                "recommendation": "Consider horizontal scaling or code optimization"
            })
        
        # Check memory usage
        if service_metrics.get("memory_usage", 0) > self.thresholds["memory_usage"]:
            bottlenecks.append({
                "type": "high_memory",
                "severity": "medium",
                "metric": "memory_usage",
                "value": service_metrics["memory_usage"],
                "threshold": self.thresholds["memory_usage"],
                "service": service_metrics["service_name"],
                "recommendation": "Check for memory leaks or increase memory allocation"
            })
        
        return bottlenecks
    
    def detect_slow_services(self, all_services: List[Dict]) -> List[Dict]:
        """Detect slowest services"""
        # Sort by P95 latency
        sorted_services = sorted(
            all_services,
            key=lambda x: x.get("latency_p95", 0),
            reverse=True
        )
        
        slow_services = []
        for service in sorted_services[:5]:  # Top 5 slowest
            if service.get("latency_p95", 0) > 0.05:  # > 50ms
                slow_services.append({
                    "service": service["service_name"],
                    "latency_p95_ms": service["latency_p95"] * 1000,
                    "rank": len(slow_services) + 1
                })
        
        return slow_services
    
    def detect_dependency_bottlenecks(
        self,
        dependency_map: Dict
    ) -> List[Dict]:
        """Detect bottlenecks in service dependencies"""
        bottlenecks = []
        
        for edge in dependency_map.get("edges", []):
            if edge.get("avg_latency_ms", 0) > 100:  # > 100ms
                bottlenecks.append({
                    "type": "slow_dependency",
                    "severity": "medium",
                    "from_service": edge["from"],
                    "to_service": edge["to"],
                    "latency_ms": edge["avg_latency_ms"],
                    "call_count": edge["value"],
                    "recommendation": f"Optimize communication between {edge['from']} and {edge['to']}"
                })
        
        return bottlenecks
```

### 2. Bottleneck API

```python
@app.get("/api/v1/performance/bottlenecks")
async def get_bottlenecks():
    """Get detected bottlenecks"""
    detector = BottleneckDetector()
    
    # Get all service metrics
    all_services = performance_analyzer.get_all_services_metrics()
    
    # Detect bottlenecks
    all_bottlenecks = []
    for service in all_services:
        bottlenecks = detector.detect_bottlenecks(service)
        all_bottlenecks.extend(bottlenecks)
    
    # Detect slow services
    slow_services = detector.detect_slow_services(all_services)
    
    # Detect dependency bottlenecks
    dependency_map = get_service_dependencies()
    dependency_bottlenecks = detector.detect_dependency_bottlenecks(dependency_map)
    
    return {
        "service_bottlenecks": all_bottlenecks,
        "slow_services": slow_services,
        "dependency_bottlenecks": dependency_bottlenecks,
        "total_bottlenecks": len(all_bottlenecks) + len(dependency_bottlenecks),
        "detected_at": datetime.utcnow().isoformat()
    }
```

### 3. Frontend Bottleneck Component

```typescript
// frontend/web/src/components/BottleneckList.tsx
export function BottleneckList() {
  const { data: bottlenecks, isLoading } = useQuery({
    queryKey: ['performance-bottlenecks'],
    queryFn: async () => {
      const response = await fetch('/api/v1/performance/bottlenecks');
      return response.json();
    },
    refetchInterval: 10000  // Refresh every 10 seconds
  });

  if (isLoading) return <div>Analyzing bottlenecks...</div>;

  return (
    <div className="bottleneck-list">
      <h2>Detected Bottlenecks</h2>
      
      <div className="bottleneck-summary">
        <SummaryCard
          title="Total Bottlenecks"
          value={bottlenecks?.total_bottlenecks || 0}
          status={bottlenecks?.total_bottlenecks > 0 ? 'warning' : 'good'}
        />
        <SummaryCard
          title="Critical Issues"
          value={bottlenecks?.service_bottlenecks?.filter((b: any) => b.severity === 'critical').length || 0}
          status="critical"
        />
      </div>
      
      <div className="bottlenecks">
        {bottlenecks?.service_bottlenecks?.map((bottleneck: any, index: number) => (
          <BottleneckCard
            key={index}
            bottleneck={bottleneck}
          />
        ))}
      </div>
      
      <div className="slow-services">
        <h3>Slowest Services</h3>
        {bottlenecks?.slow_services?.map((service: any) => (
          <SlowServiceCard key={service.service} service={service} />
        ))}
      </div>
    </div>
  );
}
```

---

## <a name="testing"></a>🧪 Testing Strategy

### 1. Performance Tests

```python
# backend/tests/performance/test_performance.py
import pytest
from fastapi.testclient import TestClient

def test_api_latency():
    """Test API response latency"""
    client = TestClient(app)
    
    start = time.perf_counter()
    response = client.get("/api/wells")
    latency = (time.perf_counter() - start) * 1000  # ms
    
    assert response.status_code == 200
    assert latency < 100  # Should be < 100ms

def test_end_to_end_latency():
    """Test end-to-end latency"""
    client = TestClient(app)
    
    response = client.get("/api/wells")
    trace_id = response.headers.get("X-Trace-Id")
    
    # Get trace
    trace_response = client.get(f"/api/v1/performance/latency/trace/{trace_id}")
    trace_data = trace_response.json()
    
    assert trace_data["total_latency"] < 200  # < 200ms end-to-end
```

---

## <a name="best-practices"></a>✅ Best Practices

### 1. Instrumentation
- Instrument all services
- Add custom spans for critical operations
- Track database queries
- Track external API calls

### 2. Monitoring
- Set appropriate thresholds
- Monitor trends, not just absolute values
- Alert on anomalies
- Regular performance reviews

### 3. Optimization
- Identify slowest services first
- Optimize critical paths
- Cache frequently accessed data
- Optimize database queries

---

**نسخه:** 1.0.0  
**تاریخ:** دسامبر 2025

