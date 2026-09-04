from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


class InfrastructureProjectModel(Base, TimestampMixin):
    """SQLAlchemy model for municipal capital infrastructure projects (DEMO/SIMULATION)."""

    __tablename__ = "infrastructure_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    project_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(255), nullable=False)
    contractor: Mapped[str] = mapped_column(String(255), nullable=False)
    progress_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    budget_crores: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="IN_PROGRESS", index=True)
    estimated_completion: Mapped[str] = mapped_column(String(100), nullable=False, default="Q4 2026")
    timeline: Mapped[str] = mapped_column(String(100), nullable=False, default="2026")
    traffic_diversion_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class RoadApprovalModel(Base, TimestampMixin):
    """SQLAlchemy model for road work permits and utility closure approvals (DEMO/SIMULATION)."""

    __tablename__ = "road_approvals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    proposed_by: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    closure_duration: Mapped[str] = mapped_column(String(100), nullable=False)
    estimated_delay_mins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    traffic_impact_level: Mapped[str] = mapped_column(String(50), nullable=False, default="MODERATE")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PENDING", index=True)
    comments: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
