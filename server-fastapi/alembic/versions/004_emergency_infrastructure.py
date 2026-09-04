"""Phase 3D Emergency and Infrastructure Migration

Revision ID: 004_emergency_infrastructure
Revises: 003_parking_complaints
Create Date: 2026-09-02 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004_emergency_infrastructure"
down_revision: Union[str, None] = "003_parking_complaints"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create emergency_incidents table
    op.create_table(
        "emergency_incidents",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("citizen_name", sa.String(length=255), nullable=False, server_default="Verified Citizen (DEMO - Masked)"),
        sa.Column("citizen_id", sa.Integer(), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("priority", sa.String(length=50), nullable=False, server_default="CODE_RED_112"),
        sa.Column("assigned_unit", sa.String(length=255), nullable=False, server_default="EMS-ALPHA-07 (ALS Unit)"),
        sa.Column("destination_hospital", sa.String(length=255), nullable=False, server_default="City General Trauma Center (H01)"),
        sa.Column("eta_minutes", sa.Float(), nullable=False, server_default="3.8"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="DISPATCHED"),
        sa.Column("is_simulated", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["citizen_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("idx_emergency_incidents_code", "emergency_incidents", ["code"])
    op.create_index("idx_emergency_incidents_status", "emergency_incidents", ["status"])

    # 2. Create green_corridors table
    op.create_table(
        "green_corridors",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("assigned_unit", sa.String(length=255), nullable=False),
        sa.Column("corridor_route", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="ACTIVE"),
        sa.Column("eta_minutes", sa.Integer(), nullable=False, server_default="6"),
        sa.Column("signals_cleared", sa.String(length=50), nullable=False, server_default="4/5"),
        sa.Column("speed_kmh", sa.Integer(), nullable=False, server_default="68"),
        sa.Column("is_simulated", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_green_corridors_status", "green_corridors", ["status"])

    # 3. Create infrastructure_projects table
    op.create_table(
        "infrastructure_projects",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("project_code", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("department", sa.String(length=255), nullable=False),
        sa.Column("contractor", sa.String(length=255), nullable=False),
        sa.Column("progress_percent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("budget_crores", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="IN_PROGRESS"),
        sa.Column("estimated_completion", sa.String(length=100), nullable=False, server_default="Q4 2026"),
        sa.Column("timeline", sa.String(length=100), nullable=False, server_default="2026"),
        sa.Column("traffic_diversion_active", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_simulated", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_code"),
    )
    op.create_index("idx_infrastructure_projects_code", "infrastructure_projects", ["project_code"])
    op.create_index("idx_infrastructure_projects_status", "infrastructure_projects", ["status"])

    # 4. Create road_approvals table
    op.create_table(
        "road_approvals",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("proposed_by", sa.String(length=255), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("closure_duration", sa.String(length=100), nullable=False),
        sa.Column("estimated_delay_mins", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("traffic_impact_level", sa.String(length=50), nullable=False, server_default="MODERATE"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="PENDING"),
        sa.Column("comments", sa.String(length=1000), nullable=True),
        sa.Column("is_simulated", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_road_approvals_status", "road_approvals", ["status"])


def downgrade() -> None:
    op.drop_index("idx_road_approvals_status", table_name="road_approvals")
    op.drop_table("road_approvals")

    op.drop_index("idx_infrastructure_projects_status", table_name="infrastructure_projects")
    op.drop_index("idx_infrastructure_projects_code", table_name="infrastructure_projects")
    op.drop_table("infrastructure_projects")

    op.drop_index("idx_green_corridors_status", table_name="green_corridors")
    op.drop_table("green_corridors")

    op.drop_index("idx_emergency_incidents_status", table_name="emergency_incidents")
    op.drop_index("idx_emergency_incidents_code", table_name="emergency_incidents")
    op.drop_table("emergency_incidents")
