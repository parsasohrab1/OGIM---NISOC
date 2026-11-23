# QA & Ops Handoff Summary

## Test Coverage & Quality
- Pytest coverage threshold enforced at **60%** (`pytest.ini`).
- Command & control, data ingestion, auth and the other services have key unit tests. Running `pytest` produces a coverage report (HTML + terminal) in `backend/htmlcov/`.

## CI/CD Pipeline
- GitHub Actions workflow: `.github/workflows/backend-ci.yml`
  - `black --check`, `flake8`, `pytest`
  - `alembic upgrade head --sql` to check the migrations
- The pipeline output must be reviewed before merge (failures block the merge).

## Observability & Logging
- Metrics: `/metrics` endpoint for all services (Prometheus). Guide: `docs/OBSERVABILITY.md`
- Logging: JSON format + sample Promtail/Loki in `docs/LOGGING.md`
- Tracing: OpenTelemetry enabled; guide `docs/TRACING.md`

## Rollout Plan
1. Apply migrations per `docs/MIGRATIONS.md` (Dev → Stage → Prod).
2. Set up Prometheus/Grafana and Loki/Jaeger per the Observability documents.
3. Run `pytest` and check the pipeline in GitHub Actions before deployment.
4. Monitor the metrics and logs after the rollout; define alert thresholds in Prometheus/Grafana.

## Next Steps for Ops
- Set the required Secrets (DB URLs, OTLP endpoint) in the Stage/Prod environments.
- Set up similar pipelines in GitLab or Jenkins if necessary.
- Assign Runbook ownership and update it with dashboard links.

## ML Operations
- The retraining and quality alert plan is described in [`docs/ML_OPERATIONS.md`](ML_OPERATIONS.md).
- Prometheus alert rules: `infrastructure/prometheus/rules/model-quality.yml`

## Testing & Smoke
- Comprehensive tests: `pytest`
- Smoke tests (tracking key vulnerabilities): [`tests/smoke/`](../backend/tests/smoke/)
- CI: `.github/workflows/backend-ci.yml` and `.github/workflows/smoke-tests.yml`

## Security & Ops
- Security checklist: [`SECURITY_CHECKLIST.md`](SECURITY_CHECKLIST.md)
- The periodic review plan (penetration test, RBAC audit, pipeline monitoring) is specified in the Periodic Review section of the same document.
- Responsibility for monitoring data and model metrics lies with the Data Ops team; alerts are defined in `infrastructure/prometheus/rules/`.
