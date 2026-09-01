from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class Junction(Base, TimestampMixin):
    """Traffic Junction metadata model representing physical road intersections."""

    __tablename__ = "junctions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sector: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="OPTIMAL", nullable=False)
    current_green_time: Mapped[int] = mapped_column(Integer, default=45, nullable=False)
    default_cycle_time: Mapped[int] = mapped_column(Integer, default=90, nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    signal_phase: Mapped[str] = mapped_column(String(50), default="NORTH_SOUTH", nullable=False)
    sensor_health: Mapped[str] = mapped_column(String(50), default="OPTIMAL", nullable=False)
    active_advisory: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    telemetry_records: Mapped[List["TrafficTelemetry"]] = relationship(
        "TrafficTelemetry",
        back_populates="junction",
        cascade="all, delete-orphan",
    )
    alerts: Mapped[List["TrafficAlertModel"]] = relationship(
        "TrafficAlertModel",
        back_populates="junction",
    )


class TrafficTelemetry(Base):
    """Relational observation table for traffic sensor telemetry.

    NOTE: TimescaleDB hypertable evaluation is deferred to Phase 3B production deployment.
    This model establishes the relational schema in Phase 3A/3B PostgreSQL.
    """

    __tablename__ = "traffic_telemetry"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    junction_id: Mapped[int] = mapped_column(
        ForeignKey("junctions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vehicle_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_speed_kmh: Mapped[float] = mapped_column(Float, default=40.0, nullable=False)
    congestion_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    queue_length_meters: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    junction: Mapped["Junction"] = relationship("Junction", back_populates="telemetry_records")

    __table_args__ = (
        Index("idx_telemetry_junction_time", "junction_id", "timestamp"),
    )
