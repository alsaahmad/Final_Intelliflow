from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, DateTime, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class TrafficAlertModel(Base, TimestampMixin):
    """Traffic Alert & Advisory entity model supporting Citizen UI alerts."""

    __tablename__ = "traffic_alerts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    junction_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("junctions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    incident_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # ACCIDENT, WATERLOGGING, ROADWORK, CONGESTION, GREEN_CORRIDOR
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    estimated_delay_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    alternate_route_suggested: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    verified_advisory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    affected_lanes: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    junction: Mapped[Optional["Junction"]] = relationship("Junction", back_populates="alerts")

    __table_args__ = (
        Index("idx_traffic_alerts_active_severity", "is_active", "severity"),
    )
