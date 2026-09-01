"""
Script to train advanced LSTM models for oil well time series prediction
اسکریپت آموزش مدل‌های LSTM پیشرفته برای پیش‌بینی سری زمانی چاه نفتی
"""
import sys
import os
import argparse
from datetime import datetime, timedelta

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend', 'ml-inference-service'))

from advanced_lstm_model import AdvancedLSTMModel, get_well_model
import numpy as np
import pandas as pd


def load_well_data(well_name: str, data_path: str = None) -> np.ndarray:
    """
    Load historical data for a well
    بارگذاری داده‌های تاریخی برای یک چاه
    """
    if data_path is None:
        data_path = os.path.join(os.path.dirname(__file__), '..', 'data')
    
    # Try to load from CSV
    csv_file = os.path.join(data_path, f"{well_name}_sample_1week.csv")
    if os.path.exists(csv_file):
        df = pd.read_csv(csv_file)
        # Use pressure or first numeric column
        if 'pressure' in df.columns:
            return df['pressure'].values.reshape(-1, 1)
        elif 'value' in df.columns:
            return df['value'].values.reshape(-1, 1)
        else:
            # Use first numeric column
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                return df[numeric_cols[0]].values.reshape(-1, 1)
    
    # Generate synthetic data if file not found
    print(f"⚠️  Data file not found for {well_name}. Generating synthetic data...")
    np.random.seed(42)
    t = np.arange(0, 2000, 0.1)
    # Simulate oil well pressure with trends and seasonality
    data = (
        350 +  # Base pressure
        50 * np.sin(0.01 * t) +  # Daily cycle
        20 * np.sin(0.001 * t) +  # Weekly trend
        10 * np.random.normal(0, 1, len(t))  # Noise
    )
    return data.reshape(-1, 1)


def train_well_model(
    well_name: str,
    model_type: str = "stacked_lstm",
    epochs: int = 100,
    sequence_length: int = 60,
    forecast_horizon: int = 24
):
    """
    Train LSTM model for a specific well
    آموزش مدل LSTM برای یک چاه خاص
    """
    print("=" * 70)
    print(f"Training {model_type} LSTM model for well: {well_name}")
    print("=" * 70)
    
    # Load data
    print(f"\n1. Loading data for {well_name}...")
    data = load_well_data(well_name)
    print(f"   ✓ Loaded {len(data)} data points")
    
    # Get model
    model = get_well_model(well_name, model_type=model_type)
    model.sequence_length = sequence_length
    model.forecast_horizon = forecast_horizon
    
    # Create sequences
    print(f"\n2. Creating sequences (seq_length={sequence_length}, horizon={forecast_horizon})...")
    X, y = [], []
    for i in range(len(data) - sequence_length - forecast_horizon + 1):
        X.append(data[i:(i + sequence_length)])
        y.append(data[i + sequence_length:i + sequence_length + forecast_horizon])
    
    X = np.array(X)
    y = np.array(y)
    print(f"   ✓ Created {len(X)} sequences")
    
    # Train model
    print(f"\n3. Training model ({epochs} epochs)...")
    print("   This may take several minutes...")
    
    metrics = model.train(
        X_train=X,
        y_train=y,
        epochs=epochs,
        batch_size=32,
        validation_split=0.2,
        verbose=1
    )
    
    print("\n" + "=" * 70)
    print("Training Results:")
    print("=" * 70)
    print(f"Train Loss: {metrics['train_loss']:.6f}")
    print(f"Train MAE: {metrics['train_mae']:.6f}")
    print(f"Train MAPE: {metrics['train_mape']:.2f}%")
    if metrics.get('val_loss'):
        print(f"Val Loss: {metrics['val_loss']:.6f}")
        print(f"Val MAE: {metrics['val_mae']:.6f}")
        print(f"Val MAPE: {metrics['val_mape']:.2f}%")
    print(f"Epochs Trained: {metrics['epochs_trained']}")
    print("=" * 70)
    print(f"✓ Model trained successfully for {well_name}!")
    print("=" * 70)
    
    return model, metrics


def test_prediction(model: AdvancedLSTMModel, well_name: str, n_points: int = 100):
    """
    Test model prediction
    تست پیش‌بینی مدل
    """
    print(f"\n4. Testing prediction for {well_name}...")
    
    # Generate test data
    data = load_well_data(well_name)
    test_data = data[-n_points:].flatten()
    
    # Predict
    result = model.predict(test_data, forecast_steps=24)
    
    print(f"   ✓ Prediction completed")
    print(f"   Forecast Steps: {result['forecast_steps']}")
    print(f"   Confidence: {result['confidence']:.1%}")
    print(f"\n   First 5 predictions:")
    for i, pred in enumerate(result['predictions'][:5], 1):
        print(f"     Step {i}: {pred:.2f}")
    
    return result


def main():
    parser = argparse.ArgumentParser(
        description="Train advanced LSTM models for oil well time series prediction"
    )
    parser.add_argument(
        "--well",
        type=str,
        required=True,
        help="Well name (e.g., PROD-001)"
    )
    parser.add_argument(
        "--model-type",
        type=str,
        choices=["stacked_lstm", "bidirectional", "attention"],
        default="stacked_lstm",
        help="LSTM model architecture"
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=100,
        help="Number of training epochs"
    )
    parser.add_argument(
        "--seq-length",
        type=int,
        default=60,
        help="Sequence length for LSTM"
    )
    parser.add_argument(
        "--forecast-horizon",
        type=int,
        default=24,
        help="Forecast horizon (number of steps to predict)"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Test prediction after training"
    )
    
    args = parser.parse_args()
    
    try:
        # Train model
        model, metrics = train_well_model(
            well_name=args.well,
            model_type=args.model_type,
            epochs=args.epochs,
            sequence_length=args.seq_length,
            forecast_horizon=args.forecast_horizon
        )
        
        # Test if requested
        if args.test:
            test_prediction(model, args.well)
        
        print("\n✅ Training completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())

