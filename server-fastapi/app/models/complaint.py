from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


class CitizenComplaintModel(Base, TimestampMixin):
    """SQLAlchemy model for citizen complaints."""

    __tablename__ = "citizen_complaints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    urgency: Mapped[str] = mapped_column(String(50), nullable=False, default="MEDIUM")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PENDING", index=True)
    assigned_department: Mapped[str] = mapped_column(String(255), nullable=False)
    reported_by_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reported_by_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Verified Citizen")
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    estimated_resolution_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=24)
    remarks: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
