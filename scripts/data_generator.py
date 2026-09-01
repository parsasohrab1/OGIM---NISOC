#!/usr/bin/env python3
"""
Data Generator for Oil & Gas Intelligent Monitoring System
Generates sample sensor data and saves it to the data folder
"""

import json
import random
import datetime
from pathlib import Path
from typing import List, Dict, Any
import csv

# Configuration
OUTPUT_DIR = Path(__file__).parent.parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)

# Sensor types and their valid ranges
SENSOR_CONFIGS = {
    "pressure": {"min": 0.0, "max": 500.0, "unit": "psi"},
    "temperature": {"min": -40.0, "max": 150.0, "unit": "C"},
    "flow_rate": {"min": 0.0, "max": 1000.0, "unit": "bbl/day"},
    "vibration": {"min": 0.0, "max": 10.0, "unit": "mm/s"},
    "oil_level": {"min": 0.0, "max": 100.0, "unit": "%"},
    "gas_composition": {"min": 0.0, "max": 100.0, "unit": "%"},
    "pump_rpm": {"min": 0.0, "max": 3500.0, "unit": "rpm"},
    "valve_position": {"min": 0.0, "max": 100.0, "unit": "%"},
}

# Well/Equipment names
WELL_NAMES = [
    "Well-A-001", "Well-A-002", "Well-A-003",
    "Well-B-001", "Well-B-002", "Well-B-003",
    "Well-C-001", "Well-C-002",
]

EQUIPMENT_TYPES = [
    "pump", "valve", "separator", "compressor", 
    "turbine", "heater", "cooler", "tank"
]


def generate_sensor_data(
    well_name: str,
    equipment_type: str,
    sensor_type: str,
    timestamp: datetime.datetime,
    base_value: float = None,
    add_anomaly: bool = False
) -> Dict[str, Any]:
    """Generate a single sensor reading"""
    config = SENSOR_CONFIGS[sensor_type]
    
    if base_value is None:
        # Generate base value within valid range
        base_value = random.uniform(
            config["min"] + (config["max"] - config["min"]) * 0.2,
            config["max"] - (config["max"] - config["min"]) * 0.2
        )
    
    # Add some noise
    noise = random.gauss(0, (config["max"] - config["min"]) * 0.02)
    
    # Add anomaly if requested (simulate spike or drop)
    anomaly_factor = 1.0
    if add_anomaly:
        anomaly_type = random.choice(["spike", "drop"])
        if anomaly_type == "spike":
            anomaly_factor = random.uniform(1.3, 1.8)
        else:
            anomaly_factor = random.uniform(0.3, 0.7)
    
    value = base_value * anomaly_factor + noise
    value = max(config["min"], min(config["max"], value))
    
    return {
        "timestamp": timestamp.isoformat(),
        "well_name": well_name,
        "equipment_type": equipment_type,
        "sensor_type": sensor_type,
        "value": round(value, 2),
        "unit": config["unit"],
        "data_quality": "good" if not add_anomaly else "anomaly",
        "sensor_id": f"{well_name}-{equipment_type}-{sensor_type}",
    }


def generate_time_series_data(
    num_records: int = 1000,
    start_time: datetime.datetime = None,
    interval_seconds: int = 60,
    anomaly_rate: float = 0.05
) -> List[Dict[str, Any]]:
    """Generate time series data for multiple sensors"""
    if start_time is None:
        start_time = datetime.datetime.now() - datetime.timedelta(days=1)
    
    records = []
    current_time = start_time
    
    # Track base values per sensor to maintain some continuity
    sensor_base_values = {}
    
    for i in range(num_records):
        well = random.choice(WELL_NAMES)
        equipment = random.choice(EQUIPMENT_TYPES)
        sensor_type = random.choice(list(SENSOR_CONFIGS.keys()))
        
        sensor_key = f"{well}-{equipment}-{sensor_type}"
        
        # Get or set base value for continuity
        if sensor_key not in sensor_base_values:
            config = SENSOR_CONFIGS[sensor_type]
            sensor_base_values[sensor_key] = random.uniform(
                config["min"] + (config["max"] - config["min"]) * 0.2,
                config["max"] - (config["max"] - config["min"]) * 0.2
            )
        else:
            # Slight drift in base value (simulate gradual changes)
            sensor_base_values[sensor_key] += random.gauss(0, (SENSOR_CONFIGS[sensor_type]["max"] - SENSOR_CONFIGS[sensor_type]["min"]) * 0.001)
        
        add_anomaly = random.random() < anomaly_rate
        
        record = generate_sensor_data(
            well_name=well,
            equipment_type=equipment,
            sensor_type=sensor_type,
            timestamp=current_time,
            base_value=sensor_base_values[sensor_key],
            add_anomaly=add_anomaly
        )
        
        records.append(record)
        current_time += datetime.timedelta(seconds=interval_seconds)
    
    return records


def save_json_data(data: List[Dict[str, Any]], filename: str):
    """Save data as JSON"""
    output_path = OUTPUT_DIR / filename
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[OK] Saved {len(data)} records to {output_path}")


def save_csv_data(data: List[Dict[str, Any]], filename: str):
    """Save data as CSV"""
    output_path = OUTPUT_DIR / filename
    if not data:
        return
    
    fieldnames = data[0].keys()
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    print(f"[OK] Saved {len(data)} records to {output_path}")


def generate_kafka_sample_messages(num_messages: int = 100):
    """Generate sample Kafka messages in the expected format"""
    records = generate_time_series_data(
        num_records=num_messages,
        anomaly_rate=0.05
    )
    
    # Format as Kafka messages
    kafka_messages = []
    for record in records:
        kafka_message = {
            "key": record["sensor_id"],
            "value": record,
            "partition": hash(record["well_name"]) % 3,  # Simple partitioning
            "offset": len(kafka_messages),
            "timestamp": record["timestamp"]
        }
        kafka_messages.append(kafka_message)
    
    save_json_data(kafka_messages, "kafka_sample_messages.json")


def generate_tag_catalog():
    """Generate tag catalog metadata"""
    tag_catalog = []
    
    for well in WELL_NAMES:
        for equipment in EQUIPMENT_TYPES:
            for sensor_type in SENSOR_CONFIGS.keys():
                config = SENSOR_CONFIGS[sensor_type]
                tag = {
                    "tag_id": f"{well}-{equipment}-{sensor_type}",
                    "well_name": well,
                    "equipment_type": equipment,
                    "sensor_type": sensor_type,
                    "unit": config["unit"],
                    "valid_range_min": config["min"],
                    "valid_range_max": config["max"],
                    "critical_threshold_min": config["min"] * 1.1,
                    "critical_threshold_max": config["max"] * 0.9,
                    "warning_threshold_min": config["min"] * 1.05,
                    "warning_threshold_max": config["max"] * 0.95,
                    "description": f"{sensor_type} sensor for {equipment} in {well}",
                    "location": f"{well} - {equipment}",
                    "status": random.choice(["active", "active", "active", "maintenance"]),
                    "last_calibration": (datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 180))).isoformat(),
                }
                tag_catalog.append(tag)
    
    save_json_data(tag_catalog, "tag_catalog.json")
    save_csv_data(tag_catalog, "tag_catalog.csv")


def main():
    """Main function to generate all sample data"""
    print("=" * 60)
    print("Oil & Gas Intelligent Monitoring - Data Generator")
    print("=" * 60)
    print(f"Output directory: {OUTPUT_DIR}")
    print()
    
    # Generate time series sensor data
    print("Generating time series sensor data...")
    sensor_data = generate_time_series_data(
        num_records=5000,
        interval_seconds=60,
        anomaly_rate=0.05
    )
    save_json_data(sensor_data, "sensor_data.json")
    save_csv_data(sensor_data, "sensor_data.csv")
    print()
    
    # Generate Kafka sample messages
    print("Generating Kafka sample messages...")
    generate_kafka_sample_messages(num_messages=500)
    print()
    
    # Generate tag catalog
    print("Generating tag catalog...")
    generate_tag_catalog()
    print()
    
    # Generate sample alerts
    print("Generating sample alerts...")
    alerts = []
    for i in range(50):
        alert_time = datetime.datetime.now() - datetime.timedelta(hours=random.randint(0, 72))
        alert = {
            "alert_id": f"ALERT-{i+1:04d}",
            "timestamp": alert_time.isoformat(),
            "severity": random.choice(["critical", "warning", "info"]),
            "status": random.choice(["open", "acknowledged", "resolved"]),
            "well_name": random.choice(WELL_NAMES),
            "sensor_id": f"{random.choice(WELL_NAMES)}-{random.choice(EQUIPMENT_TYPES)}-{random.choice(list(SENSOR_CONFIGS.keys()))}",
            "message": f"Sensor reading exceeded threshold",
            "rule_name": random.choice(["threshold_high", "threshold_low", "rate_of_change", "anomaly_detected"]),
            "acknowledged_by": random.choice([None, "operator1", "operator2"]),
            "acknowledged_at": (alert_time + datetime.timedelta(minutes=random.randint(5, 60))).isoformat() if random.random() > 0.5 else None,
        }
        alerts.append(alert)
    save_json_data(alerts, "sample_alerts.json")
    save_csv_data(alerts, "sample_alerts.csv")
    print()
    
    # Generate sample control commands
    print("Generating sample control commands...")
    commands = []
    for i in range(30):
        command_time = datetime.datetime.now() - datetime.timedelta(hours=random.randint(0, 24))
        command = {
            "command_id": f"CMD-{i+1:04d}",
            "timestamp": command_time.isoformat(),
            "well_name": random.choice(WELL_NAMES),
            "equipment_id": f"{random.choice(WELL_NAMES)}-{random.choice(EQUIPMENT_TYPES)}",
            "command_type": random.choice(["setpoint", "open_valve", "close_valve", "start_pump", "stop_pump"]),
            "parameters": {"value": random.uniform(0, 100)},
            "status": random.choice(["pending", "approved", "executed", "rejected"]),
            "requested_by": f"operator{random.randint(1, 5)}",
            "approved_by": f"supervisor{random.randint(1, 2)}" if random.random() > 0.3 else None,
            "executed_at": (command_time + datetime.timedelta(minutes=random.randint(1, 10))).isoformat() if random.random() > 0.5 else None,
            "requires_two_factor": random.choice([True, False]),
        }
        commands.append(command)
    save_json_data(commands, "sample_control_commands.json")
    save_csv_data(commands, "sample_control_commands.csv")
    print()
    
    print("=" * 60)
    print("Data generation completed successfully!")
    print("=" * 60)
    print(f"\nGenerated files in: {OUTPUT_DIR}")
    print("\nFiles created:")
    for file in sorted(OUTPUT_DIR.glob("*.*")):
        size_kb = file.stat().st_size / 1024
        print(f"  - {file.name} ({size_kb:.2f} KB)")


if __name__ == "__main__":
    main()

