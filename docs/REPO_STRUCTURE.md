# Repository Structure

```
OGIM---Oil-Gas-Intelligent-Monitoring/
├── backend/                # Backend microservices (FastAPI)
├── frontend/               # Web dashboard (React/Vite)
├── infrastructure/         # Docker, Prometheus, logging configs
├── docs/                   # Documentation
├── data/                   # Sample datasets and generators
├── scripts/                # Utility scripts (deployment, tests)
├── html-demo/              # Lightweight HTML prototype
├── requirements.txt        # Shared dependencies for tooling
├── .github/workflows/      # CI/CD pipelines
└── README.md               # SRS and high-level overview
```

> Note: پوشه‌ی تکراری `OGIM---Oil-Gas-Intelligent-Monitoring/OGIM---Oil-Gas-Intelligent-Monitoring/` دیگر استفاده نمی‌شود و برای سازگاری نگه داشته شده است؛ در نسخه‌های بعدی حذف خواهد شد.

## Guidelines
- همه‌ی سرویس‌های backend در `backend/` قرار دارند؛ هر سرویس پوشه‌ی مستقل و فایل `requirements.txt` خود را دارد.
- مستندات رسمی در `docs/` نگهداری می‌شوند و از README اصلی پیوند دارند.
- فایل‌های زیرساخت (Prometheus، logging، docker-compose) در `infrastructure/` گروه‌بندی شده‌اند.
- داده‌های نمونه و generatorها داخل `data/` هستند؛ حاوی نمونه CSV/JSON برای سناریوهای توسعه است.
