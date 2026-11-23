"""
Example of using the LSTM model for time-series forecasting

This file shows how the LSTM model can be used to predict future values.
"""

import numpy as np
import sys
import os

# Add shared module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
sys.path.insert(0, os.path.dirname(__file__))

from mlflow_integration import get_mlflow_manager


def generate_sample_time_series_data(length: int = 2000) -> np.ndarray:
    """
    Generate sample data for training the model

    Args:
        length: length of the time series

    Returns:
        numpy array with shape (length, 1)
    """
    np.random.seed(42)
    t = np.arange(0, length, 0.1)
    # Combine several sine waves with noise
    data = (
        np.sin(0.1 * t)
        + 0.5 * np.sin(0.3 * t)
        + 0.3 * np.sin(0.5 * t)
        + np.random.normal(0, 0.1, len(t))
    )
    return data.reshape(-1, 1)


def example_train_and_predict():
    """Complete example: train the model and forecast"""

    print("=" * 60)
    print("Example of using the LSTM model for time-series forecasting")
    print("=" * 60)

    # 1. Create the MLflow Manager
    print("\n1. Creating the MLflow Manager...")
    manager = get_mlflow_manager(model_path="./models", tracking_uri="file:./mlruns")

    # 2. Generate sample data
    print("\n2. Generating sample data for training...")
    training_data = generate_sample_time_series_data(length=2000)
    print(f"   Number of data points: {len(training_data)}")

    # 3. Train the model
    print("\n3. Training the LSTM model...")
    print("   This step may take a few minutes...")
    manager.train_time_series_model(
        time_series_data=training_data,
        seq_length=60,  # use the previous 60 points
        forecast_horizon=1,  # forecast 1 step ahead
        epochs=30,  # 30 training epochs (for a quick example)
        batch_size=32,
        validation_split=0.2,
    )
    print("   ✓ Model trained successfully!")

    # 4. Generate historical data for forecasting
    print("\n4. Preparing historical data for forecasting...")
    # Use the last 100 points of the training data
    historical_data = training_data[-100:].flatten().tolist()
    print(f"   Number of historical points: {len(historical_data)}")

    # 5. Run the forecast
    print("\n5. Running the forecast...")
    result = manager.predict_time_series(
        historical_data=historical_data, forecast_steps=10  # forecast 10 steps ahead
    )

    print("\n" + "=" * 60)
    print("Forecast results:")
    print("=" * 60)
    print(f"Number of forecast steps: {result['forecast_steps']}")
    print(f"Input sequence length: {result['sequence_length']}")
    print(f"Confidence level: {result['confidence']:.2%}")
    print("\nForecast values:")
    for i, pred in enumerate(result["predictions"], 1):
        print(f"  Step {i}: {pred:.4f}")

    print("\n" + "=" * 60)
    print("✓ Example ran successfully!")
    print("=" * 60)


def example_load_and_predict():
    """Example: load the model from MLflow and forecast"""

    print("\n" + "=" * 60)
    print("Example: loading the model from MLflow")
    print("=" * 60)

    # 1. Create the Manager
    manager = get_mlflow_manager(model_path="./models", tracking_uri="file:./mlruns")

    # 2. Load the model
    print("\nLoading the model from MLflow...")
    model = manager.load_model("time-series-forecast")

    if model is None:
        print("❌ Model not found. Please train the model first.")
        return

    print("✓ Model loaded successfully!")

    # 3. Generate sample data for forecasting
    print("\nGenerating sample historical data...")
    # Generate a simple time series
    historical_data = [np.sin(i * 0.1) + np.random.normal(0, 0.1) for i in range(100)]

    # 4. Forecast
    print("Running the forecast...")
    result = manager.predict_time_series(
        historical_data=historical_data, forecast_steps=5
    )

    print(f"\nForecast values: {result['predictions']}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Example of using the LSTM model")
    parser.add_argument(
        "--mode",
        choices=["train", "predict", "both"],
        default="both",
        help="Run mode: train (training), predict (forecasting), both (both)",
    )

    args = parser.parse_args()

    if args.mode in ["train", "both"]:
        example_train_and_predict()

    if args.mode in ["predict", "both"]:
        example_load_and_predict()
