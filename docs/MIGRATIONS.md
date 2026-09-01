# راهنمای مهاجرت دیتابیس با Alembic

این سند فرآیند اعمال تغییرات بانک اطلاعاتی از توسعه تا تولید را مشخص می‌کند.

## محیط‌ها
- **Development (local/dev cluster)**: جایی که تغییرات مدل و migration جدید تولید می‌شود.
- **Staging**: محیط تست یکپارچه با داده‌های شبه‌واقعی؛ migration تولیدشده باید ابتدا اینجا اعمال و تأیید شود.
- **Production**: محیط عملیاتی. هیچ تغییری بدون عبور از staging اجرا نمی‌شود.

## گردش‌کار مهاجرت
1. **توسعه migration**
   ```bash
   cd backend
   alembic revision --autogenerate -m "describe change"
   ```
   - فایل جدید در `backend/migrations/versions/` را بازبینی کنید؛ فقط تغییرات لازم باید وجود داشته باشد.
   - تست‌ها:  
     ```bash
     pytest backend/tests
     alembic upgrade head  # روی دیتابیس محلی
     alembic downgrade -1  # برای اطمینان از قابلیت rollback
     ```

2. **استقرار به Staging**
   - در Pipeline CI/CD:  
     ```bash
     alembic upgrade head --sql > migrations.sql  # تولید اسکریپت
     # پس از تأیید، روی دیتابیس staging اعمال کنید:
     alembic -x db_url=<STAGING_DB_URL> upgrade head
     ```
   - صحت سرویس‌ها را بررسی کنید (health check، smoke test).

3. **استقرار Production**
   - پس از تأیید QA، همان اسکریپت SQL یا دستور `alembic upgrade head` با URL تولید اجرا می‌شود.
   - در صورت خطا، دستور `alembic downgrade -1` آماده است اما توصیه می‌شود اسکریپت‌های migration قابلیت rollback داشته باشند.

## متغیرها و تنظیمات
- فایل `backend/alembic.ini` از متغیر محیطی `SQLALCHEMY_DATABASE_URL` یا `DATABASE_URL` استفاده می‌کند.
- برای TimescaleDB یا پایگاه‌های دیگر، در صورت نیاز بخش‌های محیطی جدا (مثلاً `alembic_ts.ini`) تعریف کنید.

## نکات:
- Migration تولید‌شده باید توسط Peer Review بررسی شود.
- از اجرای `alembic revision --autogenerate` روی دیتابیس production یا staging خودداری کنید؛ فقط در محیط dev.
- اسکریپت SQL تولید‌شده برای production باید در سیستم کنترل نسخه ذخیره شود (یا به Release مکتوب ضمیمه گردد).

## دستورات مفید
- مشاهده وضعیت migration‌ها: `alembic current`
- مشاهده تاریخچه: `alembic history`
- اجرای migration خاص: `alembic upgrade <revision>`

با رعایت این گردش‌کار، تیم می‌تواند تغییرات دیتابیس را کنترل‌شده و قابل ردیابی بین محیط‌ها منتقل کند.*** End Patch

