# ML Operations & Retraining Plan

## Available Models

### 1. Anomaly Detection (Isolation Forest)
- Anomaly detection in sensor data
- Uses Isolation Forest
- Output: anomaly score and probability

### 2. Failure Prediction (Random Forest)
- Predicting the probability of equipment failure
- Uses Random Forest Classifier
- Output: failure probability

### 3. Time Series Forecasting (LSTM) ✅
- Time-series forecasting using LSTM recurrent neural networks
- Suitable for predicting future sensor values
- Architecture: two LSTM layers with Dropout
- Configurable parameters:
  - `seq_length`: Input sequence length (default: 60)
  - `forecast_horizon`: Number of forecast steps (default: 1)
  - `epochs`: Number of training epochs (default: 50)
  - `batch_size`: Batch size (default: 32)

**Usage:**
```bash
# Train the model
python scripts/train_models.py --model time_series_forecast

# Or via the API
POST /models/time_series_forecast/train

# Prediction
POST /forecast
{
  "sensor_id": "TAG-001",
  "historical_data": [1.2, 1.5, 1.3, ...],  # at least 60 points
  "forecast_steps": 5  # forecast 5 steps ahead
}
```

## Scheduled Retraining
- Run a periodic job (e.g. CronJob or GitHub Actions) to run `scripts/train_models.py`.
  - Sample GitHub Actions: `.github/workflows/ml-retrain.yml`
  - Required variables: `DATABASE_URL`, `MLFLOW_TRACKING_URI`, `SYSTEM_ADMIN_TOKEN`
- After success, the `/models/reload` endpoint in the ML service is called.

## Monitoring Model Quality
- Accuracy metrics (accuracy, anomaly_rate) are recorded during training with `_log_model_metrics`.
- For Prometheus output, these metrics must be collected as gauges (TODO: put the value in the metrics endpoint).
- If the accuracy drops below 0.8, the `ModelAccuracyLow` rule fires.

## Alerting Rules
- The file `infrastructure/prometheus/rules/model-quality.yml` contains two rules:
  - `ModelAccuracyLow`: accuracy < 0.8 for 10 minutes.
  - `ModelRetrainOverdue`: If more than 30 days have passed since the last retraining.
- Alertmanager can send the message to Slack/Email.

## Data Quality & Pipeline Health
- Data is validated before training; it is recommended to also record the invalid data rate and other indicators in Prometheus.
- If an error or lack of data is observed, training must fail and an alert must be recorded.

## Rollback Strategy
- Previous model versions are available in MLflow; to roll back, just load the previous version and call `/models/reload`.
- This process must be recorded in the Runbook (`HANDOFF.md`).
