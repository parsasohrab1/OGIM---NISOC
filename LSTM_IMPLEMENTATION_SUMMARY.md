# ✅ پیاده‌سازی مدل‌های LSTM پیشرفته

## 📊 خلاصه پیاده‌سازی

مدل‌های LSTM پیشرفته برای پیش‌بینی دقیق‌تر رفتار چاه نفتی با موفقیت پیاده‌سازی شدند.

## 🏗️ معماری‌های پیاده‌سازی شده

### 1. Stacked LSTM (پیش‌فرض)
- 3 لایه LSTM (128, 64, 32 units)
- Batch Normalization
- Dropout layers
- Dense layers برای خروجی

### 2. Bidirectional LSTM
- LSTM دوطرفه
- تحلیل بهتر الگوهای زمانی
- مناسب برای روندهای پیچیده

### 3. LSTM with Attention
- مکانیزم Attention
- تمرکز بر نقاط مهم
- دقت بالاتر

## 📁 فایل‌های ایجاد شده

### Backend
- `backend/ml-inference-service/advanced_lstm_model.py` - مدل پیشرفته LSTM
- `backend/ml-inference-service/main.py` - API endpoints به‌روزرسانی شد

### Frontend
- `frontend/web/src/pages/LSTMForecast.tsx` - صفحه مدیریت و پیش‌بینی
- `frontend/web/src/pages/LSTMForecast.css` - استایل‌ها

### Scripts
- `scripts/train_advanced_lstm.py` - اسکریپت آموزش خودکار

### Documentation
- `docs/ADVANCED_LSTM.md` - مستندات کامل

## 🔌 API Endpoints

### آموزش مدل
```
POST /api/ml-inference/lstm/train
{
    "well_name": "PROD-001",
    "time_series_data": [100.5, 102.3, ...],
    "model_type": "stacked_lstm",
    "sequence_length": 60,
    "forecast_horizon": 24,
    "epochs": 100
}
```

### پیش‌بینی
```
POST /api/ml-inference/forecast
{
    "sensor_id": "PROD-001-PRESSURE",
    "historical_data": [100.5, 102.3, ...],
    "forecast_steps": 24
}
```

### لیست مدل‌ها
```
GET /api/ml-inference/lstm/models
```

## 🎯 ویژگی‌های کلیدی

1. **معماری پیشرفته**: 3 نوع معماری مختلف
2. **Callbacks**: Early Stopping, Reduce LR, Model Checkpoint
3. **Normalization**: MinMaxScaler برای هر feature
4. **Confidence Intervals**: بازه اطمینان برای پیش‌بینی‌ها
5. **Well-Specific Models**: مدل جداگانه برای هر چاه
6. **Frontend Integration**: صفحه کامل برای مدیریت

## 🚀 استفاده

### از Frontend
1. به تب "LSTM Forecast" بروید
2. مدل را آموزش دهید یا پیش‌بینی انجام دهید

### از API
```python
import requests

# آموزش
response = requests.post(
    "http://localhost:8003/api/ml-inference/lstm/train",
    json={"well_name": "PROD-001", ...}
)

# پیش‌بینی
response = requests.post(
    "http://localhost:8003/api/ml-inference/forecast",
    json={"sensor_id": "PROD-001-PRESSURE", ...}
)
```

### از Script
```bash
python scripts/train_advanced_lstm.py \
    --well PROD-001 \
    --model-type stacked_lstm \
    --epochs 100 \
    --test
```

## 📈 Metrics

- Train/Validation Loss (MSE)
- Train/Validation MAE
- Train/Validation MAPE
- Epochs Trained

## ✅ وضعیت

- ✅ مدل‌های پیشرفته پیاده‌سازی شدند
- ✅ API endpoints اضافه شدند
- ✅ Frontend page ایجاد شد
- ✅ اسکریپت آموزش اضافه شد
- ✅ مستندات کامل نوشته شد

## 📝 نکات

- حداقل 200 نقطه برای آموزش
- حداقل 60 نقطه برای پیش‌بینی
- مدل‌ها برای هر چاه جداگانه ذخیره می‌شوند
- از Frontend می‌توانید مدل‌ها را مدیریت کنید

