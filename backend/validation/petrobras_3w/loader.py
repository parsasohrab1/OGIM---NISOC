"""
Petrobras 3W Dataset Loader

Downloads and loads REAL instances from the 3W dataset for validation.
NO SYNTHETIC FALLBACK - fails if real data unavailable.

Dataset: https://github.com/petrobras/3W
License: CC BY 4.0
"""

import hashlib
import logging
import shutil
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd

logger = logging.getLogger(__name__)

# 3W Dataset location
THREE_W_REPO = "https://github.com/petrobras/3W"
DATA_DIR = Path(__file__).parent / "data"
CACHE_DIR = DATA_DIR / "3W_dataset"

# 3W Variable names (from dataset documentation)
SENSOR_COLUMNS = [
    "P-PDG",  # Pressure - Permanent Downhole Gauge (bar)
    "P-TPT",  # Pressure - Tubing Pressure Tree (bar)
    "T-TPT",  # Temperature - Tubing Temperature Tree (°C)
    "P-MON-CKP",  # Pressure - Monitored Choke Pressure (bar)
    "T-JUS-CKP",  # Temperature - Downstream Choke Temperature (°C)
    "P-JUS-CKGL",  # Pressure - Upstream Choke Pressure for Gas Lift (bar)
    "T-JUS-CKGL",  # Temperature - Upstream Choke Temperature for Gas Lift (°C)
    "QGL",  # Gas Lift Flow Rate (m³/d)
]

# Event labels from 3W dataset
EVENT_LABELS = {
    0: "Normal Operation",
    1: "Abrupt Increase of BSW",
    2: "Spurious Closure of DHSV",
    3: "Severe Slugging",
    4: "Flow Instability",
    5: "Rapid Productivity Loss",
    6: "Quick Restriction in PCK",
    7: "Scaling in PCK",
    8: "Hydrate in Production Line",
    9: "Hydrate in Service Line",
}


def compute_sha256(file_path: Path) -> str:
    """Compute SHA256 checksum of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def clone_3w_dataset(force_reclone: bool = False) -> Path:
    """
    Clone the 3W dataset repository.

    Args:
        force_reclone: If True, remove existing clone and re-clone

    Returns:
        Path to cloned repository

    Raises:
        RuntimeError: If cloning fails
    """
    if force_reclone and CACHE_DIR.exists():
        logger.info(f"Removing existing 3W clone: {CACHE_DIR}")
        shutil.rmtree(CACHE_DIR)

    if not CACHE_DIR.exists():
        logger.info(f"Cloning 3W dataset from {THREE_W_REPO}...")
        import subprocess

        try:
            # Clone with depth=1 to save space/time
            result = subprocess.run(
                ["git", "clone", "--depth", "1", THREE_W_REPO, str(CACHE_DIR)],
                capture_output=True,
                text=True,
                check=True,
            )
            logger.info(f"Cloned 3W dataset to {CACHE_DIR}")

            # Get commit SHA
            commit_result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                cwd=CACHE_DIR,
                capture_output=True,
                text=True,
                check=True,
            )
            commit_sha = commit_result.stdout.strip()
            logger.info(f"3W dataset commit: {commit_sha}")

        except subprocess.CalledProcessError as e:
            raise RuntimeError(
                f"Failed to clone 3W dataset: {e}\nStderr: {e.stderr}"
            ) from e
    else:
        logger.info(f"3W dataset already cloned at {CACHE_DIR}")

    return CACHE_DIR


def discover_real_instances(dataset_path: Path) -> List[Dict]:
    """
    Discover all REAL instances in the 3W dataset.

    Args:
        dataset_path: Path to cloned 3W repository

    Returns:
        List of instance metadata dictionaries

    Raises:
        FileNotFoundError: If dataset directory not found
    """
    dataset_dir = dataset_path / "dataset"
    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset directory not found: {dataset_dir}")

    instances = []

    # Iterate through class folders (0-9)
    for class_dir in sorted(dataset_dir.glob("[0-9]")):
        event_class = int(class_dir.name)

        # Find all REAL instances (prefixed with "WELL-")
        for parquet_file in class_dir.glob("WELL-*.parquet"):
            instance = {
                "file": parquet_file.name,
                "path": parquet_file,
                "well": parquet_file.name.split("_")[0],  # e.g., "WELL-00001"
                "event_class": event_class,
                "event_label": EVENT_LABELS.get(event_class, "Unknown"),
                "sha256": None,  # Computed on load
            }
            instances.append(instance)

    logger.info(
        f"Discovered {len(instances)} REAL instances across "
        f"{len(set(i['well'] for i in instances))} wells"
    )

    return instances


def load_parquet_instance(file_path: Path) -> pd.DataFrame:
    """
    Load a single 3W parquet file.

    Args:
        file_path: Path to parquet file

    Returns:
        DataFrame with loaded data

    Raises:
        RuntimeError: If loading fails
    """
    try:
        df = pd.read_parquet(file_path)
        logger.info(f"Loaded {len(df)} rows from {file_path.name}")
        return df
    except Exception as e:
        raise RuntimeError(f"Failed to load {file_path}: {e}") from e


def load_all_real_instances(
    max_instances: Optional[int] = None,
    event_classes: Optional[List[int]] = None,
) -> Dict[str, List[pd.DataFrame]]:
    """
    Load all REAL instances from the 3W dataset.

    Args:
        max_instances: Maximum instances to load (None = all)
        event_classes: Filter by event classes (None = all)

    Returns:
        Dictionary mapping well_id to list of DataFrames

    Raises:
        RuntimeError: If dataset cannot be loaded
    """
    # Clone dataset
    dataset_path = clone_3w_dataset()

    # Discover instances
    all_instances = discover_real_instances(dataset_path)

    # Filter by event class if requested
    if event_classes is not None:
        all_instances = [
            inst for inst in all_instances if inst["event_class"] in event_classes
        ]
        logger.info(f"Filtered to {len(all_instances)} instances for classes {event_classes}")

    # Limit number of instances
    if max_instances is not None:
        all_instances = all_instances[:max_instances]
        logger.info(f"Limited to {max_instances} instances")

    # Load instances
    well_data = {}
    for inst in all_instances:
        df = load_parquet_instance(inst["path"])

        # Add metadata
        df["well_id"] = inst["well"]
        df["event_type"] = inst["event_class"]
        df["instance_file"] = inst["file"]

        # Compute SHA256 of file
        inst["sha256"] = compute_sha256(inst["path"])

        # Group by well
        well_id = inst["well"]
        if well_id not in well_data:
            well_data[well_id] = []
        well_data[well_id].append(df)

    logger.info(f"Loaded {len(well_data)} wells with {len(all_instances)} instances total")
    return well_data


def get_dataset_summary(well_data: Dict[str, List[pd.DataFrame]]) -> pd.DataFrame:
    """Get summary statistics of the loaded dataset."""
    summaries = []
    for well_id, dfs in well_data.items():
        total_samples = sum(len(df) for df in dfs)
        event_classes = set()
        for df in dfs:
            event_classes.update(df["event_type"].unique())

        summaries.append(
            {
                "well_id": well_id,
                "n_instances": len(dfs),
                "total_samples": total_samples,
                "duration_hours": total_samples / 3600,  # Assume 1 Hz
                "event_classes": sorted(event_classes),
            }
        )

    return pd.DataFrame(summaries)


def create_manifest(well_data: Dict[str, List[pd.DataFrame]], output_path: Path) -> None:
    """
    Create a manifest file documenting all loaded instances.

    Args:
        well_data: Loaded well data
        output_path: Path to save manifest
    """
    import json
    from datetime import datetime

    manifest = {
        "created_at": datetime.utcnow().isoformat(),
        "dataset": "Petrobras 3W",
        "repository": THREE_W_REPO,
        "license": "CC BY 4.0",
        "instances": [],
    }

    for well_id, dfs in well_data.items():
        for df in dfs:
            instance_file = df["instance_file"].iloc[0]
            manifest["instances"].append(
                {
                    "file": instance_file,
                    "well": well_id,
                    "event_class": int(df["event_type"].iloc[0]),
                    "samples": len(df),
                    # SHA256 would be computed if we kept the Path reference
                }
            )

    with open(output_path, "w") as f:
        json.dump(manifest, f, indent=2)

    logger.info(f"Created manifest: {output_path}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    print("=" * 60)
    print("Petrobras 3W Dataset Loader (REAL instances only)")
    print("=" * 60)

    # Load a subset for testing
    well_data = load_all_real_instances(max_instances=20)

    print(f"\nLoaded {len(well_data)} wells")
    for well_id, dfs in well_data.items():
        total_samples = sum(len(df) for df in dfs)
        print(
            f"  - {well_id}: {len(dfs)} instances, {total_samples:,} samples, "
            f"{total_samples / 3600:.1f} hours"
        )

    # Print summary
    print("\nDataset Summary:")
    summary = get_dataset_summary(well_data)
    print(summary.to_string(index=False))
