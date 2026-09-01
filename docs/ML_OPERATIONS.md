# ML Operations & Retraining Plan

## Available Models

### 1. Anomaly Detection (Isolation Forest)
- تشخیص ناهنجاری در داده‌های سنسور
- استفاده از Isolation Forest
- خروجی: anomaly score و probability

### 2. Failure Prediction (Random Forest)
- پیش‌بینی احتمال خرابی تجهیزات
- استفاده از Random Forest Classifier
- خروجی: failure probability

### 3. Time Series Forecasting (LSTM) ✅
- پیش‌بینی سری‌های زمانی با استفاده از شبکه‌های عصبی بازگشتی LSTM
- مناسب برای پیش‌بینی مقادیر آینده سنسورها
- معماری: دو لایه LSTM با Dropout
- پارامترهای قابل تنظیم:
  - `seq_length`: طول دنباله ورودی (پیش‌فرض: 60)
  - `forecast_horizon`: تعداد گام‌های پیش‌بینی (پیش‌فرض: 1)
  - `epochs`: تعداد دوره‌های آموزش (پیش‌فرض: 50)
  - `batch_size`: اندازه batch (پیش‌فرض: 32)

**استفاده:**
```bash
# آموزش مدل
python scripts/train_models.py --model time_series_forecast

# یا از طریق API
POST /models/time_series_forecast/train

# پیش‌بینی
POST /forecast
{
  "sensor_id": "TAG-001",
  "historical_data": [1.2, 1.5, 1.3, ...],  # حداقل 60 نقطه
  "forecast_steps": 5  # پیش‌بینی 5 گام آینده
}
```

## Scheduled Retraining
- اجرای job دوره‌ای (مثل CronJob یا GitHub Actions) برای اجرای `scripts/train_models.py`.
  - نمونه GitHub Actions: `.github/workflows/ml-retrain.yml`
  - متغیرهای مورد نیاز: `DATABASE_URL`, `MLFLOW_TRACKING_URI`, `SYSTEM_ADMIN_TOKEN`
- پس از موفقیت، endpoint `/models/reload` در سرویس ML فراخوانی می‌شود.

## Monitoring Model Quality
- متریک‌های دقت (accuracy، anomaly_rate) در هنگام آموزش با `_log_model_metrics` ثبت می‌شود.
- برای خروجی Prometheus باید این متریک‌ها به صورت gauge جمع‌آوری شود (TODO: قرار دادن مقدار در endpoint metrics).
- اگر مقدار دقت زیر 0.8 افت کند، rule `ModelAccuracyLow` فعال می‌شود.

## Alerting Rules
- فایل `infrastructure/prometheus/rules/model-quality.yml` شامل دو rule است:
  - `ModelAccuracyLow`: accuracy < 0.8 به مدت 10 دقیقه.
  - `ModelRetrainOverdue`: اگر بیش از 30 روز از آخرین بازآموزی بگذرد.
- Alertmanager می‌تواند پیام را به Slack/Email ارسال کند.

## Data Quality & Pipeline Health
- قبل از آموزش داده‌ها validate می‌شود؛ توصیه می‌شود نرخ داده‌های invalid و سایر شاخص‌ها نیز در Prometheus ثبت شود.
- در صورت مشاهده خطا یا کمبود داده، آموزش باید fail شود و هشدار ثبت گردد.

## Rollback Strategy
- نسخه‌های قبلی مدل در MLflow دسترس است؛ برای rollback کافیست نسخه قبل را load و `/models/reload` را فراخوانی کنید.
- این فرآیند باید در Runbook (`HANDOFF.md`) ثبت شود.
