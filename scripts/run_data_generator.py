#!/usr/bin/env python3
"""
Convenience script to run the data generator
"""
import sys
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from data_generator import main

if __name__ == "__main__":
    main()

