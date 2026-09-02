"""Add subsidiaries, reservoirs, equipment, manual readings, VFM/decline and production targets.

Supports: NISOC subsidiary combo breakdown, equipment inventory (MOT, rigs,
pipelines, trucks, VFM, coiled tubing), manual well data entry ahead of
sensor procurement/installation, VFM + decline-curve rate-of-change
tracking, and per-subsidiary production targets.
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0003_operations_expansion"
down_revision = "0002_secure_command_workflow"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "subsidiaries",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "code", sa.String(length=20), nullable=False, unique=True, index=True
        ),
        sa.Column("name_fa", sa.String(length=150), nullable=False),
        sa.Column("name_en", sa.String(length=150), nullable=False),
        sa.Column(
            "active_well_count", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column("target_production_bopd", sa.Float(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true()),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "updated_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "reservoirs",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "subsidiary_id",
            sa.Integer(),
            sa.ForeignKey("subsidiaries.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("fluid_type", sa.String(length=30), nullable=False, index=True),
        sa.Column("well_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "equipment",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "equipment_id",
            sa.String(length=100),
            nullable=False,
            unique=True,
            index=True,
        ),
        sa.Column("equipment_type", sa.String(length=30), nullable=False, index=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column(
            "subsidiary_id",
            sa.Integer(),
            sa.ForeignKey("subsidiaries.id"),
            nullable=True,
            index=True,
        ),
        sa.Column("well_name", sa.String(length=50), nullable=True, index=True),
        sa.Column(
            "status", sa.String(length=20), nullable=False, server_default="active"
        ),
        sa.Column("phase", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("attributes", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "well_manual_readings",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("well_name", sa.String(length=50), nullable=False, index=True),
        sa.Column(
            "subsidiary_id",
            sa.Integer(),
            sa.ForeignKey("subsidiaries.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("reading_date", sa.DateTime(), nullable=False, index=True),
        sa.Column("production_pressure_psi", sa.Float(), nullable=True),
        sa.Column("production_flow_rate_bopd", sa.Float(), nullable=True),
        sa.Column("water_cut_pct", sa.Float(), nullable=True),
        sa.Column("gas_rate_mscfd", sa.Float(), nullable=True),
        sa.Column("choke_size_64th", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "entered_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "idx_manual_reading_well_date",
        "well_manual_readings",
        ["well_name", "reading_date"],
    )

    op.create_table(
        "vfm_decline_records",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("well_name", sa.String(length=50), nullable=False, index=True),
        sa.Column(
            "subsidiary_id",
            sa.Integer(),
            sa.ForeignKey("subsidiaries.id"),
            nullable=True,
            index=True,
        ),
        sa.Column("timestamp", sa.DateTime(), nullable=False, index=True),
        sa.Column("vfm_oil_rate_bopd", sa.Float(), nullable=False),
        sa.Column("vfm_water_rate_bwpd", sa.Float(), nullable=True),
        sa.Column("vfm_gas_rate_mscfd", sa.Float(), nullable=True),
        sa.Column("decline_qi", sa.Float(), nullable=True),
        sa.Column("decline_di", sa.Float(), nullable=True),
        sa.Column("decline_b", sa.Float(), nullable=True),
        sa.Column("decline_predicted_rate_bopd", sa.Float(), nullable=True),
        sa.Column("rate_change_pct", sa.Float(), nullable=True),
        sa.Column("alert_flag", sa.Boolean(), server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "idx_vfm_decline_well_timestamp",
        "vfm_decline_records",
        ["well_name", "timestamp"],
    )

    op.create_table(
        "production_targets",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "subsidiary_id",
            sa.Integer(),
            sa.ForeignKey("subsidiaries.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("period_start", sa.DateTime(), nullable=False),
        sa.Column("period_end", sa.DateTime(), nullable=False),
        sa.Column("target_bopd", sa.Float(), nullable=False),
        sa.Column(
            "created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "idx_production_target_subsidiary_period",
        "production_targets",
        ["subsidiary_id", "period_start"],
    )


def downgrade() -> None:
    op.drop_index(
        "idx_production_target_subsidiary_period", table_name="production_targets"
    )
    op.drop_table("production_targets")
    op.drop_index("idx_vfm_decline_well_timestamp", table_name="vfm_decline_records")
    op.drop_table("vfm_decline_records")
    op.drop_index("idx_manual_reading_well_date", table_name="well_manual_readings")
    op.drop_table("well_manual_readings")
    op.drop_table("equipment")
    op.drop_table("reservoirs")
    op.drop_table("subsidiaries")
