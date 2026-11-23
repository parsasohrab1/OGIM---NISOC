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
- Quick tests for critical paths are in `backend/tests/smoke/`.
- Run smoke tests in CI (`smoke-tests.yml`) and manually:
  ```bash
  cd backend
  pytest tests/smoke/test_smoke.py
  ```

## Contract / API Tests
- To ensure the API contract is not broken, it is recommended to extract and review the services' `openapi.json`.
- Recommended tool: `schemathesis` or `pact` (in the TODO).
- In CI you can add a step to diff OpenAPI versions or run contract tests.
