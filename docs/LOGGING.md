# Logging & Centralized Aggregation

این راهنما توضیح می‌دهد که چگونه لاگ‌های سرویس‌ها به فرمت JSON تولید و در Dev/Prod به مقصد مرکزی (ELK / Loki) ارسال شوند.

## فرمت لاگ

کلاس `JSONFormatter` در `backend/shared/logging_config.py` فیلدهای زیر را ثبت می‌کند:

| فیلد | توضیح |
|------|-------|
| `timestamp` | زمان UTC ایجاد لاگ |
| `level` | سطح (INFO، ERROR، …) |
| `service` | نام سرویس (`setup_logging("service-name")`) |
| `environment` | مقدار `settings.ENVIRONMENT` (dev/staging/prod) |
| `message`, `module`, `function`, `line` | اطلاعات استاندارد لاگ |
| `correlation_id`, `request_id`, `user_id` | در صورت ارسال از logger adapter |
| `exception` | متن استک اگر خطا رخ دهد |

در صورت نیاز به زمینه‌ی بیشتر، از `LoggerAdapter` استفاده کنید:

```python
from shared.logging_config import LoggerAdapter, setup_logging

logger = setup_logging("alert-service")
logger = LoggerAdapter(logger, {"correlation_id": req_id})
logger.info("Alert acknowledged", extra={"user_id": user.username})
```

## ارسال به Loki (مثال Dev)

### فایل `infrastructure/logging/promtail-config.yaml`
این فایل نمونه‌ای از Promtail است که لاگ‌ها را از stdout سرویس‌ها جمع می‌کند و به Loki ارسال می‌کند:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: ogim-services
    static_configs:
      - targets:
          - localhost
        labels:
          job: ogim
          __path__: /var/log/containers/*ogim*.log
```

### اجرای Loki + Promtail + Grafana (نمونه docker-compose)

```yaml
services:
  loki:
    image: grafana/loki:2.9.0
    command: -config.file=/etc/loki/local-config.yaml
    ports: ["3100:3100"]

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - ./promtail-config.yaml:/etc/promtail/promtail-config.yaml
      - /var/log:/var/log
    command: -config.file=/etc/promtail/promtail-config.yaml

  grafana:
    image: grafana/grafana:10.2.0
    ports: ["3002:3000"]
```

در Grafana یک datasource از نوع Loki اضافه کرده و کوئری نمونه زیر را برای مشاهده لاگ‌های یک سرویس اجرا کنید:

```logql
{job="ogim", service="auth-service"} | json | level="ERROR"
```

## ارسال به ELK (گزینه دیگر)

اگر از ELK استفاده می‌کنید، می‌توانید Filebeat یا Logstash را جایگزین Promtail کنید. کافی است ورودی را از stdout کانتینرها یا فایل لاگ دریافت و به Elasticsearch ارسال کنید. JSON formatter نیاز به تنظیم اضافی ندارد.

## نکات عملیاتی
- سطح لاگ‌ها توسط `settings.LOG_LEVEL` کنترل می‌شود (پیش‌فرض `INFO`).
- در تولید حتماً `LOG_FORMAT=json` باشد تا لاگ‌ها ساختار یافته ذخیره شوند.
- برای ردیابی درخواست‌ها، آیدی درخواست را از Gateway یا middleware به لاگر پاس کنید (correlation/request id).
- در صورت وجود حادثه، می‌توانید با فیلتر `correlation_id` مسیر درخواست را در تمام سرویس‌ها بیابید.

