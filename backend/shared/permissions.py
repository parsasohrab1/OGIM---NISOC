"""
Role hierarchy, permission matrix, and HQ decision-support report catalog.

This defines access levels up to and including the HQ Head of Production
Engineering (رئیس مهندسی بهره‌برداری ستاد) role, used by operations-service
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
        "title_fa": "مدیر سیستم",
        "title_en": "System Administrator",
        "description_fa": "دسترسی کامل به پیکربندی سامانه، کاربران و سطوح دسترسی.",
    },
    {
        "role": ROLE_HQ_OPERATIONS_CHIEF,
        "level": 90,
        "title_fa": "رئیس مهندسی بهره‌برداری ستاد",
        "title_en": "Head of Production Engineering (HQ)",
        "description_fa": (
            "دسترسی مشاهده به تمامی شرکت‌های تابعه، تجهیزات، وضعیت تولید و "
            "گزارش‌های تصمیم‌یار در سطح ستاد؛ بدون دسترسی به مدیریت کاربران سامانه."
        ),
    },
    {
        "role": ROLE_SUBSIDIARY_OPS_MANAGER,
        "level": 70,
        "title_fa": "مدیر بهره‌برداری شرکت تابعه",
        "title_en": "Subsidiary Operations Manager",
        "description_fa": "دسترسی مدیریتی به داده‌های شرکت تابعه متبوع (تجهیزات، اهداف تولید، گزارش‌ها).",
    },
    {
        "role": ROLE_FIELD_SUPERVISOR,
        "level": 60,
        "title_fa": "سرپرست عملیات میدان",
        "title_en": "Field Operations Supervisor",
        "description_fa": "نظارت بر چاه‌ها و تجهیزات میدان متبوع و تایید داده‌های ثبت‌شده دستی.",
    },
    {
        "role": ROLE_DATA_ENGINEER,
        "level": 55,
        "title_fa": "مهندس داده",
        "title_en": "Data Engineer",
        "description_fa": "دسترسی به یکپارچه‌سازی داده، مدل‌ها و پایپ‌لاین‌های تحلیلی.",
    },
    {
        "role": ROLE_FIELD_OPERATOR,
        "level": 50,
        "title_fa": "اپراتور میدان",
        "title_en": "Field Operator",
        "description_fa": "دسترسی عملیاتی به اسکادا، هشدارها و کنترل تجهیزات میدان.",
    },
    {
        "role": ROLE_DATA_ENTRY_OPERATOR,
        "level": 30,
        "title_fa": "متصدی ثبت اطلاعات چاه (شرکت بهره‌برداری)",
        "title_en": "Well Data Entry Operator (Operating Company)",
        "description_fa": (
            "ثبت دستی اطلاعات روزانه چاه‌های شرکت تابعه متبوع (فشار تولید، دبی تولید، "
            "درصد آب، و سایر پارامترها) تا زمان خرید و نصب سنسورهای میدانی."
        ),
    },
    {
        "role": ROLE_VIEWER,
        "level": 10,
        "title_fa": "بازدیدکننده",
        "title_en": "Viewer",
        "description_fa": "دسترسی فقط‌خواندنی به داشبوردهای عمومی.",
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
        "title_fa": "وضعیت تولید هر شرکت تابعه نسبت به هدف تعریف‌شده",
        "description_fa": "دبی تولید فعلی هر یک از ۵ شرکت تابعه در برابر هدف تعریف‌شده و میزان جلو/عقب بودن.",
        "category": "production",
    },
    {
        "id": "reservoir_well_inventory",
        "title_fa": "فهرست مخازن به تفکیک نوع سیال و تعداد چاه فعال",
        "description_fa": "تعداد مخازن هر شرکت تابعه به تفکیک ماهیت سیال و تعداد چاه‌های فعال آن.",
        "category": "asset_inventory",
    },
    {
        "id": "equipment_utilization",
        "title_fa": "میزان بکارگیری تجهیزات (Rig، Coiled Tubing، تراک) به تفکیک شرکت تابعه",
        "description_fa": "وضعیت تخصیص و بهره‌وری تجهیزات حفاری/تعمیر/حمل در هر شرکت تابعه.",
        "category": "equipment",
    },
    {
        "id": "vfm_decline_watch",
        "title_fa": "رصد نرخ تغییر تولید با تلفیق دبی‌سنج مجازی و منحنی افت تولید",
        "description_fa": "مقایسه دبی لحظه‌ای دبی‌سنج مجازی (VFM) با منحنی افت تولید (Decline Curve) برای شناسایی افت غیرمنتظره.",
        "category": "production",
    },
    {
        "id": "manual_data_entry_coverage",
        "title_fa": "پوشش ثبت دستی اطلاعات چاه‌ها (پیش از نصب سنسور)",
        "description_fa": "درصد چاه‌هایی که داده روزانه آن‌ها به‌صورت دستی توسط شرکت بهره‌برداری ثبت شده است.",
        "category": "data_quality",
    },
    {
        "id": "access_level_matrix",
        "title_fa": "ماتریس سطوح دسترسی سامانه",
        "description_fa": "فهرست نقش‌ها و سطوح دسترسی تعریف‌شده در سامانه تا سطح ریاست مهندسی بهره‌برداری ستاد.",
        "category": "governance",
    },
]
