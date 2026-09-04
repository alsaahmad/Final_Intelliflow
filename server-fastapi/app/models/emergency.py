from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


class EmergencyIncidentModel(Base, TimestampMixin):
    """SQLAlchemy model for citizen 112 emergency distress incidents (DEMO/SIMULATION)."""

    __tablename__ = "emergency_incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    citizen_name: Mapped[str] = mapped_column(
        String(255), nullable=False, default="Verified Citizen (DEMO - Masked)"
    )
    citizen_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    priority: Mapped[str] = mapped_column(String(50), nullable=False, default="CODE_RED_112")
    assigned_unit: Mapped[str] = mapped_column(
        String(255), nullable=False, default="EMS-ALPHA-07 (ALS Unit)"
    )
    destination_hospital: Mapped[str] = mapped_column(
        String(255), nullable=False, default="City General Trauma Center (H01)"
    )
    eta_minutes: Mapped[float] = mapped_column(Float, nullable=False, default=3.8)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="DISPATCHED", index=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class GreenCorridorModel(Base, TimestampMixin):
    """SQLAlchemy model for priority emergency green corridor requests (DEMO/SIMULATION)."""

    __tablename__ = "green_corridors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    assigned_unit: Mapped[str] = mapped_column(String(255), nullable=False)
    corridor_route: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="ACTIVE", index=True)
    eta_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=6)
    signals_cleared: Mapped[str] = mapped_column(String(50), nullable=False, default="4/5")
    speed_kmh: Mapped[int] = mapped_column(Integer, nullable=False, default=68)
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
