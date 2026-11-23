# Executive KPIs — OGIM

**Goal:** Executive indicators for monitoring Latency, Uptime, Adoption and False Positive Rate.

## Main KPIs

| KPI | Target | Measurement source |
|-----|------|------------------|
| **Latency (P95)** | < 100ms | `GET /kpi/summary` → `latency.p95_ms` |
| **Uptime** | ≥ 99.9% | `GET /kpi/summary` → `uptime.ratio` |
| **Adoption** | ≥ 5 active features/month | `GET /kpi/summary` → `adoption.feature_hits` |
| **False Positive Rate** | ≤ 30% | `GET /kpi/summary` → `alert_quality.false_positive_rate` |

## Prometheus Metrics

- `ogim_kpi_api_latency_seconds` — histogram per service
- `ogim_kpi_system_uptime_ratio` — gauge
- `ogim_kpi_feature_usage_total` — counter per feature
- `ogim_kpi_alert_false_positive_total` — counter per severity

## Alert Rules

File: `infrastructure/prometheus/rules/executive-kpis.yml`

- `KPILatencyP95High` — P95 > 100ms
- `KPIUptimeLow` — uptime < 99.9%
- `KPIFalsePositiveRateHigh` — FP rate > 30%

## Dashboard

- Grafana: **OGIM APM Overview**
- Web UI: **APM** page (`/performance`)

## Sample API

```bash
curl http://localhost:8000/kpi/summary
curl http://localhost:8000/kpi/cache-stats
curl -X POST http://localhost:8000/kpi/feature-usage -H "Content-Type: application/json" -d "{\"feature\":\"dashboard\"}"
curl -X POST http://localhost:8000/kpi/cache/invalidate -H "Content-Type: application/json" -d "{}"
```

The Web UI **APM** page (`/performance`) also feeds adoption from the visited routes (Layout → `feature-usage`).

Hardening details: [PHASE3_HARDENING.md](PHASE3_HARDENING.md)
