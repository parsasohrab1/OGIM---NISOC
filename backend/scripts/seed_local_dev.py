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
from shared.models import User, Subsidiary, Reservoir
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

SUBSIDIARIES = [
    (
        "MIS",
        "شرکت بهره‌برداری نفت و گاز مسجدسلیمان",
        "Masjed Soleyman Oil & Gas Producing Company",
        210,
        95000,
        [
            ("مسجدسلیمان", "oil", 120),
            ("هفت‌شهیدان", "gas", 40),
            ("نفت سفید", "associated_gas", 50),
        ],
    ),
    (
        "AGJ",
        "شرکت بهره‌برداری نفت و گاز آغاجاری",
        "Aghajari Oil & Gas Producing Company",
        340,
        210000,
        [
            ("آغاجاری", "oil", 260),
            ("کلاهک گازی آغاجاری", "gas_cap", 30),
            ("رگ سفید", "oil", 50),
        ],
    ),
    (
        "KRN",
        "شرکت بهره‌برداری نفت و گاز کارون",
        "Karoun Oil & Gas Producing Company",
        180,
        130000,
        [
            ("اهواز", "oil", 90),
            ("منصوری", "oil", 60),
            ("اهواز - آب همراه", "water", 30),
        ],
    ),
    (
        "MRN",
        "شرکت بهره‌برداری نفت و گاز مارون",
        "Marun Oil & Gas Producing Company",
        24,
        520000,
        [("آسماری–بنگستان مارون", "oil", 20), ("گاز همراه مارون", "associated_gas", 4)],
    ),
    (
        "GCH",
        "شرکت بهره‌برداری نفت و گاز گچساران",
        "Gachsaran Oil & Gas Producing Company",
        260,
        250000,
        [
            ("گچساران", "oil", 190),
            ("بی‌بی حکیمه", "oil", 40),
            ("کلاهک گازی گچساران", "gas_cap", 30),
        ],
    ),
]


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
    finally:
        db.close()

    print("DONE")


if __name__ == "__main__":
    main()
