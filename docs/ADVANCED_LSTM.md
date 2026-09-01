# مدل‌های LSTM پیشرفته برای پیش‌بینی رفتار چاه

## 📋 خلاصه

این مستندات نحوه استفاده از مدل‌های LSTM پیشرفته برای پیش‌بینی دقیق‌تر رفتار چاه‌های نفتی را توضیح می‌دهد.

## 🏗️ معماری مدل‌ها

### 1. Stacked LSTM (پیش‌فرض)
- **معماری**: 3 لایه LSTM با 128، 64، و 32 واحد
- **ویژگی‌ها**:
  - Batch Normalization برای پایداری آموزش
  - Dropout برای جلوگیری از overfitting
  - Dense layers برای خروجی
- **استفاده**: برای داده‌های تک متغیره و چند متغیره

### 2. Bidirectional LSTM
- **معماری**: LSTM دوطرفه برای استفاده از اطلاعات گذشته و آینده
- **ویژگی‌ها**:
  - تحلیل بهتر الگوهای زمانی
  - مناسب برای داده‌های با روندهای پیچیده
- **استفاده**: برای پیش‌بینی‌های دقیق‌تر

### 3. LSTM with Attention
- **معماری**: LSTM با مکانیزم Attention
- **ویژگی‌ها**:
  - تمرکز بر نقاط مهم در سری زمانی
  - بهبود دقت پیش‌بینی
- **استفاده**: برای داده‌های با الگوهای پیچیده

## 🚀 استفاده

### آموزش مدل

#### روش 1: استفاده از API

```python
import requests

# آموزش مدل برای یک چاه
response = requests.post(
    "http://localhost:8003/api/ml-inference/lstm/train",
    json={
        "well_name": "PROD-001",
        "time_series_data": [100.5, 102.3, 98.7, ...],  # حداقل 200 نقطه
        "model_type": "stacked_lstm",
        "sequence_length": 60,
        "forecast_horizon": 24,
        "epochs": 100,
        "batch_size": 32,
        "validation_split": 0.2
    },
    headers={"Authorization": "Bearer YOUR_TOKEN"}
)
```

#### روش 2: استفاده از اسکریپت

```bash
# آموزش مدل Stacked LSTM
python scripts/train_advanced_lstm.py \
    --well PROD-001 \
    --model-type stacked_lstm \
    --epochs 100 \
    --seq-length 60 \
    --forecast-horizon 24 \
    --test

# آموزش مدل Bidirectional LSTM
python scripts/train_advanced_lstm.py \
    --well PROD-001 \
    --model-type bidirectional \
    --epochs 100

# آموزش مدل با Attention
python scripts/train_advanced_lstm.py \
    --well PROD-001 \
    --model-type attention \
    --epochs 100
```

### پیش‌بینی

```python
import requests

# پیش‌بینی آینده
response = requests.post(
    "http://localhost:8003/api/ml-inference/forecast",
    json={
        "sensor_id": "PROD-001-PRESSURE",
        "historical_data": [100.5, 102.3, 98.7, ...],  # حداقل 60 نقطه
        "forecast_steps": 24  # پیش‌بینی 24 گام آینده
    },
    headers={"Authorization": "Bearer YOUR_TOKEN"}
)

result = response.json()
print(f"Predictions: {result['predictions']}")
print(f"Confidence: {result['confidence']}")
```

## 📊 Frontend

صفحه **LSTM Forecast** در Navigation Bar برای:
- آموزش مدل‌های جدید
- تولید پیش‌بینی‌ها
- مشاهده لیست مدل‌های آموزش دیده
- نمایش نتایج پیش‌بینی با نمودار

## ⚙️ پارامترها

### Sequence Length
- **پیش‌فرض**: 60
- **توضیح**: تعداد نقاط تاریخی که برای پیش‌بینی استفاده می‌شود
- **توصیه**: 30-120 بسته به فرکانس داده

### Forecast Horizon
- **پیش‌فرض**: 24
- **توضیح**: تعداد گام‌های آینده برای پیش‌بینی
- **توصیه**: 1-48 برای داده‌های ساعتی

### Epochs
- **پیش‌فرض**: 100
- **توضیح**: تعداد دوره‌های آموزش
- **توصیه**: 50-200 بسته به حجم داده

## 📈 Metrics

مدل‌ها معیارهای زیر را گزارش می‌دهند:
- **Loss (MSE)**: خطای مربعات میانگین
- **MAE**: خطای مطلق میانگین
- **MAPE**: خطای درصدی مطلق میانگین

## 🔧 تنظیمات پیشرفته

### Callbacks
- **Early Stopping**: توقف زودهنگام در صورت عدم بهبود
- **Reduce LR on Plateau**: کاهش learning rate
- **Model Checkpoint**: ذخیره بهترین مدل

### Normalization
- استفاده از MinMaxScaler برای نرمال‌سازی
- نرمال‌سازی جداگانه برای هر feature
- Inverse transform برای بازگشت به مقیاس اصلی

## 📝 مثال کامل

```python
from advanced_lstm_model import AdvancedLSTMModel
import numpy as np

# ایجاد مدل
model = AdvancedLSTMModel(
    sequence_length=60,
    forecast_horizon=24,
    n_features=1,
    model_type="stacked_lstm"
)

# بارگذاری داده
data = np.load("well_data.npy")  # شکل: (n_samples, 1)

# ایجاد sequences
X, y = [], []
for i in range(len(data) - 60 - 24 + 1):
    X.append(data[i:(i + 60)])
    y.append(data[i + 60:i + 60 + 24])

X = np.array(X)
y = np.array(y)

# آموزش
metrics = model.train(
    X_train=X,
    y_train=y,
    epochs=100,
    batch_size=32,
    validation_split=0.2
)

# پیش‌بینی
historical = data[-60:].flatten()
result = model.predict(historical, forecast_steps=24)

print(f"Predictions: {result['predictions']}")
print(f"Confidence: {result['confidence']}")
```

## 🎯 بهترین روش‌ها

1. **حجم داده**: حداقل 200-500 نقطه برای آموزش مناسب
2. **Validation Split**: 20% برای validation
3. **Sequence Length**: باید با الگوهای زمانی داده هماهنگ باشد
4. **Forecast Horizon**: هرچه بیشتر، دقت کمتر
5. **Model Selection**: 
   - Stacked LSTM برای شروع
   - Bidirectional برای دقت بیشتر
   - Attention برای الگوهای پیچیده

## 🔍 عیب‌یابی

### مشکل: Model not trained
**راه‌حل**: ابتدا مدل را آموزش دهید

### مشکل: Not enough data
**راه‌حل**: حداقل 200 نقطه برای آموزش و 60 نقطه برای پیش‌بینی

### مشکل: Poor predictions
**راه‌حل**: 
- افزایش epochs
- تنظیم sequence_length
- استفاده از مدل‌های پیشرفته‌تر

## 📚 منابع

- TensorFlow Keras LSTM Documentation
- Time Series Forecasting with LSTM
- Attention Mechanisms in Deep Learning

