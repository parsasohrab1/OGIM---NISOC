# Security Checklist

## Pre-Deployment
- [ ] All SECRETs are injected through a Secret Manager (no default values).
- [ ] The JWT key (`SECRET_KEY`) is at least 32 characters and random.
- [ ] The CORS addresses include only valid domains.
- [ ] Database migrations have been run and verified on staging.
- [ ] Role/RBAC for the services has been reviewed per `docs/SECURITY_ROLES.md`.

## Runtime
- [x] Rate limiting is enabled on the gateway and sensitive inputs (`RATE_LIMIT_ENABLED`).
- [x] Input hardening for XSS/SQLi (`shared/input_validation.py`).
- [x] Response cache for frequently requested GETs (`TTLResponseCache`).
- [ ] Structured logging (JSON) is shipped to the central system.
- [x] Tracing and metrics are enabled and visible in the dashboards.
- [x] Security alerts are defined in the SIEM buffer and Prometheus (`executive-kpis.yml`).

## Post-Deployment
- [ ] Default accounts have been removed or disabled.
- [ ] Access on the gateway and services has been tested (an unauthorized user has no access).
- [ ] Dependency versions have been reviewed and vulnerable packages updated.
- [ ] Backup and the recovery plan (DRP) have been tested.

## Periodic Review
- [ ] Penetration test (every 6 months or after a major release) – recommended tool: OWASP ZAP or work with the security team.
- [ ] RBAC audit (compare roles with `docs/SECURITY_ROLES.md` and remove redundant roles)
- [ ] Data pipeline health check (ingest error rate, sensor mismatch) – alert rule: `infrastructure/prometheus/rules/data-quality.yml`
- [ ] Review Prometheus/Grafana alerts and update the thresholds
