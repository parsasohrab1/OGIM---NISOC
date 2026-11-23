# 📊 OGIM Data Directory

This folder is used to store the data produced by the data generators.

## 📁 Contents

This folder contains:
- 📊 Generated data for 4 wells
- 🐍 Data generation scripts (Python)
- 📋 Variables list CSV file

### 🐍 Scripts in this folder
- ✅ `advanced_data_generator.py` - 6-month data generation (1-second time lapse)
- ✅ `generate_sample_data.py` - 1-week sample data generation (1-minute time lapse)
- ✅ `variables_list.csv` - Complete list of 65+ variables in CSV format

### 📊 Well data

### Sample data (1 week) ✅ Available
- `PROD-001_sample_1week.json` - JSON data of production well 1 (~20 MB)
- `PROD-001_sample_1week.csv` - CSV data of production well 1 (~4 MB)
- `PROD-002_sample_1week.json` - JSON data of production well 2 (~20 MB)
- `PROD-002_sample_1week.csv` - CSV data of production well 2 (~4 MB)
- `DEV-001_sample_1week.json` - JSON data of the development well (~20 MB)
- `DEV-001_sample_1week.csv` - CSV data of the development well (~4 MB)
- `OBS-001_sample_1week.json` - JSON data of the observation well (~20 MB)
- `OBS-001_sample_1week.csv` - CSV data of the observation well (~4 MB)

**Total sample size:** ~81 MB (JSON) + ~17 MB (CSV) = ~98 MB

### Full data (6 months) - for production
To generate 6 months of data with a 1-second time lapse:
```bash
python scripts/advanced_data_generator.py
```

Output files (compressed):
- `PROD-001_6months_data.jsonl.gz`
- `PROD-002_6months_data.jsonl.gz`
- `DEV-001_6months_data.jsonl.gz`
- `OBS-001_6months_data.jsonl.gz`

**Estimated size:** ~12-15 GB (compressed)

## 🚀 Data generation

### Method 1: Run from the data folder (direct)
```bash
# Sample data (fast)
cd OGIM---Oil-Gas-Intelligent-Monitoring/data
python generate_sample_data.py

# Full data (6 months)
python advanced_data_generator.py
```

### Method 2: Run from the scripts folder (main)
```bash
# Sample data (fast - ✅ already run)
cd OGIM---Oil-Gas-Intelligent-Monitoring
python scripts/generate_sample_data.py
```
- Duration: 1 week
- Time lapse: 1 minute
- Records: 10,080 × 4 wells = 40,320 records
- Time: ~3-5 minutes

```bash
# Full data (per SRS)
python scripts/advanced_data_generator.py
```
- Duration: 6 months (180 days)
- Time lapse: 1 second
- Records: 15,552,000 × 4 wells = 62,208,000 records
- Time: ~4-8 hours
- Size: ~12-15 GB

## 📖 Documentation

For complete information, see:
- [DATA_GENERATION_GUIDE.md](../DATA_GENERATION_GUIDE.md) - Complete data generation guide
- [VARIABLES_LIST.md](../VARIABLES_LIST.md) - List of 65+ variables

## 📊 Available data statistics

### Well PROD-001 (production)
- Base production rate: 800-1500 bbl/day
- Base pressure: 2000-3500 psi
- Water cut: 10-95% (gradual increase)

### Well PROD-002 (production)
- Base production rate: 800-1500 bbl/day
- Base pressure: 2000-3500 psi
- Water cut: 10-95% (gradual increase)

### Well DEV-001 (development)
- Base production rate: 500-1000 bbl/day
- Base pressure: 1500-3000 psi
- Under test and development

### Well OBS-001 (observation)
- No production (monitoring only)
- Base pressure: 1000-2500 psi
- Pressure and level monitoring only

## ⚠️ Note

- ⚠️ Large data files are Git-ignored (*.json, *.csv, *.gz)
- ✅ Only README.md is committed to Git
- 🗜️ The 6-month files are compressed with gzip
- 💾 Total size (full): ~12-15 GB

## 📋 Using the Variables CSV file

The `variables_list.csv` file contains all 65+ variables with complete details.

### Reading with Python
```python
import pandas as pd

# Load variables list
df_vars = pd.read_csv('variables_list.csv')
print(df_vars.head())

# Filter by category
pressure_vars = df_vars[df_vars['Category'] == 'Pressure']
print(pressure_vars)

# Get variable details
temp_vars = df_vars[df_vars['Category'] == 'Temperature']
for _, var in temp_vars.iterrows():
    print(f"{var['Variable_Name']}: {var['Min_Range']}-{var['Max_Range']} {var['Unit']}")
```

### Opening with Excel
Open the file directly with Microsoft Excel, Google Sheets or LibreOffice.

### CSV file structure
- `Category`: Variable category (Pressure, Temperature, etc.)
- `Variable_Name`: English variable name
- `Unit`: Unit of measurement
- `Min_Range`: Minimum range
- `Max_Range`: Maximum range
- `Description`: English description
- `Arabic_Name`: Localized (Persian/Arabic) variable name, given here in English

---

## 🔍 How to read the data

### Python
```python
import json

# Read JSON
with open('PROD-001_sample_1week.json', 'r') as f:
    data = json.load(f)
    print(f"Total records: {len(data)}")
    print(f"First record: {data[0]}")
```

### Pandas
```python
import pandas as pd

# Read CSV
df = pd.read_csv('PROD-001_sample_1week.csv')
print(df.head())
print(df.describe())

# Time series analysis
df['timestamp'] = pd.to_datetime(df['timestamp'])
df.set_index('timestamp', inplace=True)
daily_prod = df['oil_flow_rate'].resample('D').mean()
```

### Compressed files
```python
import gzip
import json

# Read compressed 6-month data
with gzip.open('PROD-001_6months_data.jsonl.gz', 'rt') as f:
    for line in f:
        record = json.loads(line)
        print(record)
        break
```

---

**Version:** 1.0
**Date:** November 2025
**Status:** ✅ Sample data generated

