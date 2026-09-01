"""Phase 3C Parking and Complaints Migration

Revision ID: 003_parking_complaints
Revises: 002_traffic_domain
Create Date: 2026-09-02 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003_parking_complaints"
down_revision: Union[str, None] = "002_traffic_domain"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create parking_facilities table
    op.create_table(
        "parking_facilities",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("distance_km", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("distance_display", sa.String(length=50), nullable=False, server_default="0 m"),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("dijkstra_node_id", sa.String(length=50), nullable=False, server_default="node-cp"),
        sa.Column("total_slots", sa.Integer(), nullable=False, server_default="24"),
        sa.Column("available_slots", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("occupied_slots", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reserved_slots", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("disabled_slots", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("occupancy_percent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("hourly_rate_inr", sa.Float(), nullable=False, server_default="30.0"),
        sa.Column("operating_hours", sa.String(length=100), nullable=False, server_default="24/7 Open"),
        sa.Column("ev_charging_available", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("ev_slots_available", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("accessible_slots_available", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("levels", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("current_level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("idx_parking_facilities_code", "parking_facilities", ["code"])

    # 2. Create parking_slots table
    op.create_table(
        "parking_slots",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("facility_id", sa.Integer(), nullable=False),
        sa.Column("slot_code", sa.String(length=50), nullable=False),
        sa.Column("row_name", sa.String(length=10), nullable=False),
        sa.Column("col_number", sa.Integer(), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="AVAILABLE"),
        sa.Column("slot_type", sa.String(length=50), nullable=False, server_default="STANDARD"),
        sa.Column("hourly_rate", sa.Float(), nullable=False, server_default="30.0"),
        sa.Column("features", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.ForeignKeyConstraint(["facility_id"], ["parking_facilities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_parking_slots_facility_id", "parking_slots", ["facility_id"])
    op.create_index("idx_parking_slots_status", "parking_slots", ["status"])

    # 3. Create citizen_complaints table
    op.create_table(
        "citizen_complaints",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("urgency", sa.String(length=50), nullable=False, server_default="MEDIUM"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="PENDING"),
        sa.Column("assigned_department", sa.String(length=255), nullable=False),
        sa.Column("reported_by_id", sa.Integer(), nullable=True),
        sa.Column("reported_by_name", sa.String(length=255), nullable=False, server_default="Verified Citizen"),
        sa.Column("description", sa.String(length=1000), nullable=False),
        sa.Column("estimated_resolution_hours", sa.Integer(), nullable=False, server_default="24"),
        sa.Column("remarks", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["reported_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("idx_complaints_code", "citizen_complaints", ["code"])
    op.create_index("idx_complaints_status", "citizen_complaints", ["status"])
    op.create_index("idx_complaints_category", "citizen_complaints", ["category"])


def downgrade() -> None:
    op.drop_index("idx_complaints_category", table_name="citizen_complaints")
    op.drop_index("idx_complaints_status", table_name="citizen_complaints")
    op.drop_index("idx_complaints_code", table_name="citizen_complaints")
    op.drop_table("citizen_complaints")

    op.drop_index("idx_parking_slots_status", table_name="parking_slots")
    op.drop_index("idx_parking_slots_facility_id", table_name="parking_slots")
    op.drop_table("parking_slots")

    op.drop_index("idx_parking_facilities_code", table_name="parking_facilities")
    op.drop_table("parking_facilities")
