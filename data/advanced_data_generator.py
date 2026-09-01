#!/usr/bin/env python3
"""
Advanced Data Generator for OGIM
Generates 6 months of realistic oil & gas field data with 1-second resolution
For 4 wells: 2 Production, 1 Development, 1 Observation
"""

import json
import csv
import random
import math
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List
import gzip
import numpy as np
from dataclasses import dataclass, asdict

# Configuration
OUTPUT_DIR = Path(__file__).parent.parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)

# Time configuration
START_DATE = datetime(2024, 5, 1, 0, 0, 0)  # شروع: 1 می 2024
DURATION_DAYS = 180  # 6 ماه
TIME_STEP_SECONDS = 1  # هر 1 ثانیه
TOTAL_RECORDS = DURATION_DAYS * 24 * 60 * 60  # 15,552,000 رکورد

# Well types
WELL_TYPES = {
    "PROD-001": "production",  # چاه تولیدی 1
    "PROD-002": "production",  # چاه تولیدی 2
    "DEV-001": "development",   # چاه توسعه‌ای
    "OBS-001": "observation"    # چاه مشاهده‌ای
}


@dataclass
class WellData:
    """Data class for well measurements"""
    timestamp: str
    well_name: str
    well_type: str
    
    # Pressure (psi)
    wellhead_pressure: float
    tubing_pressure: float
    casing_pressure: float
    separator_pressure: float
    line_pressure: float
    bottom_hole_pressure: float
    
    # Temperature (°C)
    wellhead_temperature: float
    separator_temperature: float
    line_temperature: float
    motor_temperature: float
    bearing_temperature: float
    
    # Flow rates
    oil_flow_rate: float  # bbl/day
    gas_flow_rate: float  # MMSCFD
    water_flow_rate: float  # bbl/day
    total_liquid_rate: float  # bbl/day
    injection_rate: float  # bbl/day (for injection wells)
    
    # Composition
    oil_cut: float  # %
    water_cut: float  # %
    gor: float  # SCF/STB
    bsw: float  # %
    api_gravity: float  # °API
    
    # Pump parameters
    pump_speed: float  # rpm
    pump_frequency: float  # Hz
    motor_current: float  # A
    motor_voltage: float  # V
    power_consumption: float  # kW
    pump_efficiency: float  # %
    
    # Vibration (mm/s)
    vibration_x: float
    vibration_y: float
    vibration_z: float
    overall_vibration: float
    
    # Valve positions (%)
    choke_valve_position: float
    wing_valve_position: float
    master_valve_position: float
    safety_valve_status: int
    
    # Levels (%)
    separator_oil_level: float
    separator_water_level: float
    tank_level: float
    fluid_level: float  # ft
    
    # Quality
    h2s_content: float  # ppm
    co2_content: float  # %
    salt_content: float  # PTB
    viscosity: float  # cP
    density: float  # kg/m³
    
    # Environmental
    ambient_temperature: float  # °C
    ambient_pressure: float  # bar
    humidity: float  # %
    wind_speed: float  # m/s
    
    # Electrical
    phase_a_voltage: float  # V
    phase_b_voltage: float  # V
    phase_c_voltage: float  # V
    phase_a_current: float  # A
    phase_b_current: float  # A
    phase_c_current: float  # A
    power_factor: float
    frequency: float  # Hz
    
    # Performance
    production_rate: float  # bbl/day
    cumulative_production: float  # bbl
    uptime: float  # %
    efficiency: float  # %
    run_time: float  # hours
    
    # Status
    well_status: str
    pump_status: str
    alarm_status: str
    production_mode: str
    
    # Quality flags
    data_quality: str
    anomaly_flag: bool


class WellSimulator:
    """Simulate realistic well behavior"""
    
    def __init__(self, well_name: str, well_type: str):
        self.well_name = well_name
        self.well_type = well_type
        self.cumulative_production = 0.0
        self.run_time = 0.0
        self.last_maintenance = START_DATE
        self.well_status = "running"
        self.pump_status = "ON"
        
        # Base parameters depend on well type
        if well_type == "production":
            self.base_oil_rate = random.uniform(800, 1500)
            self.base_pressure = random.uniform(2000, 3500)
            self.decline_rate = 0.00001  # daily decline
        elif well_type == "development":
            self.base_oil_rate = random.uniform(500, 1000)
            self.base_pressure = random.uniform(1500, 3000)
            self.decline_rate = 0.00002
        else:  # observation
            self.base_oil_rate = 0
            self.base_pressure = random.uniform(1000, 2500)
            self.decline_rate = 0
    
    def generate_reading(self, timestamp: datetime, elapsed_days: float) -> WellData:
        """Generate one reading"""
        
        # Determine well status (shutdowns, maintenance)
        self._update_status(timestamp)
        
        if self.well_status != "running":
            return self._generate_shutdown_reading(timestamp)
        
        # Time-based factors
        hour_of_day = timestamp.hour
        day_of_week = timestamp.weekday()
        
        # Daily cycle (production varies by hour)
        daily_factor = 1.0 + 0.1 * math.sin(2 * math.pi * hour_of_day / 24)
        
        # Weekly cycle
        weekly_factor = 1.0 if day_of_week < 5 else 0.95
        
        # Production decline over time
        decline_factor = math.exp(-self.decline_rate * elapsed_days)
        
        # Noise
        noise = random.gauss(1.0, 0.02)
        
        # Calculate flow rates
        if self.well_type == "observation":
            oil_rate = 0
            gas_rate = 0
            water_rate = 0
        else:
            oil_rate = self.base_oil_rate * decline_factor * daily_factor * weekly_factor * noise
            oil_rate = max(0, oil_rate)
            
            # Water cut increases over time
            water_cut = min(95, 10 + elapsed_days * 0.1)
            water_rate = oil_rate * (water_cut / (100 - water_cut))
            
            # GOR
            gor = random.uniform(800, 1500)
            gas_rate = oil_rate * gor / 1000000  # Convert to MMSCFD
        
        # Pressures
        pressure_factor = 1.0 - elapsed_days * 0.0001  # pressure decline
        wellhead_pressure = self.base_pressure * pressure_factor * random.gauss(1.0, 0.01)
        
        # Vibration (increases with pump wear)
        wear_factor = 1.0 + elapsed_days * 0.001
        vibration = random.gauss(2.5, 0.5) * wear_factor
        
        # Check for anomalies
        anomaly_flag = self._check_anomaly(wellhead_pressure, vibration, oil_rate)
        
        # Update cumulative
        self.cumulative_production += oil_rate / 86400  # bbl per second
        self.run_time += 1.0 / 3600  # hours
        
        return WellData(
            timestamp=timestamp.isoformat(),
            well_name=self.well_name,
            well_type=self.well_type,
            
            # Pressures
            wellhead_pressure=round(wellhead_pressure, 2),
            tubing_pressure=round(wellhead_pressure * 0.95, 2),
            casing_pressure=round(wellhead_pressure * 0.7, 2),
            separator_pressure=round(random.uniform(100, 300), 2),
            line_pressure=round(random.uniform(500, 1000), 2),
            bottom_hole_pressure=round(wellhead_pressure * random.uniform(3, 5), 2),
            
            # Temperatures
            wellhead_temperature=round(random.uniform(60, 90), 2),
            separator_temperature=round(random.uniform(50, 80), 2),
            line_temperature=round(random.uniform(40, 70), 2),
            motor_temperature=round(random.uniform(60, 95), 2),
            bearing_temperature=round(random.uniform(50, 85), 2),
            
            # Flow rates
            oil_flow_rate=round(oil_rate, 2),
            gas_flow_rate=round(gas_rate, 4),
            water_flow_rate=round(water_rate, 2),
            total_liquid_rate=round(oil_rate + water_rate, 2),
            injection_rate=0.0,
            
            # Composition
            oil_cut=round(100 - water_cut if self.well_type != "observation" else 0, 2),
            water_cut=round(water_cut if self.well_type != "observation" else 0, 2),
            gor=round(random.uniform(800, 1500), 2),
            bsw=round(random.uniform(0.5, 5), 2),
            api_gravity=round(random.uniform(25, 40), 2),
            
            # Pump
            pump_speed=round(random.uniform(1500, 3000), 0),
            pump_frequency=round(random.uniform(45, 60), 2),
            motor_current=round(random.uniform(50, 200), 2),
            motor_voltage=round(random.uniform(380, 420), 2),
            power_consumption=round(random.uniform(50, 300), 2),
            pump_efficiency=round(random.uniform(70, 90), 2),
            
            # Vibration
            vibration_x=round(vibration * random.gauss(1.0, 0.1), 2),
            vibration_y=round(vibration * random.gauss(1.0, 0.1), 2),
            vibration_z=round(vibration * random.gauss(1.0, 0.1), 2),
            overall_vibration=round(vibration, 2),
            
            # Valves
            choke_valve_position=round(random.uniform(30, 70), 2),
            wing_valve_position=round(random.uniform(80, 100), 2),
            master_valve_position=round(random.uniform(90, 100), 2),
            safety_valve_status=1,
            
            # Levels
            separator_oil_level=round(random.uniform(30, 70), 2),
            separator_water_level=round(random.uniform(20, 50), 2),
            tank_level=round(random.uniform(40, 80), 2),
            fluid_level=round(random.uniform(3000, 6000), 2),
            
            # Quality
            h2s_content=round(random.uniform(0, 100), 2),
            co2_content=round(random.uniform(1, 10), 2),
            salt_content=round(random.uniform(10, 100), 2),
            viscosity=round(random.uniform(5, 50), 2),
            density=round(random.uniform(800, 900), 2),
            
            # Environmental
            ambient_temperature=round(20 + 15 * math.sin(2 * math.pi * hour_of_day / 24), 2),
            ambient_pressure=round(random.gauss(1.013, 0.01), 3),
            humidity=round(random.uniform(30, 80), 2),
            wind_speed=round(random.uniform(0, 10), 2),
            
            # Electrical
            phase_a_voltage=round(random.gauss(400, 5), 2),
            phase_b_voltage=round(random.gauss(400, 5), 2),
            phase_c_voltage=round(random.gauss(400, 5), 2),
            phase_a_current=round(random.gauss(100, 10), 2),
            phase_b_current=round(random.gauss(100, 10), 2),
            phase_c_current=round(random.gauss(100, 10), 2),
            power_factor=round(random.uniform(0.85, 0.95), 3),
            frequency=round(random.gauss(50, 0.1), 2),
            
            # Performance
            production_rate=round(oil_rate, 2),
            cumulative_production=round(self.cumulative_production, 2),
            uptime=round(random.uniform(95, 99.9), 2),
            efficiency=round(random.uniform(75, 92), 2),
            run_time=round(self.run_time, 2),
            
            # Status
            well_status=self.well_status,
            pump_status=self.pump_status,
            alarm_status="critical" if anomaly_flag else ("warning" if random.random() < 0.05 else "normal"),
            production_mode="oil" if self.well_type != "observation" else "monitoring",
            
            # Quality
            data_quality="good" if not anomaly_flag else "warning",
            anomaly_flag=anomaly_flag
        )
    
    def _update_status(self, timestamp: datetime):
        """Update well operational status"""
        # Scheduled maintenance every 30 days
        if (timestamp - self.last_maintenance).days >= 30:
            if random.random() < 0.1:  # 10% chance to go to maintenance
                self.well_status = "maintenance"
                self.pump_status = "OFF"
                self.last_maintenance = timestamp
                return
        
        # Random shutdowns (1% chance per day)
        if random.random() < 0.00001:
            self.well_status = "stopped"
            self.pump_status = "FAULT"
            return
        
        # Recovery from shutdown
        if self.well_status != "running" and random.random() < 0.001:
            self.well_status = "running"
            self.pump_status = "ON"
    
    def _generate_shutdown_reading(self, timestamp: datetime) -> WellData:
        """Generate reading during shutdown"""
        return WellData(
            timestamp=timestamp.isoformat(),
            well_name=self.well_name,
            well_type=self.well_type,
            wellhead_pressure=0, tubing_pressure=0, casing_pressure=0,
            separator_pressure=0, line_pressure=0, bottom_hole_pressure=0,
            wellhead_temperature=25, separator_temperature=25, line_temperature=25,
            motor_temperature=30, bearing_temperature=30,
            oil_flow_rate=0, gas_flow_rate=0, water_flow_rate=0, total_liquid_rate=0,
            injection_rate=0, oil_cut=0, water_cut=0, gor=0, bsw=0, api_gravity=0,
            pump_speed=0, pump_frequency=0, motor_current=0, motor_voltage=0,
            power_consumption=0, pump_efficiency=0,
            vibration_x=0, vibration_y=0, vibration_z=0, overall_vibration=0,
            choke_valve_position=0, wing_valve_position=0, master_valve_position=0,
            safety_valve_status=0,
            separator_oil_level=0, separator_water_level=0, tank_level=0, fluid_level=0,
            h2s_content=0, co2_content=0, salt_content=0, viscosity=0, density=0,
            ambient_temperature=25, ambient_pressure=1.013, humidity=50, wind_speed=5,
            phase_a_voltage=0, phase_b_voltage=0, phase_c_voltage=0,
            phase_a_current=0, phase_b_current=0, phase_c_current=0,
            power_factor=0, frequency=0,
            production_rate=0, cumulative_production=self.cumulative_production,
            uptime=0, efficiency=0, run_time=self.run_time,
            well_status=self.well_status, pump_status=self.pump_status,
            alarm_status="warning", production_mode="stopped",
            data_quality="good", anomaly_flag=False
        )
    
    def _check_anomaly(self, pressure: float, vibration: float, oil_rate: float) -> bool:
        """Check for anomalies"""
        if pressure > self.base_pressure * 1.2 or pressure < self.base_pressure * 0.5:
            return True
        if vibration > 10:
            return True
        if oil_rate < self.base_oil_rate * 0.3 and self.well_type != "observation":
            return True
        return False


def generate_data_batch(batch_num: int, batch_size: int, simulators: Dict[str, WellSimulator]):
    """Generate a batch of data"""
    start_index = batch_num * batch_size
    batch_data = []
    
    for i in range(batch_size):
        record_index = start_index + i
        if record_index >= TOTAL_RECORDS:
            break
        
        timestamp = START_DATE + timedelta(seconds=record_index)
        elapsed_days = record_index / 86400
        
        for well_name, simulator in simulators.items():
            reading = simulator.generate_reading(timestamp, elapsed_days)
            batch_data.append(asdict(reading))
    
    return batch_data


def main():
    """Main function"""
    print("=" * 80)
    print("OGIM Advanced Data Generator")
    print("Generating 6 months of data with 1-second resolution")
    print("=" * 80)
    print(f"Start date: {START_DATE}")
    print(f"Duration: {DURATION_DAYS} days")
    print(f"Time step: {TIME_STEP_SECONDS} second")
    print(f"Total records per well: {TOTAL_RECORDS:,}")
    print(f"Total wells: {len(WELL_TYPES)}")
    print(f"Total records: {TOTAL_RECORDS * len(WELL_TYPES):,}")
    print("=" * 80)
    print()
    
    # Initialize simulators
    simulators = {name: WellSimulator(name, wtype) 
                  for name, wtype in WELL_TYPES.items()}
    
    # Generate data in batches (to avoid memory issues)
    BATCH_SIZE = 86400  # 1 day of data
    total_batches = (TOTAL_RECORDS + BATCH_SIZE - 1) // BATCH_SIZE
    
    print(f"Generating data in {total_batches} batches (each = 1 day)...")
    print()
    
    # Open output files
    for well_name in WELL_TYPES.keys():
        output_file = OUTPUT_DIR / f"{well_name}_6months_data.jsonl.gz"
        
        with gzip.open(output_file, 'wt', encoding='utf-8') as f:
            for batch_num in range(total_batches):
                batch_data = generate_data_batch(batch_num, BATCH_SIZE, {well_name: simulators[well_name]})
                
                for record in batch_data:
                    f.write(json.dumps(record) + '\n')
                
                if (batch_num + 1) % 10 == 0:
                    progress = (batch_num + 1) / total_batches * 100
                    print(f"  {well_name}: {progress:.1f}% complete ({batch_num + 1}/{total_batches} batches)")
        
        file_size_mb = output_file.stat().st_size / (1024 * 1024)
        print(f"[OK] {well_name}: {file_size_mb:.2f} MB")
    
    print()
    print("=" * 80)
    print("Data generation completed successfully!")
    print("=" * 80)
    print()
    print("Generated files:")
    for well_name in WELL_TYPES.keys():
        file_path = OUTPUT_DIR / f"{well_name}_6months_data.jsonl.gz"
        if file_path.exists():
            size_mb = file_path.stat().st_size / (1024 * 1024)
            print(f"  - {file_path.name} ({size_mb:.2f} MB)")
    print()
    print("Note: Files are compressed with gzip to save space")
    print("To read: gzip -d <filename>.gz or use Python gzip module")


if __name__ == "__main__":
    main()

