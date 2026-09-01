# Testing Guide

## Running Tests

From the `backend/` directory:

```bash
pytest
```

This command runs unit and integration tests and collects coverage. The configuration in `pytest.ini` enforces:

- Strict markers and shortened tracebacks.
- Coverage reports (`htmlcov/` and terminal output).
- Minimum coverage threshold of **60%** (`--cov-fail-under=60`).

## Fixtures & Mocks

- **Database**: tests use an in-memory SQLite database via fixtures in `tests/conftest.py` to emulate Postgres/Timescale tables.
- **Kafka / External services**: tests monkeypatch Kafka producers (`command-control-service`, `data-ingestion-service`) so no external broker is required.

## Adding New Tests

- Place unit tests in `backend/tests/test_<service>.py`.
- Use dependency overrides and FastAPI `TestClient` to exercise endpoints.
- Ensure new migrations or models are compatible with the sqlite-based fixtures.

## Smoke Tests
- تست‌های سریع برای مسیرهای حیاتی در `backend/tests/smoke/` قرار دارد.
- اجرای smoke در CI (`smoke-tests.yml`) و به صورت دستی:
  ```bash
  cd backend
  pytest tests/smoke/test_smoke.py
  ```

## Contract / API Tests
- برای اطمینان از عدم شکستن قرارداد API، توصیه می‌شود `openapi.json` سرویس‌ها استخراج و بررسی شود.
- ابزار پیشنهادی: `schemathesis` یا `pact` (در TODO).
- در CI می‌توان مرحله‌ای برای diff نسخه‌های OpenAPI یا اجرای تست قرارداد اضافه کرد.
