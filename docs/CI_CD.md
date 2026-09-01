# CI/CD Pipeline Guide

این راهنما مراحل اجرای Lint، تست و بررسی migration ها را در GitHub Actions توضیح می‌دهد.

## 1. GitHub Actions Workflow

فایل `.github/workflows/backend-ci.yml` شامل مراحل زیر است:

1. **نصب وابستگی‌ها**: نصب `black`, `flake8`, `alembic` و تمام requirements سرویس‌ها.
2. **Lint**: اجرای `black --check` و `flake8` روی پوشه `backend/`.
3. **Tests**: اجرای `pytest` با متغیر `SQLALCHEMY_DATABASE_URL=sqlite:///./ci.db` (sqlite داخل CI).
4. **Alembic Check**: اجرای `alembic upgrade head --sql` برای تولید اسکریپت SQL و اطمینان از صحت migrationها.

Pipeline با شکست هر یک از مراحل (lint/test/migration) متوقف می‌شود.

## 2. متغیرهای مورد نیاز

- `SQLALCHEMY_DATABASE_URL` یا `DATABASE_URL`: URL دیتابیس برای pytest و alembic (در CI می‌تواند sqlite باشد).
- در محیط‌های Production، این مقدار باید از Secret/Env مناسبی (GitHub Secrets) تأمین شود.

## 3. اجرای دستی

برای اجرای lint و تست به صورت دستی:

```bash
python -m pip install --upgrade pip
pip install black flake8 alembic
pip install -r requirements.txt
# نصب سایر requirements سرویس‌ها در صورت نیاز
black --check backend
flake8 backend
cd backend
pytest
alembic upgrade head --sql > migration.sql
```

## 4. توسعه آینده

- ادغام با GitLab CI نیز مشابه است: مرحله‌ی نصب وابستگی‌ها، اجرای lint/test و `alembic upgrade --sql` باید در jobs جداگانه تعریف شود.
- در محیط‌های staging/prod، مرحله‌ی `alembic upgrade head` (بدون `--sql`) پس از تأیید QA اجرا می‌شود.
