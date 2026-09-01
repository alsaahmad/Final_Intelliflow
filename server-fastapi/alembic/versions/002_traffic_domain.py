"""Phase 3B Traffic Domain Migration (adds junction columns, traffic_alerts table)

Revision ID: 002_traffic_domain
Revises: 001_initial_foundation
Create Date: 2026-09-01 16:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002_traffic_domain"
down_revision: Union[str, None] = "001_initial_foundation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add missing columns to junctions table
    op.add_column("junctions", sa.Column("signal_phase", sa.String(length=50), server_default="NORTH_SOUTH", nullable=False))
    op.add_column("junctions", sa.Column("sensor_health", sa.String(length=50), server_default="OPTIMAL", nullable=False))
    op.add_column("junctions", sa.Column("active_advisory", sa.String(length=255), nullable=True))

    # 2. Create traffic_alerts table
    op.create_table(
        "traffic_alerts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("junction_id", sa.Integer(), nullable=True),
        sa.Column("incident_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("severity", sa.String(length=50), nullable=False),  # LOW, MEDIUM, HIGH, CRITICAL
        sa.Column("category", sa.String(length=50), nullable=False),  # ACCIDENT, WATERLOGGING, ROADWORK, CONGESTION, GREEN_CORRIDOR
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("description", sa.String(length=1000), nullable=False),
        sa.Column("estimated_delay_minutes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("alternate_route_suggested", sa.String(length=255), nullable=True),
        sa.Column("verified_advisory", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("affected_lanes", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.ForeignKeyConstraint(["junction_id"], ["junctions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("idx_traffic_alerts_severity", "traffic_alerts", ["severity"])
    op.create_index("idx_traffic_alerts_active", "traffic_alerts", ["is_active"])
    op.create_index("idx_traffic_alerts_junction_id", "traffic_alerts", ["junction_id"])


def downgrade() -> None:
    op.drop_index("idx_traffic_alerts_junction_id", table_name="traffic_alerts")
    op.drop_index("idx_traffic_alerts_active", table_name="traffic_alerts")
    op.drop_index("idx_traffic_alerts_severity", table_name="traffic_alerts")
    op.drop_table("traffic_alerts")

    op.drop_column("junctions", "active_advisory")
    op.drop_column("junctions", "sensor_health")
    op.drop_column("junctions", "signal_phase")
