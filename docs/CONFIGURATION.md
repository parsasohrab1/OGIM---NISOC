# Configuration & Secret Management

## Environment Profiles

پوشه `config/` حاوی فایل‌های نمونه برای محیط‌های مختلف است:

- `config/development.env.example`
- `config/production.env.example`

برای استفاده:

```bash
cp config/development.env.example config/development.env
cp config/production.env.example config/production.env
```

سپس متغیر `OGIM_ENV_FILE` را به مسیر فایل مناسب تنظیم کنید یا متغیر `ENVIRONMENT` را مقداردهی کنید تا فایل به صورت خودکار بارگذاری شود:

```bash
export OGIM_ENV_FILE=config/development.env
# یا
export ENVIRONMENT=production  # به طور خودکار به دنبال config/production.env می‌گردد
```

اگر فایل مطابق نام انتخاب‌شده موجود نباشد، برنامه از `.env` در ریشه پروژه استفاده می‌کند.

## Secret Management

در محیط‌های Production توصیه می‌شود مقادیر حساس از Secret Manager خارجی تزریق شوند:

- **Docker/Kubernetes**: استفاده از Docker secrets یا Kubernetes Secrets و Mount کردن به صورت فایل یا متغیر محیطی.
- **Cloud Vaults**: Azure Key Vault، AWS Secrets Manager یا HashiCorp Vault.

نمونه برای Kubernetes:

```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: ogim-secrets
        key: database-url
```

در CI/CD (GitHub Actions) نیز می‌توان Secrets را در Settings مخزن تعریف و هنگام اجرا تزریق کرد (`secrets.DATABASE_URL`).

## Default Values

برای توسعه محلی فایل `development.env.example` شامل مقادیر پیش‌فرض (Postgres/Kafka/Redis محلی) است. قبل از commit، این فایل‌ها را به `.example` برگردانید تا secrets واقعی وارد مخزن نشوند.
