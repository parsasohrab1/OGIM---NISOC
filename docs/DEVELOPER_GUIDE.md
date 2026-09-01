# Developer Guide

## 1. پیش‌نیازها
- Python 3.10+
- Node.js 18+
- Docker / Docker Compose (برای اجرای سرویس‌ها)

## 2. راه‌اندازی سریع Backend
```bash
python -m venv venv
source venv/bin/activate  # یا venv\Scripts\activate در ویندوز
pip install -r requirements.txt
pip install -r backend/shared/requirements.txt
uvicorn backend/auth-service.main:app --reload --port 8001
```

## 3. راه‌اندازی Frontend
```bash
cd frontend/web
npm install
npm run dev
```

## 4. محیط‌های پیکربندی
- فایل‌های نمونه در `config/*.env.example`
- متغیر `OGIM_ENV_FILE` یا `ENVIRONMENT` را تنظیم کنید تا فایل مناسب بارگذاری شود (جزئیات در `docs/CONFIGURATION.md`).

## 5. تست و کیفیت
- اجرای `pytest` در `backend/`
- Lint: `black --check backend`, `flake8 backend`
- CI/CD: GitHub Actions (`backend-ci.yml`) هنگام push/PR به main اجرا می‌شود.

## 6. ساختار کد
- سرویس‌های FastAPI در `backend/<service>/`
- کد مشترک در `backend/shared/`
- مستندات در `docs/`

## 7. گردش کار توسعه
1. ایجاد feature branch
2. اعمال تغییرات و اجرای lint/test محلی
3. باز کردن Pull Request => CI باید green باشد
4. پس از review و merge، migrations و استقرار مطابق `docs/MIGRATIONS.md`
