# OGIM — Marun Field Deployment (NISOC)

این ریپازیتوری یک **کپی کامل و مستقل (fork)** از محصول [OGIM — هوشمندسازی میادین نفت و گاز](https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring) است که برای استقرار نمایشی روی **میدان مارون**، یکی از میادین **شرکت ملی مناطق نفت‌خیز جنوب (NISOC)**، بومی‌سازی شده است.

## 🎯 Technology Readiness Level (TRL) Status

**Current TRL**: **4** (evaluated on REAL field data with fixed methodology)

**Latest Evaluation** (2026-11-09, 20 instances/class, v6_optimized):
- ✅ **Leakage audit:** PASSED (per-sample labeling, well-grouped splits, balanced training, missing-class check)
- ❌ **Detector is degenerate (TN=0):** Predicts event 100% of the time; 1440 false alarms/day
- ❌ **TRL5 Criteria:** Failed Binary Macro-F1 (0.446 < 0.65) and False Alarms/Day (1440 > 3.0)
- ⚠️ **No practical discrimination:** Recall and lead time are trivial artifacts of always alarming

**Verdict:** TRL4 maintained. Methodology is sound but detector provides no operational value; requires feature engineering redesign.

**Documents**:
- [TRL5 Acceptance Criteria](TRL5_ACCEPTANCE_CRITERIA.md) (predeclared, commit bcea1d4, unchanged)
- [Real Data Validation Report](docs/validation-real-data.md) (complete findings, limitations, recommendations)
- [Validation Results JSON](results/3w_validation_results.json) (20 instances/class, full confusion matrix + CIs)

## وضعیت داده — مهم

داده‌های این ریپو **سنتتیک/نمایشی** هستند، نه دادهٔ واقعی و محرمانهٔ میدان مارون. معماری، منطق سرویس‌ها و مدل داده کاملاً واقعی و کاربردی است، اما مقادیر سنسورها (فشار، دما، دبی، لرزش و ...) با یک مولد قطعی (seeded pseudo-random) تولید می‌شوند — دقیقاً همان الگویی که برای میدان دهلران در محصول اصلی استفاده شده، اینجا با پارامترها و برندینگ میدان مارون بازتولید شده است. اتصال به داده و سنسورهای واقعی میدان مارون نیازمند یکپارچه‌سازی جداگانه با SCADA/Historian واقعی NISOC است که خارج از دامنهٔ این fork می‌باشد.

**🆕 Real Field Data Validation**: برای اعتبارسنجی با داده‌های واقعی، از دیتاست [Petrobras 3W](https://github.com/petrobras/3W) استفاده شده است. جزئیات در [گزارش اعتبارسنجی](docs/validation-real-data.md).

## چرا یک ریپوی جدا و جدا از میدان دهلران؟

- **ذخیره‌سازی کاملاً مستقل**: این fork زیرساخت (PostgreSQL، TimescaleDB، Kafka، Redis) و کد خودش را دارد؛ هیچ داده یا پایگاه‌دادهٔ مشترکی با نمونهٔ میدان دهلران ندارد.
- **بومی‌سازی کامل**: تمام ۹ ماژول دادهٔ محلی (`marunField`, `marunAlerts`, `marunScada`, `marunDvr`, `marunRul`, `marunAr`, `marunMl`, `marunLstm`, `marunFederated`) و تمام صفحات فرانت‌اند برای میدان مارون بازنویسی شده‌اند: ۲۴ حلقه چاه با شناسهٔ `MRN-01`…`MRN-24`، کارفرمای NISOC، نوع نفت سبک-میانه ترش با درجهٔ سنگینی ≈۳۴.۵ API، و مخزن آسماری–بنگستان (اعماق نمایشی ۲۸۰۰ تا ۴۳۰۰ متر).

## معماری و تکنولوژی

همان معماری میکروسرویس محصول اصلی، بدون تغییر:

| لایه | تکنولوژی |
|---|---|
| فرانت‌اند | React 18, TypeScript, Vite, Recharts |
| بک‌اند | FastAPI, Python 3.10+, SQLAlchemy |
| پردازش جریان داده | Apache Kafka |
| پایگاه‌داده | PostgreSQL, TimescaleDB, Redis |
| مانیتورینگ | Prometheus, Grafana, OpenTelemetry, Tempo |
| ۱۵ میکروسرویس بک‌اند | API Gateway، Auth، Data Ingestion، ML Inference، Alert، Reporting، Command & Control، Tag Catalog، Digital Twin، Edge Computing، ERP Integration، DVR، Remote Operations، Data Variables، Storage Optimization |

جزئیات کامل هر سرویس و پورت‌ها را در `docker-compose.dev.yml` ببینید.

## اجرای آفلاین/نمایشی (بدون بک‌اند)

```bash
cd frontend/web
npm install
npm run dev:offline
```
سپس `http://localhost:3000` را باز کنید. داشبورد کاملاً آفلاین و با دادهٔ نمایشی میدان مارون کار می‌کند — دقیقاً مطابق همان رفتار «تلاش برای API واقعی → fallback محلی» که در محصول اصلی پیاده‌سازی شده.

## اجرای کامل با بک‌اند

```bash
docker compose -f docker-compose.dev.yml up
```
همهٔ سرویس‌ها (بک‌اند، Kafka، PostgreSQL/TimescaleDB، Redis، Prometheus/Grafana) روی همین ریپو و کاملاً مستقل از هر استقرار دیگر بالا می‌آیند.

## نگاشت به بک‌لاگ محصول

این fork یکی از آیتم‌های بک‌لاگ محصول اصلی («پشتیبانی چندمیدانی») را به‌صورت عملی و مستقل پیاده‌سازی می‌کند؛ برای اتصال دادهٔ واقعی میدان مارون یا میدان‌های دیگر NISOC در آینده، به بخش «منبع داده» در بالای این فایل مراجعه کنید.
