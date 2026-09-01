# Tracing با OpenTelemetry

این راهنما نحوه‌ی فعال‌سازی و مشاهده‌ی Traceهای end-to-end بین سرویس‌های OGIM را توضیح می‌دهد.

## وابستگی‌ها

در هر سرویس پکیج‌های زیر نصب شده‌اند:

- `opentelemetry-sdk`
- `opentelemetry-exporter-otlp`
- `opentelemetry-instrumentation-fastapi`
- `opentelemetry-instrumentation-httpx` (برای API Gateway)
- `opentelemetry-instrumentation-requests`

ماژول مشترک `backend/shared/tracing.py` تابع `setup_tracing` را فراهم می‌کند که در تمام سرویس‌ها فراخوانی شده است.

## تنظیمات محیطی

برای ارسال spanها به OTLP (Jaeger، Tempo یا Collector)، متغیرهای زیر را تنظیم کنید:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
# اختیاری: مشاهده همزمان در لاگ‌ها
export OTEL_TRACING_CONSOLE=true
```

اگر `OTEL_TRACING_CONSOLE=true` باشد، علاوه بر ارسال به endpoint، spanها در stdout نیز چاپ می‌شوند.

## اجرای APM با OpenTelemetry Collector + Tempo + Grafana

```yaml
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib
  tempo:
    image: grafana/tempo
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

فایل‌های آماده در پروژه:

- `infrastructure/otel/otel-collector-config.yaml`
- `infrastructure/tempo/tempo.yaml`
- `infrastructure/grafana/provisioning/datasources/datasources.yaml`
- `infrastructure/grafana/provisioning/dashboards/json/ogim-apm-overview.json`

سرویس‌های OGIM با متغیر `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317` اجرا می‌شوند.  
برای مشاهده traceها:

1. استک را بالا بیاورید (`infrastructure/docker/docker-compose.yml`)
2. Grafana را باز کنید: `http://localhost:3001`
3. در Explore، datasource `Tempo` را انتخاب کنید
4. `service.name=api-gateway` یا سایر سرویس‌ها را جستجو کنید

## جریان end-to-end

1. **API Gateway**: با `setup_tracing(... instrument_httpx=True)` درخواست‌های ورودی را trace و هنگام فراخوانی سرویس‌های پایین‌دستی context را از طریق HTTPX منتقل می‌کند.
2. **سرویس‌های داخلی**: `setup_tracing(app, "<service>")` برای هر سرویس اجرا شده است؛ context در header `traceparent` دریافت می‌شود و span جدید ایجاد می‌کند.
3. **سرویس‌های دارای خروجی HTTP یا DB**: instrumentation درخواست‌های خروجی (مثل کتابخانه `requests`) را trace می‌کند.

## نکات عملیاتی

- نام سرویس، نسخه و environment به عنوان attribute در span قرار می‌گیرد (`service.name`, `deployment.environment`).
- برای افزودن metadata بیشتر (مثلاً شناسه فرمان)، از `trace.get_current_span().set_attribute(...)` در کد استفاده کنید.
- در صورت نیاز به propagation سفارشی (مثلاً Kafka)، باید پیام‌ها را با header `traceparent` ارسال کنید.

## تست سریع

1. اجرای Collector + Tempo + Grafana طبق compose.
2. اجرای سرویس‌ها با متغیر endpoint.
3. ارسال درخواست نمونه به API Gateway (`/api/alert/alerts`).
4. در Grafana Tempo trace را بررسی کنید؛ باید حداقل دو span (gateway + سرویس داخلی) دیده شود.

با این تنظیم، تیم می‌تواند latency مسیر کامل هر درخواست را مشاهده و bottleneck‌ها را شناسایی کند.*** End Patch

