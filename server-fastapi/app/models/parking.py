from typing import List, Optional, Any

from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class ParkingFacilityModel(Base, TimestampMixin):
    """SQLAlchemy model for parking facilities."""

    __tablename__ = "parking_facilities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    distance_km: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    distance_display: Mapped[str] = mapped_column(String(50), nullable=False, default="0 m")
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dijkstra_node_id: Mapped[str] = mapped_column(String(50), nullable=False, default="node-cp")
    total_slots: Mapped[int] = mapped_column(Integer, nullable=False, default=24)
    available_slots: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    occupied_slots: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reserved_slots: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    disabled_slots: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    occupancy_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    hourly_rate_inr: Mapped[float] = mapped_column(Float, nullable=False, default=30.0)
    operating_hours: Mapped[str] = mapped_column(String(100), nullable=False, default="24/7 Open")
    ev_charging_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ev_slots_available: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accessible_slots_available: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    levels: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    current_level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    slots: Mapped[List["ParkingSlotModel"]] = relationship(
        "ParkingSlotModel",
        back_populates="facility",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ParkingSlotModel(Base, TimestampMixin):
    """SQLAlchemy model for parking slots."""

    __tablename__ = "parking_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    facility_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("parking_facilities.id", ondelete="CASCADE"), nullable=False, index=True
    )
    slot_code: Mapped[str] = mapped_column(String(50), nullable=False)
    row_name: Mapped[str] = mapped_column(String(10), nullable=False)
    col_number: Mapped[int] = mapped_column(Integer, nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="AVAILABLE")
    slot_type: Mapped[str] = mapped_column(String(50), nullable=False, default="STANDARD")
    hourly_rate: Mapped[float] = mapped_column(Float, nullable=False, default=30.0)
    features: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True, default=list)

    facility: Mapped["ParkingFacilityModel"] = relationship("ParkingFacilityModel", back_populates="slots")
