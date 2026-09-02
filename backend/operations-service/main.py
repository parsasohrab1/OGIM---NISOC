"""
Operations Service

Backs the NISOC subsidiary/equipment/manual-data-entry/VFM+decline-curve
dashboard features:
  - Subsidiary combo breakdown (5 NISOC operating companies), reservoirs by
    fluid type, active well counts.
  - Equipment inventory: MOT equipment, rigs, pipelines, trucks, virtual
    flow meters, coiled tubing units.
  - Manual well data entry for operating-company personnel (phase 1, ahead
    of sensor procurement/installation).
  - Virtual flow meter (VFM) + decline-curve rate-of-change tracking.
  - Per-subsidiary production targets and ahead/behind status.
  - The access-level matrix and the HQ Head of Production Engineering's
    expected report catalog.
"""

import os
import sys
from datetime import datetime
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import uvicorn

backend_dir = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, backend_dir)

from shared.config import settings
from shared.logging_config import setup_logging
from shared.metrics import setup_metrics
from shared.tracing import setup_tracing
from shared.auth import require_authentication, require_permission
from shared.database import get_db
from shared.models import (
    Subsidiary,
    Reservoir,
    Equipment,
    WellManualReading,
    VfmDeclineRecord,
    ProductionTarget,
)
from shared.permissions import (
    ROLE_DEFINITIONS,
    ROLE_PERMISSIONS,
    HQ_EXPECTED_REPORTS,
    PERM_VIEW_DASHBOARD,
    PERM_VIEW_EQUIPMENT,
    PERM_MANAGE_EQUIPMENT,
    PERM_MANAGE_SUBSIDIARIES,
    PERM_VIEW_MANUAL_READINGS,
    PERM_ENTER_MANUAL_READINGS,
    PERM_VIEW_VFM_DECLINE,
    PERM_MANAGE_VFM_DECLINE,
    PERM_VIEW_PRODUCTION_STATUS,
    PERM_MANAGE_PRODUCTION_TARGETS,
    PERM_EXPORT_HQ_REPORTS,
)

logger = setup_logging("operations-service")

app = FastAPI(title="OGIM Operations Service", version="1.0.0")
setup_metrics(app, "operations-service")
setup_tracing(app, "operations-service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EQUIPMENT_TYPES = [
    "mot",
    "rig",
    "pipeline",
    "truck",
    "vfm",
    "coiled_tubing",
    "massive_acidizing",
    "injectivity",
    "fluid_injection",
    "logging",
    "perforating",
    "shutoff_isolation",
    "mobile_processing_unit",
    "slickline",
    "workover_rig",
    "development_rig",
]
FLUID_TYPES = ["oil", "gas", "gas_cap", "associated_gas", "water"]


# --- Schemas -----------------------------------------------------------------


class ReservoirIn(BaseModel):
    name: str
    fluid_type: str
    well_count: int = 0


class SubsidiaryIn(BaseModel):
    code: str
    name_fa: str
    name_en: str
    active_well_count: int = 0
    target_production_bopd: Optional[float] = None
    notes: Optional[str] = None
    reservoirs: List[ReservoirIn] = Field(default_factory=list)


class SubsidiaryUpdate(BaseModel):
    name_fa: Optional[str] = None
    name_en: Optional[str] = None
    active_well_count: Optional[int] = None
    target_production_bopd: Optional[float] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class EquipmentIn(BaseModel):
    equipment_id: str
    equipment_type: str
    name: str
    subsidiary_id: Optional[int] = None
    well_name: Optional[str] = None
    status: str = "active"
    phase: int = 1
    attributes: Optional[dict] = None


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    subsidiary_id: Optional[int] = None
    well_name: Optional[str] = None
    status: Optional[str] = None
    phase: Optional[int] = None
    attributes: Optional[dict] = None


class ManualReadingIn(BaseModel):
    well_name: str
    subsidiary_id: int
    reading_date: datetime
    production_pressure_psi: Optional[float] = None
    production_flow_rate_bopd: Optional[float] = None
    water_cut_pct: Optional[float] = None
    gas_rate_mscfd: Optional[float] = None
    choke_size_64th: Optional[float] = None
    notes: Optional[str] = None


class VfmDeclineIn(BaseModel):
    well_name: str
    subsidiary_id: Optional[int] = None
    timestamp: datetime
    vfm_oil_rate_bopd: float
    vfm_water_rate_bwpd: Optional[float] = None
    vfm_gas_rate_mscfd: Optional[float] = None
    decline_qi: Optional[float] = None
    decline_di: Optional[float] = None
    decline_b: Optional[float] = None


class ProductionTargetIn(BaseModel):
    subsidiary_id: int
    period_start: datetime
    period_end: datetime
    target_bopd: float


# --- Helpers -------------------------------------------------------------


def _arps_rate(qi: float, di: float, b: float, t_years: float) -> float:
    """Arps hyperbolic/exponential decline forecast at time t (years)."""
    if qi is None or di is None:
        return None
    if b is None or abs(b) < 1e-9:
        return qi * pow(2.718281828, -di * t_years)
    return qi / pow(1 + b * di * t_years, 1.0 / b)


def _subsidiary_to_dict(s: Subsidiary) -> dict:
    return {
        "id": s.id,
        "code": s.code,
        "name_fa": s.name_fa,
        "name_en": s.name_en,
        "active_well_count": s.active_well_count,
        "target_production_bopd": s.target_production_bopd,
        "is_active": s.is_active,
        "notes": s.notes,
        "reservoirs": [
            {
                "id": r.id,
                "name": r.name,
                "fluid_type": r.fluid_type,
                "well_count": r.well_count,
            }
            for r in s.reservoirs
        ],
        "reservoir_count": len(s.reservoirs),
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


# --- Subsidiaries ----------------------------------------------------------


@app.get("/subsidiaries")
async def list_subsidiaries(
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(PERM_VIEW_DASHBOARD)),
):
    subsidiaries = db.query(Subsidiary).order_by(Subsidiary.code).all()
    return [_subsidiary_to_dict(s) for s in subsidiaries]


@app.post("/subsidiaries", status_code=201)
async def create_subsidiary(
    payload: SubsidiaryIn,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(PERM_MANAGE_SUBSIDIARIES)),
):
    if db.query(Subsidiary).filter(Subsidiary.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Subsidiary code already exists")

    sub = Subsidiary(
        code=payload.code,
        name_fa=payload.name_fa,
        name_en=payload.name_en,
        active_well_count=payload.active_well_count,
        target_production_bopd=payload.target_production_bopd,
        notes=payload.notes,
    )
    for r in payload.reservoirs:
        sub.reservoirs.append(
            Reservoir(name=r.name, fluid_type=r.fluid_type, well_count=r.well_count)
        )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return _subsidiary_to_dict(sub)


@app.put("/subsidiaries/{subsidiary_id}")
async def update_subsidiary(
    subsidiary_id: int,
    payload: SubsidiaryUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission(PERM_MANAGE_SUBSIDIARIES)),
):
    sub = db.query(Subsidiary).filter(Subsidiary.id == subsidiary_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subsidiary not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(sub, field, value)
    db.commit()
    db.refresh(sub)
    return _subsidiary_to_dict(sub)


@app.put("/subsidiaries/{subsidiary_id}/reservoirs")
async def replace_reservoirs(
    subsidiary_id: int,
    reservoirs: List[ReservoirIn],
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(PERM_MANAGE_SUBSIDIARIES)),
):
    """Manually (re)select the reservoir-by-fluid-type breakdown for a subsidiary."""
    sub = db.query(Subsidiary).filter(Subsidiary.id == subsidiary_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subsidiary not found")

    db.query(Reservoir).filter(Reservoir.subsidiary_id == subsidiary_id).delete()
    for r in reservoirs:
        sub.reservoirs.append(
            Reservoir(name=r.name, fluid_type=r.fluid_type, well_count=r.well_count)
        )
    db.commit()
    db.refresh(sub)
    return _subsidiary_to_dict(sub)


# --- Equipment ---------------------------------------------------------------


@app.get("/equipment")
async def list_equipment(
    equipment_type: Optional[str] = None,
    subsidiary_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(PERM_VIEW_EQUIPMENT)),
):
    query = db.query(Equipment)
    if equipment_type:
        query = query.filter(Equipment.equipment_type == equipment_type)
    if subsidiary_id:
        query = query.filter(Equipment.subsidiary_id == subsidiary_id)
    items = query.order_by(Equipment.equipment_type, Equipment.equipment_id).all()
    return [
        {
            "id": e.id,
            "equipment_id": e.equipment_id,
            "equipment_type": e.equipment_type,
            "name": e.name,
            "subsidiary_id": e.subsidiary_id,
            "well_name": e.well_name,
            "status": e.status,
            "phase": e.phase,
            "attributes": e.attributes,
            "updated_at": e.updated_at.isoformat() if e.updated_at else None,
        }
        for e in items
    ]


@app.post("/equipment", status_code=201)
async def create_equipment(
    payload: EquipmentIn,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(PERM_MANAGE_EQUIPMENT)),
):
    if payload.equipment_type not in EQUIPMENT_TYPES:
        raise HTTPException(
            status_code=400, detail=f"Invalid equipment_type: {payload.equipment_type}"
        )
    if (
        db.query(Equipment)
        .filter(Equipment.equipment_id == payload.equipment_id)
        .first()
    ):
        raise HTTPException(status_code=400, detail="equipment_id already exists")

    item = Equipment(**payload.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "equipment_id": item.equipment_id}


@app.put("/equipment/{equipment_id}")
async def update_equipment(
    equipment_id: int,
    payload: EquipmentUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(PERM_MANAGE_EQUIPMENT)),
):
    item = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    return {"status": "updated"}


@app.delete("/equipment/{equipment_id}")
async def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(PERM_MANAGE_EQUIPMENT)),
):
    item = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment not found")
    db.delete(item)
    db.commit()
    return {"status": "deleted"}


# --- Manual well data entry (phase 1, pre-sensor) -----------------------------


@app.get("/manual-readings")
async def list_manual_readings(
    well_name: Optional[str] = None,
    subsidiary_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(PERM_VIEW_MANUAL_READINGS)),
):
    query = db.query(WellManualReading)
    if well_name:
        query = query.filter(WellManualReading.well_name == well_name)
    if subsidiary_id:
        query = query.filter(WellManualReading.subsidiary_id == subsidiary_id)
    items = query.order_by(WellManualReading.reading_date.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "well_name": r.well_name,
            "subsidiary_id": r.subsidiary_id,
            "reading_date": r.reading_date.isoformat(),
            "production_pressure_psi": r.production_pressure_psi,
            "production_flow_rate_bopd": r.production_flow_rate_bopd,
            "water_cut_pct": r.water_cut_pct,
            "gas_rate_mscfd": r.gas_rate_mscfd,
            "choke_size_64th": r.choke_size_64th,
            "notes": r.notes,
            "entered_by_id": r.entered_by_id,
        }
        for r in items
    ]


@app.post("/manual-readings", status_code=201)
async def create_manual_reading(
    payload: ManualReadingIn,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission(PERM_ENTER_MANUAL_READINGS)),
):
    """
    Manual data entry endpoint for operating-company personnel. This is the
    phase-1 substitute for automated sensor/PLC ingestion, used until wells
    have sensors procured and installed.
    """
    if not db.query(Subsidiary).filter(Subsidiary.id == payload.subsidiary_id).first():
        raise HTTPException(status_code=404, detail="Subsidiary not found")

    reading = WellManualReading(**payload.dict())
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return {"id": reading.id, "status": "recorded"}


# --- VFM + decline curve rate-of-change tracking ------------------------------


@app.get("/vfm-decline/{well_name}")
async def get_vfm_decline(
    well_name: str,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(PERM_VIEW_VFM_DECLINE)),
):
    items = (
        db.query(VfmDeclineRecord)
        .filter(VfmDeclineRecord.well_name == well_name)
        .order_by(VfmDeclineRecord.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "vfm_oil_rate_bopd": r.vfm_oil_rate_bopd,
            "vfm_water_rate_bwpd": r.vfm_water_rate_bwpd,
            "vfm_gas_rate_mscfd": r.vfm_gas_rate_mscfd,
            "decline_qi": r.decline_qi,
            "decline_di": r.decline_di,
            "decline_b": r.decline_b,
            "decline_predicted_rate_bopd": r.decline_predicted_rate_bopd,
            "rate_change_pct": r.rate_change_pct,
            "alert_flag": r.alert_flag,
        }
        for r in reversed(items)
    ]


@app.post("/vfm-decline", status_code=201)
async def record_vfm_decline(
    payload: VfmDeclineIn,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(PERM_MANAGE_VFM_DECLINE)),
):
    """
    Record a VFM reading and fit it against the well's Arps decline curve to
    watch the rate of change of production via the virtual flow meter.
    """
    predicted = None
    rate_change_pct = None
    alert_flag = False

    if payload.decline_qi and payload.decline_di is not None:
        last = (
            db.query(VfmDeclineRecord)
            .filter(VfmDeclineRecord.well_name == payload.well_name)
            .order_by(VfmDeclineRecord.timestamp.asc())
            .first()
        )
        t0 = last.timestamp if last else payload.timestamp
        t_years = max((payload.timestamp - t0).days, 0) / 365.0
        predicted = _arps_rate(
            payload.decline_qi, payload.decline_di, payload.decline_b or 0.0, t_years
        )
        if predicted and predicted > 0:
            rate_change_pct = round(
                (payload.vfm_oil_rate_bopd - predicted) / predicted * 100, 2
            )
            alert_flag = abs(rate_change_pct) >= 10.0

    record = VfmDeclineRecord(
        **payload.dict(),
        decline_predicted_rate_bopd=predicted,
        rate_change_pct=rate_change_pct,
        alert_flag=alert_flag,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {
        "id": record.id,
        "decline_predicted_rate_bopd": predicted,
        "rate_change_pct": rate_change_pct,
        "alert_flag": alert_flag,
    }


# --- Production targets & subsidiary production status -----------------------


@app.post("/production-targets", status_code=201)
async def create_production_target(
    payload: ProductionTargetIn,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission(PERM_MANAGE_PRODUCTION_TARGETS)),
):
    if not db.query(Subsidiary).filter(Subsidiary.id == payload.subsidiary_id).first():
        raise HTTPException(status_code=404, detail="Subsidiary not found")
    target = ProductionTarget(**payload.dict())
    db.add(target)
    db.commit()
    db.refresh(target)
    return {"id": target.id}


@app.get("/production-status")
async def production_status(
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(PERM_VIEW_PRODUCTION_STATUS)),
):
    """
    Per-subsidiary producing-well flow rate vs. defined target, plus
    coiled-tubing/truck/rig equipment usage, with an ahead/behind indicator.
    """
    subsidiaries = db.query(Subsidiary).order_by(Subsidiary.code).all()
    results = []
    for sub in subsidiaries:
        latest_target = (
            db.query(ProductionTarget)
            .filter(ProductionTarget.subsidiary_id == sub.id)
            .order_by(ProductionTarget.period_start.desc())
            .first()
        )
        target_bopd = (
            latest_target.target_bopd if latest_target else sub.target_production_bopd
        )

        actual_bopd = (
            db.query(WellManualReading)
            .filter(WellManualReading.subsidiary_id == sub.id)
            .order_by(WellManualReading.reading_date.desc())
            .limit(sub.active_well_count or 50)
        )
        actual_values = [
            r.production_flow_rate_bopd
            for r in actual_bopd
            if r.production_flow_rate_bopd is not None
        ]
        actual_total = sum(actual_values) if actual_values else None

        variance_pct = None
        status = "unknown"
        if target_bopd and actual_total is not None:
            variance_pct = round((actual_total - target_bopd) / target_bopd * 100, 2)
            status = "ahead" if variance_pct >= 0 else "behind"

        equipment_counts = {}
        for eq_type in ("coiled_tubing", "truck", "rig"):
            equipment_counts[eq_type] = (
                db.query(Equipment)
                .filter(
                    Equipment.subsidiary_id == sub.id,
                    Equipment.equipment_type == eq_type,
                    Equipment.status == "active",
                )
                .count()
            )

        results.append(
            {
                "subsidiary_id": sub.id,
                "code": sub.code,
                "name_fa": sub.name_fa,
                "active_well_count": sub.active_well_count,
                "target_bopd": target_bopd,
                "actual_bopd": actual_total,
                "variance_pct": variance_pct,
                "status": status,
                "equipment_in_use": equipment_counts,
            }
        )
    return results


# --- Access levels & HQ decision-support report catalog -----------------------


@app.get("/access-levels")
async def access_levels(_: dict = Depends(require_authentication)):
    return {
        "roles": ROLE_DEFINITIONS,
        "permissions": {
            role: sorted(perms) for role, perms in ROLE_PERMISSIONS.items()
        },
        "hq_expected_reports": HQ_EXPECTED_REPORTS,
    }


@app.get("/reports/hq-summary")
async def hq_summary_report(
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(PERM_EXPORT_HQ_REPORTS)),
):
    """Cross-subsidiary decision-support summary for the HQ Head of Production Engineering."""
    subsidiaries = db.query(Subsidiary).all()
    reservoir_inventory = []
    for sub in subsidiaries:
        by_fluid = {}
        for r in sub.reservoirs:
            by_fluid[r.fluid_type] = by_fluid.get(r.fluid_type, 0) + 1
        reservoir_inventory.append(
            {
                "subsidiary": sub.name_fa,
                "reservoirs_by_fluid_type": by_fluid,
                "active_well_count": sub.active_well_count,
            }
        )

    total_wells = db.query(Subsidiary).count() and sum(
        s.active_well_count or 0 for s in subsidiaries
    )
    wells_with_recent_manual_data = (
        db.query(WellManualReading.well_name).distinct().count()
    )
    coverage_pct = (
        round(wells_with_recent_manual_data / total_wells * 100, 1)
        if total_wells
        else None
    )

    alerts = (
        db.query(VfmDeclineRecord)
        .filter(VfmDeclineRecord.alert_flag.is_(True))
        .order_by(VfmDeclineRecord.timestamp.desc())
        .limit(20)
        .all()
    )

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "reservoir_and_well_inventory": reservoir_inventory,
        "manual_data_entry_coverage_pct": coverage_pct,
        "vfm_decline_alerts": [
            {
                "well_name": a.well_name,
                "timestamp": a.timestamp.isoformat(),
                "rate_change_pct": a.rate_change_pct,
            }
            for a in alerts
        ],
        "report_catalog": HQ_EXPECTED_REPORTS,
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "operations-service"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8016)
