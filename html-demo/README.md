# 🌐 OGIM Live Demo - HTML Edition

دمو زنده و تعاملی سیستم OGIM با HTML/JavaScript خالص

## 🎯 درباره

این یک دموی کاملاً عملیاتی از سیستم OGIM است که:
- ✅ به Backend API متصل می‌شود (Real-time)
- ✅ داده‌های واقعی نمایش می‌دهد
- ✅ بدون نیاز به Build یا Compile اجرا می‌شود
- ✅ در صورت عدم اتصال، از داده‌های Mock استفاده می‌کند
- ✅ Responsive و Mobile-friendly است

## 📁 فایل‌ها

```
html-demo/
├── index.html          # صفحه اصلی داشبورد
├── wells.html          # صفحه چاه‌ها
├── alerts.html         # صفحه هشدارها
├── style.css           # استایل‌های CSS
├── api.js              # کلاینت API و Mock Data
├── app.js              # منطق اصلی برنامه
└── README.md           # این فایل
```

## 🚀 نحوه اجرا

### روش 1: با Python HTTP Server (توصیه شده)

```bash
# ورود به پوشه
cd html-demo

# اجرا با Python 3
python -m http.server 8080

# یا با Python 2
python -m SimpleHTTPServer 8080

# باز کردن مرورگر
# http://localhost:8080
```

### روش 2: با Node.js (http-server)

```bash
# نصب http-server (یک بار)
npm install -g http-server

# اجرا
cd html-demo
http-server -p 8080

# باز کردن مرورگر
# http://localhost:8080
```

### روش 3: با Live Server (VS Code Extension)

1. نصب extension "Live Server" در VS Code
2. راست کلیک روی `index.html`
3. انتخاب "Open with Live Server"

### روش 4: مستقیم در مرورگر (محدود)

فقط فایل `index.html` را در مرورگر باز کنید (ممکن است CORS error بگیرید)

## ⚙️ تنظیمات

### اتصال به Backend

1. کلیک روی آیکون تنظیمات (⚙️) در منو
2. وارد کردن آدرس API Gateway:
   ```
   http://localhost:8000
   ```
3. تنظیم فاصله بروزرسانی (پیش‌فرض: 10 ثانیه)
4. ذخیره تنظیمات

### حالت‌ها

**حالت Online (Connected):**
- دموی به backend متصل است
- داده‌های واقعی نمایش داده می‌شود
- بروزرسانی خودکار فعال است

**حالت Offline (Mock Data):**
- دموی به backend متصل نیست
- داده‌های نمونه (Mock) نمایش داده می‌شود
- قابلیت‌های اصلی همچنان کار می‌کنند

## 🎨 ویژگی‌ها

### 📊 داشبورد (index.html)
- **آمار کلی:**
  - تعداد چاه‌های فعال
  - هشدارهای فعال
  - نرخ تولید
  - سلامت سیستم

- **نمودارها:**
  - نمودار تولید لحظه‌ای (Real-time Production)
  - نمودار فشار و دما (Pressure & Temperature)
  - قابلیت انتخاب بازه زمانی

- **جدول چاه‌ها:**
  - وضعیت هر چاه
  - نرخ تولید
  - فشار و دما
  - آخرین بروزرسانی

- **هشدارهای اخیر:**
  - 5 هشدار اخیر
  - سطح بحرانیت
  - زمان وقوع

### 🛢️ صفحه چاه‌ها (wells.html)
- لیست کامل چاه‌ها
- جزئیات هر چاه
- نمودارهای اختصاصی
- تاریخچه عملکرد

### 🔔 صفحه هشدارها (alerts.html)
- لیست کامل هشدارها
- فیلتر بر اساس سطح و وضعیت
- قابلیت Acknowledge و Resolve
- جستجو در هشدارها

## 🔧 تکنولوژی‌ها

- **HTML5** - ساختار صفحات
- **CSS3** - استایل‌ها و انیمیشن‌ها
- **JavaScript (Vanilla)** - منطق برنامه
- **Chart.js** - نمودارها
- **Font Awesome** - آیکون‌ها
- **Fetch API** - ارتباط با Backend

## 📡 API Endpoints

دمو از این API endpoints استفاده می‌کند:

```javascript
// Health Check
GET /health

// Statistics
GET /api/statistics

// Tags/Wells
GET /api/tag-catalog/tags
GET /api/tag-catalog/tags/{id}

// Sensor Data
GET /api/data-ingestion/sensor-data?limit=20

// Alerts
GET /api/alert/alerts?status=open
POST /api/alert/alerts/{id}/acknowledge
POST /api/alert/alerts/{id}/resolve

// Auth (optional)
POST /api/auth/token
GET /api/auth/users/me
```

## 🔐 احراز هویت (اختیاری)

اگر backend شما نیاز به احراز هویت دارد:

```javascript
// در Console مرورگر
api.login('admin', 'Admin@123')
  .then(() => {
    console.log('Logged in successfully');
    refreshData();
  });
```

Token به صورت خودکار در localStorage ذخیره می‌شود.

## 🐛 عیب‌یابی

### مشکل: CORS Error

**راه‌حل:**
1. Backend شما باید CORS را فعال کند:
```python
CORS_ORIGINS = ["http://localhost:8080"]
```

2. یا از Chrome با flag اجرا کنید:
```bash
chrome.exe --disable-web-security --user-data-dir="C:/temp/chrome"
```

### مشکل: Cannot connect to backend

**راه‌حل:**
1. مطمئن شوید backend در حال اجرا است:
```bash
curl http://localhost:8000/health
```

2. تنظیمات را بررسی کنید (⚙️ Settings)

3. دمو به صورت خودکار به حالت Mock می‌رود

### مشکل: Charts not showing

**راه‌حل:**
1. مطمئن شوید Chart.js بارگذاری شده است
2. Console مرورگر را برای خطاها بررسی کنید
3. صفحه را Refresh کنید

## 📱 سازگاری

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ⚠️ IE11 (نیاز به Polyfill)

## 🎯 نکات

### Auto-Refresh
- پیش‌فرض: هر 10 ثانیه
- قابل تنظیم از 5 تا 60 ثانیه
- در تب Settings تغییر دهید

### Mock Data
- هنگامی که backend در دسترس نیست فعال می‌شود
- داده‌های تصادفی ولی واقع‌گرایانه
- برای Demo و Testing مناسب است

### Performance
- نمودارها با Animation سبک
- Update optimized با Chart.js
- حافظه کم مصرف

## 📊 داده‌های نمونه

دمو شامل 4 چاه است:

| چاه | نوع | تولید (bbl/day) |
|-----|-----|-----------------|
| PROD-001 | Production | 800-1500 |
| PROD-002 | Production | 800-1500 |
| DEV-001 | Development | 500-1000 |
| OBS-001 | Observation | 0 |

## 🚀 استقرار (Deployment)

### GitHub Pages

```bash
# فقط محتوای html-demo را deploy کنید
git subtree push --prefix html-demo origin gh-pages
```

### Netlify/Vercel

1. پوشه `html-demo` را به عنوان root انتخاب کنید
2. Build command: (خالی)
3. Publish directory: `.`

### Docker

```dockerfile
FROM nginx:alpine
COPY html-demo/ /usr/share/nginx/html/
EXPOSE 80
```

```bash
docker build -t ogim-demo .
docker run -p 8080:80 ogim-demo
```

## 🔗 لینک‌های مرتبط

- **پروژه اصلی:** [OGIM Repository](../)
- **مستندات Backend:** [docs/](../docs/)
- **API Docs:** http://localhost:8000/docs

## 📝 لایسنس

MIT License - همانند پروژه اصلی

---

## 🎉 استفاده سریع

```bash
# 1. کلون پروژه
git clone https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring.git

# 2. ورود به پوشه demo
cd OGIM---Oil-Gas-Intelligent-Monitoring/html-demo

# 3. اجرای backend (terminal دیگر)
cd ../
docker-compose -f docker-compose.dev.yml up -d

# 4. اجرای demo
python -m http.server 8080

# 5. باز کردن مرورگر
# http://localhost:8080
```

---

**ساخته شده با ❤️ برای صنعت نفت و گاز**

نسخه: 1.0.0 | تاریخ: نوامبر 2025

