# QA & Ops Handoff Summary

## Test Coverage & Quality
- Pytest coverage threshold enforced at **60%** (`pytest.ini`).
- Command & control, data ingestion، auth و سایر سرویس‌ها دارای unit tests کلیدی هستند. اجرای `pytest` گزارش پوشش (HTML + ترمینال) در `backend/htmlcov/` تولید می‌کند.

## CI/CD Pipeline
- GitHub Actions workflow: `.github/workflows/backend-ci.yml`
  - `black --check`, `flake8`, `pytest`
  - `alembic upgrade head --sql` برای بررسی migration ها
- خروجی pipeline باید قبل از merge بررسی شود (failure ها مانع merge می‌شوند).

## Observability & Logging
- Metrics: `/metrics` endpoint برای همه سرویس‌ها (Prometheus). راهنما: `docs/OBSERVABILITY.md`
- Logging: فرمت JSON + Promtail/Loki نمونه در `docs/LOGGING.md`
- Tracing: OpenTelemetry فعال؛ راهنما `docs/TRACING.md`

## Rollout Plan
1. اعمال migrations طبق `docs/MIGRATIONS.md` (Dev → Stage → Prod).
2. راه‌اندازی Prometheus/Grafana و Loki/Jaeger طبق اسناد Observability.
3. اجرای `pytest` و بررسی pipeline در GitHub Actions پیش از استقرار.
4. مانیتور کردن متریک‌ها و لاگ‌ها بعد از rollout؛ تعریف alert threshold ها در Prometheus/Grafana.

## Next Steps for Ops
- تنظیم Secrets مورد نیاز (DB URLs، OTLP endpoint) در محیط‌های Stage/Prod.
- راه‌اندازی pipeline های مشابه در GitLab یا Jenkins در صورت ضرورت.
- تعیین مالکیت Runbook و به‌روزرسانی آن با لینک dashboard ها.

## ML Operations
- برنامه بازآموزی و هشدار کیفیت در [`docs/ML_OPERATIONS.md`](ML_OPERATIONS.md) توضیح داده شده است.
- قوانین هشدار Prometheus: `infrastructure/prometheus/rules/model-quality.yml`

## Testing & Smoke
- تست‌های جامع: `pytest`
- Smoke tests (ردیابی آسیب‌پذیری کلیدی): [`tests/smoke/`](../backend/tests/smoke/)
- CI: `.github/workflows/backend-ci.yml` و `.github/workflows/smoke-tests.yml`

## Security & Ops
- لیست چک امنیتی: [`SECURITY_CHECKLIST.md`](SECURITY_CHECKLIST.md)
- برنامه بازبینی دوره‌ای (penetration test، RBAC audit، پایش pipeline) در بخش Periodic Review همان سند مشخص است.
- مسئولیت پایش متریک‌های داده و مدل با تیم Data Ops است؛ هشدارها در `infrastructure/prometheus/rules/` تعریف شده‌اند.
