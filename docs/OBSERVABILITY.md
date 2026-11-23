# Observability – Prometheus & Grafana

This guide explains how to collect metrics and build dashboards for the OGIM services.

## 1. Recommended components

- **Prometheus**: Collects metrics from the services (`/metrics`).
- **Grafana**: Displays dashboards, defines alerts.
- (Optional) **Alertmanager**: Manages Prometheus alerts.

Sample docker-compose (summary):

```yaml
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.110.0
    ports:
      - "4317:4317" # OTLP gRPC

  tempo:
    image: grafana/tempo:2.6.1
    ports:
      - "3200:3200"

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
```

Production-ready files for this stack have been added to the project:

- `infrastructure/otel/otel-collector-config.yaml`
- `infrastructure/tempo/tempo.yaml`
- `infrastructure/grafana/provisioning/datasources/datasources.yaml`
- `infrastructure/grafana/provisioning/dashboards/dashboards.yaml`
- `infrastructure/grafana/provisioning/dashboards/json/ogim-apm-overview.json`

## 2. Prometheus configuration

In `infrastructure/prometheus/prometheus.yml` (sample):

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: ogim-services
    static_configs:
      - targets:
          - alert-service:8004
          - command-control-service:8006
          - data-ingestion-service:8002
          - tag-catalog-service:8007
          - auth-service:8001
          - ml-inference-service:8003
          - api-gateway:8000
```

Every FastAPI service now exposes the `/metrics` path. If `prometheus-client` is not installed, the service returns a 503 error.

## 3. Available metrics

### General (all services)
- `service_requests_total{service,method,status}`
- `service_request_errors_total{service,method,status}`
- `service_request_latency_seconds{service,method,path}`

### ML Inference specific
- `ml_inference_requests_total{model_type}`
- `ml_inference_errors_total{model_type,reason}`
- `ml_inference_latency_seconds{model_type}`

## 4. Basic Grafana dashboard

Recommended panels:
- **Latency (p95/p99)**: From `histogram_quantile` on `service_request_latency_seconds`.
- **Error Rate**: Percentage of requests with `status>=500`.
- **Request Volume**: Cumulative chart of `service_requests_total`.
- **Inference Performance** (advanced): latency/errors by `model_type`.

Sample Latency query:
```promql
histogram_quantile(0.95, sum(rate(service_request_latency_seconds_bucket{service="api-gateway"}[5m])) by (le))
```

## 5. Alerts
- **High error rate**: If `rate(service_request_errors_total[5m]) > 0.01` for a specific service.
- **High Latency**: `histogram_quantile(0.99, ...) > 2s`.
- **Repeated failed logins**: Can be used from audit logs (integration with Alertmanager / SIEM).

## 6. Tracing (OpenTelemetry)
- All services are configured with `setup_tracing`; to enable it, set the `OTEL_EXPORTER_OTLP_ENDPOINT` variable.
- In `infrastructure/docker/docker-compose.yml` this value is set by default to `http://otel-collector:4317`.
- A sample configuration and deployment of Jaeger is available in [`docs/TRACING.md`](TRACING.md).
- The API Gateway automatically propagates the context to downstream services.

## 7. Structured Logging
- The log output of all services is JSON (file `shared/logging_config.py`). Fields such as `service`, `environment`, `correlation_id` and exception details are recorded by default.
- To ship logs to Loki or ELK, see [`docs/LOGGING.md`](LOGGING.md) and use the sample configuration `infrastructure/logging/promtail-config.yaml`.
- It is recommended to build a dashboard in Grafana/Kibana that filters logs by `service` and `level`.

## 8. CI/CD and documentation
- In the deployment pipeline, after deploying the services, reload Prometheus/Grafana (or use a Kubernetes ServiceMonitor).
- Record the address and access method of the dashboards and tracing tools in the operational Runbook.
- For the Ops team, add alert thresholds and response actions to the Runbook.

## 9. SIEM & Threat Detection
- Security events are emitted in the services' logs with the `SIEM_EVENT` prefix (JSON format).
- If `SIEM_OUTPUT_FILE` is set, events are also written to a newline-delimited JSON file.
- The Zero Trust policy in the gateway is enabled with `ZERO_TRUST_ENFORCED=true` and `ZERO_TRUST_ALLOWED_NETWORKS`.
- Threat scoring is controlled with `THREAT_BLOCK_THRESHOLD`; high-risk requests are blocked at the gateway.

With this structure you can track the health trend of the services and manage early alerts.

