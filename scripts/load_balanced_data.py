"""
Load balanced dataset with normal samples (class 0) included.
"""
import json
import logging
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from validation.petrobras_3w.loader import (  # noqa: E402
    clone_3w_dataset,
    discover_real_instances,
    load_parquet_instance,
)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def load_balanced_instances(max_per_class=40, random_seed=42):
    """
    Load balanced dataset including normal samples (class 0).
    
    Uses per-sample `class` column to determine actual labels.
    """
    import numpy as np
    
    dataset_path = clone_3w_dataset()
    instances = discover_real_instances(dataset_path)
    
    logger.info(f"Discovered {len(instances)} REAL instances")
    
    # Group by event class
    by_class = {}
    for inst in instances:
        cls = inst["event_class"]
        if cls not in by_class:
            by_class[cls] = []
        by_class[cls].append(inst)
    
    logger.info(f"Classes found: {sorted(by_class.keys())}")
    
    # Sample up to max_per_class from each class (0-9)
    np.random.seed(random_seed)
    selected = []
    
    for cls in range(10):  # Include class 0 (normal)
        if cls in by_class:
            available = by_class[cls]
            n_sample = min(max_per_class, len(available))
            sampled = np.random.choice(available, size=n_sample, replace=False).tolist()
            selected.extend(sampled)
            logger.info(f"Class {cls}: sampled {n_sample}/{len(available)} instances")
    
    # Load selected instances
    data = {}
    for inst in selected:
        well_id = inst["well"]
        file_path = Path(inst["path"])
        
        df = load_parquet_instance(file_path)
        logger.info(f"Loaded {len(df)} rows from {inst['file']}")
        
        if well_id not in data:
            data[well_id] = []
        data[well_id].append(df)
    
    logger.info(f"Loaded {len(data)} wells with {len(selected)} instances total")
    
    # Save manifest
    manifest_path = Path(__file__).parent.parent / "backend" / "validation" / "petrobras_3w" / "data" / "balanced_instances_manifest.json"
    manifest = {
        "date": pd.Timestamp.now().isoformat(),
        "max_per_class": max_per_class,
        "random_seed": random_seed,
        "total_instances": len(selected),
        "instances": selected,
    }
    
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2, default=str)
    
    logger.info(f"Wrote manifest: {manifest_path}")
    
    return data


if __name__ == "__main__":
    data = load_balanced_instances(max_per_class=40, random_seed=42)
    logger.info(f"✓ Loaded {len(data)} wells")
