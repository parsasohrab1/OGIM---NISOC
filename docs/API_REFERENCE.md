# API Reference (Updated)

این سند خلاصه endpointهای کلیدی نسخه فعلی OGIM را پوشش می‌دهد.

## Base Gateway

- `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

## Realtime Streaming

- `GET /stream/realtime/sse?token=...`
- `WS /stream/realtime/ws?token=...`

## Alerting (Correlation / RCA / Fatigue / Push)

- `GET /api/alert/alerts`
- `POST /api/alert/alerts`
- `POST /api/alert/alerts/{alert_id}/acknowledge`
- `POST /api/alert/alerts/{alert_id}/resolve`
- `GET /api/alert/alerts/correlations`
- `POST /api/alert/alerts/{alert_id}/rca`
- `POST /api/alert/notifications/devices/register`
- `POST /api/alert/notifications/devices/unregister`
- `GET /api/alert/notifications/devices`

## ML Model Management

- `GET /api/ml-inference/models`
- `GET /api/ml-inference/models/{model_type}/versions`
- `POST /api/ml-inference/models/{model_type}/compare`
- `POST /api/ml-inference/models/{model_type}/ab-test`
- `GET /api/ml-inference/models/{model_type}/ab-test`
- `POST /api/ml-inference/models/{model_type}/drift/baseline`
- `POST /api/ml-inference/models/{model_type}/drift/detect`
- `POST /api/ml-inference/infer`

## Data Quality + Lineage + BI

- `POST /api/reporting/reports/data-quality-lineage`
- `POST /api/reporting/reports/data-quality-lineage/auto`
- `GET /api/reporting/reports/data-quality-lineage/auto`
- `POST /api/reporting/reports/builder`
- `GET /api/reporting/bi/metadata`
- `POST /api/reporting/bi/query`
- `GET /api/reporting/bi/connectors`

## Security (Zero Trust / SIEM / Threat Detection)

- `GET /security/siem/events?limit=50&severity=...`
- `GET /security/threat/status`

## Executive KPIs

- `GET /kpi/summary` — latency, uptime, adoption, false-positive rate
- `GET /kpi/cache-stats` — API response cache hit rate

## Workflow Automation (Airflow-like)

- `POST /api/reporting/workflows`
- `GET /api/reporting/workflows`
- `GET /api/reporting/workflows/templates`
- `GET /api/reporting/workflows/{workflow_id}`
- `POST /api/reporting/workflows/{workflow_id}/run`
- `GET /api/reporting/workflows/{workflow_id}/runs`
- `GET /api/reporting/workflows/visual-builder/step-types`

## Digital Twin (3D / AR / What-if)

- `POST /api/digital-twin/simulate`
- `GET /api/digital-twin/simulations`
- `GET /api/digital-twin/well/{well_name}/3d`
- `GET /api/digital-twin/bim3d/scene/{well_name}`
- `POST /api/digital-twin/what-if`
- `GET /api/digital-twin/ar/overlay/{well_name}`

