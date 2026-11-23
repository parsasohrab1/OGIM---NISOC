# Advanced LSTM models for predicting well behavior

## 📋 Summary

This documentation explains how to use advanced LSTM models for more accurate prediction of oil well behavior.

## 🏗️ Model architectures

### 1. Stacked LSTM (default)
- **Architecture**: 3 LSTM layers with 128, 64, and 32 units
- **Features**:
  - Batch Normalization for training stability
  - Dropout to prevent overfitting
  - Dense layers for the output
- **Use**: For univariate and multivariate data

### 2. Bidirectional LSTM
- **Architecture**: Bidirectional LSTM to use past and future information
- **Features**:
  - Better analysis of temporal patterns
  - Suitable for data with complex trends
- **Use**: For more accurate predictions

### 3. LSTM with Attention
- **Architecture**: LSTM with an Attention mechanism
- **Features**:
  - Focus on important points in the time series
  - Improved prediction accuracy
- **Use**: For data with complex patterns

## 🚀 Usage

### Training the model

#### Method 1: Using the API

```python
import requests

# Train the model for a well
response = requests.post(
    "http://localhost:8003/api/ml-inference/lstm/train",
    json={
        "well_name": "PROD-001",
        "time_series_data": [100.5, 102.3, 98.7, ...],  # at least 200 points
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

#### Method 2: Using a script

```bash
# Train a Stacked LSTM model
python scripts/train_advanced_lstm.py \
    --well PROD-001 \
    --model-type stacked_lstm \
    --epochs 100 \
    --seq-length 60 \
    --forecast-horizon 24 \
    --test

# Train a Bidirectional LSTM model
python scripts/train_advanced_lstm.py \
    --well PROD-001 \
    --model-type bidirectional \
    --epochs 100

# Train a model with Attention
python scripts/train_advanced_lstm.py \
    --well PROD-001 \
    --model-type attention \
    --epochs 100
```

### Prediction

```python
import requests

# Predict the future
response = requests.post(
    "http://localhost:8003/api/ml-inference/forecast",
    json={
        "sensor_id": "PROD-001-PRESSURE",
        "historical_data": [100.5, 102.3, 98.7, ...],  # at least 60 points
        "forecast_steps": 24  # forecast 24 steps ahead
    },
    headers={"Authorization": "Bearer YOUR_TOKEN"}
)

result = response.json()
print(f"Predictions: {result['predictions']}")
print(f"Confidence: {result['confidence']}")
```

## 📊 Frontend

The **LSTM Forecast** page in the Navigation Bar is for:
- Training new models
- Generating forecasts
- Viewing the list of trained models
- Displaying forecast results with a chart

## ⚙️ Parameters

### Sequence Length
- **Default**: 60
- **Description**: Number of historical points used for prediction
- **Recommendation**: 30-120 depending on the data frequency

### Forecast Horizon
- **Default**: 24
- **Description**: Number of future steps to predict
- **Recommendation**: 1-48 for hourly data

### Epochs
- **Default**: 100
- **Description**: Number of training epochs
- **Recommendation**: 50-200 depending on the data volume

## 📈 Metrics

The models report the following metrics:
- **Loss (MSE)**: Mean squared error
- **MAE**: Mean absolute error
- **MAPE**: Mean absolute percentage error

## 🔧 Advanced settings

### Callbacks
- **Early Stopping**: Stops early if there is no improvement
- **Reduce LR on Plateau**: Reduces the learning rate
- **Model Checkpoint**: Saves the best model

### Normalization
- Uses MinMaxScaler for normalization
- Separate normalization for each feature
- Inverse transform to return to the original scale

## 📝 Complete example

```python
from advanced_lstm_model import AdvancedLSTMModel
import numpy as np

# Create the model
model = AdvancedLSTMModel(
    sequence_length=60,
    forecast_horizon=24,
    n_features=1,
    model_type="stacked_lstm"
)

# Load data
data = np.load("well_data.npy")  # shape: (n_samples, 1)

# Create sequences
X, y = [], []
for i in range(len(data) - 60 - 24 + 1):
    X.append(data[i:(i + 60)])
    y.append(data[i + 60:i + 60 + 24])

X = np.array(X)
y = np.array(y)

# Training
metrics = model.train(
    X_train=X,
    y_train=y,
    epochs=100,
    batch_size=32,
    validation_split=0.2
)

# Prediction
historical = data[-60:].flatten()
result = model.predict(historical, forecast_steps=24)

print(f"Predictions: {result['predictions']}")
print(f"Confidence: {result['confidence']}")
```

## 🎯 Best practices

1. **Data volume**: At least 200-500 points for proper training
2. **Validation Split**: 20% for validation
3. **Sequence Length**: Must match the temporal patterns of the data
4. **Forecast Horizon**: The longer it is, the lower the accuracy
5. **Model Selection**: 
   - Stacked LSTM to start
   - Bidirectional for higher accuracy
   - Attention for complex patterns

## 🔍 Troubleshooting

### Problem: Model not trained
**Solution**: Train the model first

### Problem: Not enough data
**Solution**: At least 200 points for training and 60 points for prediction

### Problem: Poor predictions
**Solution**:
- Increase epochs
- Adjust sequence_length
- Use more advanced models

## 📚 Resources

- TensorFlow Keras LSTM Documentation
- Time Series Forecasting with LSTM
- Attention Mechanisms in Deep Learning

