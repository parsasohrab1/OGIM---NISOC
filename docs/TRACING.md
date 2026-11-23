# Tracing with OpenTelemetry

This guide explains how to enable and view end-to-end Traces between the OGIM services.

## Dependencies

The following packages are installed in each service:

- `opentelemetry-sdk`
- `opentelemetry-exporter-otlp`
- `opentelemetry-instrumentation-fastapi`
- `opentelemetry-instrumentation-httpx` (for the API Gateway)
- `opentelemetry-instrumentation-requests`

The shared module `backend/shared/tracing.py` provides the `setup_tracing` function, which is called in all services.

## Environment settings

To send spans to OTLP (Jaeger, Tempo or Collector), set the following variables:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
# Optional: simultaneous viewing in the logs
export OTEL_TRACING_CONSOLE=true
```

If `OTEL_TRACING_CONSOLE=true`, in addition to being sent to the endpoint, spans are also printed to stdout.

## Running APM with OpenTelemetry Collector + Tempo + Grafana

```yaml
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib
  tempo:
    image: grafana/tempo
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

Ready-made files in the project:

- `infrastructure/otel/otel-collector-config.yaml`
- `infrastructure/tempo/tempo.yaml`
- `infrastructure/grafana/provisioning/datasources/datasources.yaml`
- `infrastructure/grafana/provisioning/dashboards/json/ogim-apm-overview.json`

The OGIM services run with the variable `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317`.
To view the traces:

1. Bring up the stack (`infrastructure/docker/docker-compose.yml`)
2. Open Grafana: `http://localhost:3001`
3. In Explore, select the `Tempo` datasource
4. Search for `service.name=api-gateway` or the other services

## End-to-end flow

1. **API Gateway**: With `setup_tracing(... instrument_httpx=True)` it traces incoming requests and propagates the context through HTTPX when calling downstream services.
2. **Internal services**: `setup_tracing(app, "<service>")` runs for each service; the context is received in the `traceparent` header and a new span is created.
3. **Services with HTTP or DB output**: Instrumentation traces outgoing requests (such as the `requests` library).

## Operational notes

- The service name, version and environment are placed as attributes on the span (`service.name`, `deployment.environment`).
- To add more metadata (e.g. the command ID), use `trace.get_current_span().set_attribute(...)` in code.
- If custom propagation is needed (e.g. Kafka), you must send the messages with the `traceparent` header.

## Quick test

1. Run the Collector + Tempo + Grafana per the compose file.
2. Run the services with the endpoint variable.
3. Send a sample request to the API Gateway (`/api/alert/alerts`).
4. Check the trace in Grafana Tempo; at least two spans (gateway + internal service) should be visible.

With this setup, the team can see the latency of the full path of each request and identify bottlenecks.*** End Patch

