# Logging & Centralized Aggregation

This guide explains how service logs are produced in JSON format and shipped to a central destination (ELK / Loki) in Dev/Prod.

## Log format

The `JSONFormatter` class in `backend/shared/logging_config.py` records the following fields:

| Field | Description |
|------|-------|
| `timestamp` | UTC time the log was created |
| `level` | Level (INFO, ERROR, …) |
| `service` | Service name (`setup_logging("service-name")`) |
| `environment` | The value of `settings.ENVIRONMENT` (dev/staging/prod) |
| `message`, `module`, `function`, `line` | Standard log information |
| `correlation_id`, `request_id`, `user_id` | If passed via the logger adapter |
| `exception` | Stack trace text if an error occurs |

If you need more context, use `LoggerAdapter`:

```python
from shared.logging_config import LoggerAdapter, setup_logging

logger = setup_logging("alert-service")
logger = LoggerAdapter(logger, {"correlation_id": req_id})
logger.info("Alert acknowledged", extra={"user_id": user.username})
```

## Shipping to Loki (Dev example)

### The file `infrastructure/logging/promtail-config.yaml`
This file is a sample Promtail that collects logs from the services' stdout and ships them to Loki:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: ogim-services
    static_configs:
      - targets:
          - localhost
        labels:
          job: ogim
          __path__: /var/log/containers/*ogim*.log
```

### Running Loki + Promtail + Grafana (sample docker-compose)

```yaml
services:
  loki:
    image: grafana/loki:2.9.0
    command: -config.file=/etc/loki/local-config.yaml
    ports: ["3100:3100"]

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - ./promtail-config.yaml:/etc/promtail/promtail-config.yaml
      - /var/log:/var/log
    command: -config.file=/etc/promtail/promtail-config.yaml

  grafana:
    image: grafana/grafana:10.2.0
    ports: ["3002:3000"]
```

In Grafana, add a datasource of type Loki and run the following sample query to view a service's logs:

```logql
{job="ogim", service="auth-service"} | json | level="ERROR"
```

## Shipping to ELK (another option)

If you use ELK, you can replace Promtail with Filebeat or Logstash. Just take the input from the containers' stdout or the log file and ship it to Elasticsearch. The JSON formatter needs no additional configuration.

## Operational notes
- Log levels are controlled by `settings.LOG_LEVEL` (default `INFO`).
- In production, `LOG_FORMAT=json` must be set so that logs are stored in structured form.
- For request tracing, pass the request ID from the Gateway or middleware to the logger (correlation/request id).
- In case of an incident, you can follow the request path across all services by filtering on `correlation_id`.

