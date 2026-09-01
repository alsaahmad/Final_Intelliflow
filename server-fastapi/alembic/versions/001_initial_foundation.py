"""Initial Phase 3A Foundation Migration (users, user_roles, junctions, traffic_telemetry, system_audit_logs)

Revision ID: 001_initial_foundation
Revises: 
Create Date: 2026-09-01 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial_foundation"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("phone_number", sa.String(length=50), nullable=True),
        sa.Column("badge_number", sa.String(length=100), nullable=True),
        sa.Column("department", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_users_email", "users", ["email"])

    # 2. Create user_roles table
    op.create_table(
        "user_roles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "role", name="uk_user_role"),
    )
    op.create_index("idx_user_roles_role", "user_roles", ["role"])
    op.create_index("idx_user_roles_user_id", "user_roles", ["user_id"])

    # 3. Create junctions table
    op.create_table(
        "junctions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("sector", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=50), server_default="OPTIMAL", nullable=False),
        sa.Column("current_green_time", sa.Integer(), server_default="45", nullable=False),
        sa.Column("default_cycle_time", sa.Integer(), server_default="90", nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("idx_junctions_code", "junctions", ["code"])

    # 4. Create traffic_telemetry table (Relational table; TimescaleDB evaluation deferred to Phase 3B)
    op.create_table(
        "traffic_telemetry",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("junction_id", sa.Integer(), nullable=False),
        sa.Column("vehicle_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("average_speed_kmh", sa.Float(), server_default="40.0", nullable=False),
        sa.Column("congestion_percent", sa.Integer(), server_default="0", nullable=False),
        sa.Column("queue_length_meters", sa.Float(), server_default="0.0", nullable=False),
        sa.ForeignKeyConstraint(["junction_id"], ["junctions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_telemetry_timestamp", "traffic_telemetry", ["timestamp"])
    op.create_index("idx_telemetry_junction_id", "traffic_telemetry", ["junction_id"])
    op.create_index("idx_telemetry_junction_time", "traffic_telemetry", ["junction_id", "timestamp"])

    # 5. Create system_audit_logs table
    op.create_table(
        "system_audit_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=255), nullable=False),
        sa.Column("details", sa.String(length=1000), nullable=True),
        sa.Column("severity", sa.String(length=50), server_default="INFO", nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_audit_logs_user_id", "system_audit_logs", ["user_id"])
    op.create_index("idx_audit_logs_timestamp", "system_audit_logs", ["timestamp"])
    op.create_index("idx_audit_user_action", "system_audit_logs", ["user_id", "action"])


def downgrade() -> None:
    op.drop_index("idx_audit_user_action", table_name="system_audit_logs")
    op.drop_index("idx_audit_logs_timestamp", table_name="system_audit_logs")
    op.drop_index("idx_audit_logs_user_id", table_name="system_audit_logs")
    op.drop_table("system_audit_logs")

    op.drop_index("idx_telemetry_junction_time", table_name="traffic_telemetry")
    op.drop_index("idx_telemetry_junction_id", table_name="traffic_telemetry")
    op.drop_index("idx_telemetry_timestamp", table_name="traffic_telemetry")
    op.drop_table("traffic_telemetry")

    op.drop_index("idx_junctions_code", table_name="junctions")
    op.drop_table("junctions")

    op.drop_index("idx_user_roles_user_id", table_name="user_roles")
    op.drop_index("idx_user_roles_role", table_name="user_roles")
    op.drop_table("user_roles")

    op.drop_index("idx_users_email", table_name="users")
    op.drop_table("users")
