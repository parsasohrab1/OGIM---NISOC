"""
Role hierarchy, permission matrix, and HQ decision-support report catalog.

This defines access levels up to and including the HQ Head of Production
Engineering (Head of Operations Engineering, HQ) role, used by operations-service
(and any other service) to gate reads/writes and to describe, to the
frontend, which reports each role is expected to receive.
"""

from typing import Dict, List, Set

# --- Roles -----------------------------------------------------------------
# Ordered from broadest technical/system access down to the narrowest,
# field-level manual data-entry access. `level` is a coarse seniority rank
# used only for display/sorting, not for access checks (permissions below
# are the actual authorization source of truth).

ROLE_SYSTEM_ADMIN = "system_admin"
ROLE_HQ_OPERATIONS_CHIEF = "hq_operations_chief"
ROLE_SUBSIDIARY_OPS_MANAGER = "subsidiary_ops_manager"
ROLE_FIELD_SUPERVISOR = "field_supervisor"
ROLE_DATA_ENGINEER = "data_engineer"
ROLE_FIELD_OPERATOR = "field_operator"
ROLE_DATA_ENTRY_OPERATOR = "data_entry_operator"
ROLE_VIEWER = "viewer"

ROLE_DEFINITIONS: List[Dict] = [
    {
        "role": ROLE_SYSTEM_ADMIN,
        "level": 100,
        "title_fa": "System Administrator",
        "title_en": "System Administrator",
        "description_fa": "Full access to the system configuration, users and access levels.",
    },
    {
        "role": ROLE_HQ_OPERATIONS_CHIEF,
        "level": 90,
        "title_fa": "Head of Operations Engineering (HQ)",
        "title_en": "Head of Production Engineering (HQ)",
        "description_fa": (
            "View access to all subsidiary companies, equipment, production status and "
            "HQ-level decision-support reports; no access to system user management."
        ),
    },
    {
        "role": ROLE_SUBSIDIARY_OPS_MANAGER,
        "level": 70,
        "title_fa": "Subsidiary Operations Manager",
        "title_en": "Subsidiary Operations Manager",
        "description_fa": "Management access to the data of the parent subsidiary company (equipment, production targets, reports).",
    },
    {
        "role": ROLE_FIELD_SUPERVISOR,
        "level": 60,
        "title_fa": "Field Operations Supervisor",
        "title_en": "Field Operations Supervisor",
        "description_fa": "Supervision of the wells and equipment of the parent field and approval of manually entered data.",
    },
    {
        "role": ROLE_DATA_ENGINEER,
        "level": 55,
        "title_fa": "Data Engineer",
        "title_en": "Data Engineer",
        "description_fa": "Access to data integration, models and analytics pipelines.",
    },
    {
        "role": ROLE_FIELD_OPERATOR,
        "level": 50,
        "title_fa": "Field Operator",
        "title_en": "Field Operator",
        "description_fa": "Operational access to SCADA, alerts and field equipment control.",
    },
    {
        "role": ROLE_DATA_ENTRY_OPERATOR,
        "level": 30,
        "title_fa": "Well Data Entry Clerk (Operating Company)",
        "title_en": "Well Data Entry Operator (Operating Company)",
        "description_fa": (
            "Manual entry of the daily data of the parent subsidiary company's wells (production pressure, production rate, "
            "water cut, and other parameters) until field sensors are purchased and installed."
        ),
    },
    {
        "role": ROLE_VIEWER,
        "level": 10,
        "title_fa": "Viewer",
        "title_en": "Viewer",
        "description_fa": "Read-only access to public dashboards.",
    },
]

ALL_ROLES: Set[str] = {r["role"] for r in ROLE_DEFINITIONS}


# --- Permissions -------------------------------------------------------------

PERM_VIEW_DASHBOARD = "view_dashboard"
PERM_VIEW_ALL_SUBSIDIARIES = "view_all_subsidiaries"
PERM_MANAGE_SUBSIDIARIES = "manage_subsidiaries"
PERM_MANAGE_EQUIPMENT = "manage_equipment"
PERM_VIEW_EQUIPMENT = "view_equipment"
PERM_ENTER_MANUAL_READINGS = "enter_manual_readings"
PERM_VIEW_MANUAL_READINGS = "view_manual_readings"
PERM_VIEW_VFM_DECLINE = "view_vfm_decline"
PERM_MANAGE_VFM_DECLINE = "manage_vfm_decline"
PERM_MANAGE_PRODUCTION_TARGETS = "manage_production_targets"
PERM_VIEW_PRODUCTION_STATUS = "view_production_status"
PERM_EXPORT_HQ_REPORTS = "export_hq_reports"
PERM_MANAGE_ACCESS_LEVELS = "manage_access_levels"

# Roles at or above this level automatically inherit read-only visibility
# across every subsidiary rather than being scoped to just one.
HQ_WIDE_VISIBILITY_ROLES: Set[str] = {ROLE_SYSTEM_ADMIN, ROLE_HQ_OPERATIONS_CHIEF}

ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    ROLE_SYSTEM_ADMIN: {
        PERM_VIEW_DASHBOARD,
        PERM_VIEW_ALL_SUBSIDIARIES,
        PERM_MANAGE_SUBSIDIARIES,
        PERM_MANAGE_EQUIPMENT,
        PERM_VIEW_EQUIPMENT,
        PERM_ENTER_MANUAL_READINGS,
        PERM_VIEW_MANUAL_READINGS,
        PERM_VIEW_VFM_DECLINE,
        PERM_MANAGE_VFM_DECLINE,
        PERM_MANAGE_PRODUCTION_TARGETS,
        PERM_VIEW_PRODUCTION_STATUS,
        PERM_EXPORT_HQ_REPORTS,
        PERM_MANAGE_ACCESS_LEVELS,
    },
    ROLE_HQ_OPERATIONS_CHIEF: {
        PERM_VIEW_DASHBOARD,
        PERM_VIEW_ALL_SUBSIDIARIES,
        PERM_VIEW_EQUIPMENT,
        PERM_VIEW_MANUAL_READINGS,
        PERM_VIEW_VFM_DECLINE,
        PERM_VIEW_PRODUCTION_STATUS,
        PERM_EXPORT_HQ_REPORTS,
        PERM_MANAGE_PRODUCTION_TARGETS,
    },
    ROLE_SUBSIDIARY_OPS_MANAGER: {
        PERM_VIEW_DASHBOARD,
        PERM_MANAGE_EQUIPMENT,
        PERM_VIEW_EQUIPMENT,
        PERM_VIEW_MANUAL_READINGS,
        PERM_VIEW_VFM_DECLINE,
        PERM_MANAGE_VFM_DECLINE,
        PERM_VIEW_PRODUCTION_STATUS,
        PERM_MANAGE_PRODUCTION_TARGETS,
    },
    ROLE_FIELD_SUPERVISOR: {
        PERM_VIEW_DASHBOARD,
        PERM_VIEW_EQUIPMENT,
        PERM_ENTER_MANUAL_READINGS,
        PERM_VIEW_MANUAL_READINGS,
        PERM_VIEW_VFM_DECLINE,
        PERM_VIEW_PRODUCTION_STATUS,
    },
    ROLE_DATA_ENGINEER: {
        PERM_VIEW_DASHBOARD,
        PERM_VIEW_EQUIPMENT,
        PERM_VIEW_MANUAL_READINGS,
        PERM_VIEW_VFM_DECLINE,
        PERM_MANAGE_VFM_DECLINE,
        PERM_VIEW_PRODUCTION_STATUS,
    },
    ROLE_FIELD_OPERATOR: {
        PERM_VIEW_DASHBOARD,
        PERM_VIEW_EQUIPMENT,
        PERM_ENTER_MANUAL_READINGS,
        PERM_VIEW_MANUAL_READINGS,
        PERM_VIEW_VFM_DECLINE,
        PERM_VIEW_PRODUCTION_STATUS,
    },
    ROLE_DATA_ENTRY_OPERATOR: {
        PERM_VIEW_DASHBOARD,
        PERM_VIEW_EQUIPMENT,
        PERM_ENTER_MANUAL_READINGS,
        PERM_VIEW_MANUAL_READINGS,
    },
    ROLE_VIEWER: {
        PERM_VIEW_DASHBOARD,
    },
}


def permissions_for_role(role: str) -> Set[str]:
    return ROLE_PERMISSIONS.get(role, set())


def role_has_permission(role: str, permission: str) -> bool:
    return permission in permissions_for_role(role)


def role_has_wide_visibility(role: str) -> bool:
    return role in HQ_WIDE_VISIBILITY_ROLES


# --- HQ decision-support report catalog --------------------------------------
# Reports the HQ Head of Production Engineering is expected to be able to
# pull for cross-subsidiary decision making.

HQ_EXPECTED_REPORTS: List[Dict] = [
    {
        "id": "subsidiary_production_status",
        "title_fa": "Production status of each subsidiary company versus the defined target",
        "description_fa": "Current production rate of each of the 5 subsidiary companies against the defined target and the amount ahead/behind.",
        "category": "production",
    },
    {
        "id": "reservoir_well_inventory",
        "title_fa": "List of reservoirs by fluid type and number of active wells",
        "description_fa": "Number of reservoirs of each subsidiary company by fluid nature and the number of its active wells.",
        "category": "asset_inventory",
    },
    {
        "id": "equipment_utilization",
        "title_fa": "Equipment utilization (Rig, Coiled Tubing, truck) by subsidiary company",
        "description_fa": "Allocation and productivity status of drilling/workover/transport equipment in each subsidiary company.",
        "category": "equipment",
    },
    {
        "id": "vfm_decline_watch",
        "title_fa": "Tracking the production rate of change by combining the virtual flow meter and the decline curve",
        "description_fa": "Comparing the instantaneous rate of the virtual flow meter (VFM) with the production decline curve (Decline Curve) to identify unexpected decline.",
        "category": "production",
    },
    {
        "id": "manual_data_entry_coverage",
        "title_fa": "Manual well data entry coverage (before sensor installation)",
        "description_fa": "Percentage of wells whose daily data has been manually entered by the operating company.",
        "category": "data_quality",
    },
    {
        "id": "access_level_matrix",
        "title_fa": "System access level matrix",
        "description_fa": "List of roles and access levels defined in the system up to the level of Head of Operations Engineering at HQ.",
        "category": "governance",
    },
]
