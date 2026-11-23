"""
One-off local-dev seed script (no Docker required).

Creates all tables via SQLAlchemy metadata (dev-only shortcut - the same
approach shared/init_db.py uses) and seeds:
  - a handful of test users covering every role in shared/permissions.py
  - the 5 NISOC subsidiary operating companies with their reservoirs

Safe to run more than once: existing users/subsidiaries are left alone.
Used by scripts/run_local_dev.sh.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shared.database import engine, SessionLocal, Base
from shared.models import User, Subsidiary, Reservoir, Equipment
from shared.security import get_password_hash

USERS = [
    ("admin", "admin@ogim.local", "Admin@123", "system_admin"),
    ("hq_chief", "hq_chief@nisoc.local", "HqChief@123", "hq_operations_chief"),
    (
        "subsidiary_mgr",
        "subsidiary_mgr@nisoc.local",
        "Subsidiary@123",
        "subsidiary_ops_manager",
    ),
    ("field_super", "field_super@nisoc.local", "FieldSuper@123", "field_supervisor"),
    ("data_entry1", "data_entry1@nisoc.local", "DataEntry@123", "data_entry_operator"),
    ("viewer1", "viewer1@ogim.local", "Viewer@123", "viewer"),
]

# The number of wells and production rate of each subsidiary company are estimated from public sources (Persian Wikipedia,
# SHANA, IRNA) as of September 2026 - not an official real-time company figure; for the details of
# each row's source see frontend/web/src/data/operationsData.ts.
SUBSIDIARIES = [
    (
        "MIS",
        "Masjed Soleyman Oil and Gas Exploitation Company",
        "Masjed Soleyman Oil & Gas Producing Company",
        492,
        142000,
        [
            ("Masjed Soleyman", "oil", 300),
            ("Haft Shahidan", "gas", 92),
            ("Naft Safid", "associated_gas", 100),
        ],
    ),
    (
        "AGJ",
        "Aghajari Oil and Gas Exploitation Company",
        "Aghajari Oil & Gas Producing Company",
        218,
        180000,
        [
            ("Aghajari", "oil", 150),
            ("Aghajari gas cap (crude)", "gas_cap", 33),
            ("Rag Sefid", "oil", 35),
        ],
    ),
    (
        "KRN",
        "Karun Oil and Gas Exploitation Company",
        "Karoun Oil & Gas Producing Company",
        220,
        150000,
        [
            ("Ahvaz", "oil", 110),
            ("Mansouri", "oil", 80),
            ("Ahvaz - associated water", "water", 30),
        ],
    ),
    (
        "MN",
        "Maroun Oil and Gas Exploitation Company",
        "Marun Oil & Gas Producing Company",
        500,
        520000,
        [
            ("Asmari Maroun", "oil", 460),
            ("Bangestan Maroun", "oil", 30),
            ("Maroun crude", "associated_gas", 10),
        ],
    ),
    (
        "GCH",
        "Gachsaran Oil and Gas Exploitation Company",
        "Gachsaran Oil & Gas Producing Company",
        853,
        580000,
        [
            ("Gachsaran", "oil", 650),
            ("Bibi Hakimeh", "oil", 150),
            ("Gachsaran gas cap", "gas_cap", 53),
        ],
    ),
]


# Equipment catalog, counts and labels mirrored from
# frontend/web/src/data/operationsData.ts (EQUIPMENT_TYPE_LABEL_FA /
# buildEquipment) so the live backend carries the same inventory the
# dashboard displays, instead of the frontend's mock fallback being the
# only place this data exists.
EQUIPMENT_TYPE_LABEL_FA = {
    "mot": "MOT equipment (mobile multiphase measurement)",
    "rig": "Drilling/workover rig (Rig)",
    "pipeline": "Pipelines",
    "truck": "Truck (service vehicle)",
    "vfm": "Virtual flow meter (VFM)",
    "coiled_tubing": "Coiled tubing unit (Coiled Tubing)",
    "massive_acidizing": "Massive acidizing operation (Massive Acidizing)",
    "injectivity": "Injectivity test (Injectivity Test)",
    "fluid_injection": "Fluid injection (Fluid Injection)",
    "logging": "Well logging (Logging)",
    "perforating": "Perforating operation (Perforating)",
    "shutoff_isolation": "Shut-off and isolation (Shut-off / Isolation)",
    "mobile_processing_unit": "Mobile processing unit (Mobile Processing Unit)",
    "slickline": "Slickline operation (Slickline)",
    "workover_rig": "Workover rig (Workover Rig)",
    "development_rig": "Development drilling rig (Development Rig)",
}

RIG_COUNT_BY_CODE = {"MIS": 10, "AGJ": 4, "KRN": 4, "MN": 10, "GCH": 18}

PER_SUBSIDIARY_COUNTS = {
    "mot": 2,
    "rig": 0,  # overridden per-subsidiary via RIG_COUNT_BY_CODE
    "pipeline": 4,
    "truck": 5,
    "vfm": 4,
    "coiled_tubing": 2,
    "massive_acidizing": 1,
    "injectivity": 2,
    "fluid_injection": 2,
    "logging": 2,
    "perforating": 2,
    "shutoff_isolation": 1,
    "mobile_processing_unit": 1,
    "slickline": 2,
    "workover_rig": 2,
    "development_rig": 2,
}

WELL_LINKED_TYPES = {
    "vfm",
    "massive_acidizing",
    "injectivity",
    "fluid_injection",
    "logging",
    "perforating",
    "shutoff_isolation",
    "slickline",
    "workover_rig",
    "development_rig",
}


def main() -> None:
    if os.getenv("ENVIRONMENT", "development") != "development":
        print("Refusing to seed outside ENVIRONMENT=development.", file=sys.stderr)
        sys.exit(1)

    Base.metadata.create_all(bind=engine)
    print("tables ready")

    db = SessionLocal()
    try:
        for username, email, password, role in USERS:
            if db.query(User).filter(User.username == username).first():
                continue
            db.add(
                User(
                    username=username,
                    email=email,
                    hashed_password=get_password_hash(password),
                    role=role,
                )
            )
        db.commit()
        print(f"users seeded ({len(USERS)} accounts)")

        if not db.query(Subsidiary).first():
            for code, name_fa, name_en, wells, target, reservoirs in SUBSIDIARIES:
                sub = Subsidiary(
                    code=code,
                    name_fa=name_fa,
                    name_en=name_en,
                    active_well_count=wells,
                    target_production_bopd=target,
                )
                for r_name, fluid, count in reservoirs:
                    sub.reservoirs.append(
                        Reservoir(name=r_name, fluid_type=fluid, well_count=count)
                    )
                db.add(sub)
            db.commit()
            print(f"subsidiaries seeded ({len(SUBSIDIARIES)} companies)")
        else:
            print("subsidiaries already present, skipped")

        if not db.query(Equipment).first():
            subs = {sub.code: sub for sub in db.query(Subsidiary).all()}
            created = 0
            for code, sub in subs.items():
                for eq_type, label in EQUIPMENT_TYPE_LABEL_FA.items():
                    count = (
                        RIG_COUNT_BY_CODE.get(code, 0)
                        if eq_type == "rig"
                        else PER_SUBSIDIARY_COUNTS[eq_type]
                    )
                    for i in range(1, count + 1):
                        suffix = str(i).zfill(2)
                        db.add(
                            Equipment(
                                equipment_id=f"{code}-{eq_type.upper()}-{suffix}",
                                equipment_type=eq_type,
                                name=f"{label} {i}",
                                subsidiary_id=sub.id,
                                well_name=(
                                    f"{code}-{suffix}"
                                    if eq_type in WELL_LINKED_TYPES
                                    else None
                                ),
                                status="active",
                                phase=1,
                            )
                        )
                        created += 1
            db.commit()
            print(f"equipment seeded ({created} records)")
        else:
            print("equipment already present, skipped")
    finally:
        db.close()

    print("DONE")


if __name__ == "__main__":
    main()
