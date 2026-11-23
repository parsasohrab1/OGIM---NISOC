# CI/CD Pipeline Guide

This guide explains the steps for running Lint, tests and migration checks in GitHub Actions.

## 1. GitHub Actions Workflow

The file `.github/workflows/backend-ci.yml` includes the following steps:

1. **Install dependencies**: Install `black`, `flake8`, `alembic` and all the services' requirements.
2. **Lint**: Run `black --check` and `flake8` on the `backend/` folder.
3. **Tests**: Run `pytest` with the variable `SQLALCHEMY_DATABASE_URL=sqlite:///./ci.db` (sqlite inside CI).
4. **Alembic Check**: Run `alembic upgrade head --sql` to generate the SQL script and verify the migrations are valid.

The pipeline stops if any of the steps (lint/test/migration) fails.

## 2. Required variables

- `SQLALCHEMY_DATABASE_URL` or `DATABASE_URL`: The database URL for pytest and alembic (it can be sqlite in CI).
- In Production environments, this value must be supplied from a suitable Secret/Env (GitHub Secrets).

## 3. Manual execution

To run lint and tests manually:

```bash
python -m pip install --upgrade pip
pip install black flake8 alembic
pip install -r requirements.txt
# Install the other services' requirements if needed
black --check backend
flake8 backend
cd backend
pytest
alembic upgrade head --sql > migration.sql
```

## 4. Future development

- Integration with GitLab CI is similar: the dependency installation step, running lint/test and `alembic upgrade --sql` should be defined in separate jobs.
- In staging/prod environments, the `alembic upgrade head` step (without `--sql`) runs after QA approval.
