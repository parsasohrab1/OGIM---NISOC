#!/usr/bin/env python3
"""
Sample Data Generator - Quick version for testing
Generates 1 week of data with 1-minute resolution
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Import from advanced generator
from advanced_data_generator import *

# Override configuration for quick test
DURATION_DAYS = 7  # 1 week
TIME_STEP_SECONDS = 60  # 1 minute (instead of 1 second)
TOTAL_RECORDS = DURATION_DAYS * 24 * 60  # 10,080 records

def main():
    """Generate sample data (1 week, 1-minute resolution)"""
    print("=" * 80)
    print("OGIM Sample Data Generator (Quick Test)")
    print("Generating 1 week of data with 1-minute resolution")
    print("=" * 80)
    print(f"Start date: {START_DATE}")
    print(f"Duration: {DURATION_DAYS} days")
    print(f"Time step: {TIME_STEP_SECONDS} seconds (1 minute)")
    print(f"Total records per well: {TOTAL_RECORDS:,}")
    print(f"Total wells: {len(WELL_TYPES)}")
    print(f"Total records: {TOTAL_RECORDS * len(WELL_TYPES):,}")
    print("=" * 80)
    print()
    
    # Initialize simulators
    simulators = {name: WellSimulator(name, wtype) 
                  for name, wtype in WELL_TYPES.items()}
    
    # Generate all data at once (small enough for memory)
    all_data = {well_name: [] for well_name in WELL_TYPES.keys()}
    
    print("Generating data...")
    for i in range(TOTAL_RECORDS):
        timestamp = START_DATE + timedelta(seconds=i * TIME_STEP_SECONDS)
        elapsed_days = (i * TIME_STEP_SECONDS) / 86400
        
        for well_name, simulator in simulators.items():
            reading = simulator.generate_reading(timestamp, elapsed_days)
            all_data[well_name].append(asdict(reading))
        
        if (i + 1) % 1440 == 0:  # Every day
            day = (i + 1) // 1440
            print(f"  Day {day}/{DURATION_DAYS} complete...")
    
    print()
    
    # Save data
    print("Saving data files...")
    for well_name, data in all_data.items():
        # JSON
        json_file = OUTPUT_DIR / f"{well_name}_sample_1week.json"
        with open(json_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        # CSV
        csv_file = OUTPUT_DIR / f"{well_name}_sample_1week.csv"
        if data:
            with open(csv_file, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
        
        json_size = json_file.stat().st_size / (1024 * 1024)
        csv_size = csv_file.stat().st_size / (1024 * 1024)
        print(f"  [OK] {well_name}: JSON={json_size:.2f}MB, CSV={csv_size:.2f}MB")
    
    print()
    print("=" * 80)
    print("Sample data generation completed successfully!")
    print("=" * 80)
    print()
    print("Files saved in: data/")
    print("  - *_sample_1week.json (JSON format)")
    print("  - *_sample_1week.csv (CSV format)")
    print()
    print("To generate full 6-month dataset, run:")
    print("  python scripts/advanced_data_generator.py")
    print()


if __name__ == "__main__":
    main()

