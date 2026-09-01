# Security Checklist

## Pre-Deployment
- [ ] همه SECRET ها از طریق Secret Manager تزریق شده‌اند (بدون مقادیر پیش‌فرض).
- [ ] کلید JWT (`SECRET_KEY`) حداقل 32 کاراکتر و تصادفی است.
- [ ] آدرس‌های CORS فقط دامنه‌های معتبر را شامل می‌شود.
- [ ] مهاجرت‌های پایگاه داده روی staging اجرا و تأیید شده‌اند.
- [ ] Role/RBAC برای سرویس‌ها مطابق با `docs/SECURITY_ROLES.md` بررسی شده است.

## Runtime
- [x] Rate limiting روی gateway و ورودی‌های حساس فعال است (`RATE_LIMIT_ENABLED`).
- [x] Input hardening برای XSS/SQLi (`shared/input_validation.py`).
- [x] Response cache برای GETهای پرتکرار (`TTLResponseCache`).
- [ ] Logging ساخت‌یافته (JSON) به سیستم مرکزی ارسال می‌شود.
- [x] Tracing و metrics فعال و در داشبوردها قابل مشاهده است.
- [x] هشدارهای امنیتی در SIEM buffer و Prometheus (`executive-kpis.yml`) تعریف شده‌اند.

## Post-Deployment
- [ ] حساب‌های پیش‌فرض حذف یا غیرفعال شده‌اند.
- [ ] دسترسی‌ها در گیت‌وی و سرویس‌ها تست شده (کاربر غیرمجاز دسترسی ندارد).
- [ ] نسخه‌های dependency ها بررسی و بسته‌های آسیب‌پذیر به‌روزرسانی شده‌اند.
- [ ] نسخه پشتیبان و برنامه بازیابی (DRP) تست شده است.

## Periodic Review
- [ ] Penetration test (هر ۶ ماه یا پس از نسخه‌ی بزرگ) – ابزار پیشنهادی: OWASP ZAP یا همکاری با تیم امنیت.
- [ ] RBAC audit (مقایسه نقش‌ها با `docs/SECURITY_ROLES.md` و حذف نقش‌های زائد)
- [ ] بررسی سلامت pipeline داده (نرخ خطای ingest، mismatch سنسور) – alert rule: `infrastructure/prometheus/rules/data-quality.yml`
- [ ] بازبینی هشدارهای Prometheus/Grafana و به‌روزرسانی آستانه‌ها
