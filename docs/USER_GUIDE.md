# راهنمای کاربر OGIM (Updated)

این راهنما برای کاربر نهایی (اپراتور/مهندس) تهیه شده است.

## 1) شروع سریع

1. وارد پرتال شوید (`Dashboard`).
2. وضعیت اتصال Stream را بررسی کنید:
   - `WebSocket`
   - `SSE (fallback)`
   - `Polling fallback`
3. برای هشدارها به صفحه `Alerts` بروید.

## 2) مدیریت هشدارها

- مشاهده هشدارهای باز/حل‌شده
- تایید هشدار (`Acknowledge`)
- تحلیل همبستگی:
  - گروه‌بندی هشدارها در Correlation
- RCA:
  - اجرای تحلیل ریشه‌ای روی هشدار انتخابی

## 3) کیفیت داده و Lineage

صفحه `Data Quality`:
- شاخص‌ها:
  - `overall_score`, `completeness`, `validity`, `timeliness`, `consistency`
- نمایش lineage:
  - تعداد node/edge و اجزای مسیر داده
- گزارش خودکار:
  - `Generate Auto Report`

## 4) گزارش‌گیری پیشرفته و BI

- صفحه `Report Builder` (`/report-builder`):
  - انتخاب dimensions/measures
  - نمودار و export CSV
  - اتصال Power BI / Tableau
- صفحه `Reports`: گزارش‌های استاندارد daily/weekly/monthly

## 5) Workflow Automation

صفحه `Workflow`:
- ساخت workflow مرحله‌ای
- تعریف dependency بین stepها
- اجرای دستی (`Run Now`)
- مشاهده تاریخچه اجراها

## 6) Digital Twin / 3D / AR

- صفحه `3D Visualization`:
  - مشاهده چاه، تجهیزات، Risk Zone
- صفحه `AR Integration`:
  - payload واقعی AR overlay
  - اجرای سناریوی What-if و مشاهده KPIهای پیش‌بینی

## 7) اپ موبایل

`mobile/app`:
- Login با JWT
- Push Notification برای هشدارهای critical
- Offline mode (Alerts + Wells)
- Queue عملیات و sync بعد از اتصال

## 8) امنیت و KPIهای اجرایی

- صفحه `Security` (`/security`): رویدادهای SIEM، Zero Trust، threat detection
- صفحه `APM` (`/performance`): داشبورد عملکرد + KPIهای اجرایی
- KPIها: Latency P95، Uptime، Adoption، False Positive Rate
- API: `GET /kpi/summary`

