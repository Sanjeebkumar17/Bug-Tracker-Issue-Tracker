from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.tag import ticket_tags

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(Integer, nullable=False)
    key = Column(String(20), unique=True, index=True, nullable=False)  # e.g. PROJ-1
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(20), default="bug", nullable=False)  # bug, task, feature
    priority = Column(String(20), default="medium", nullable=False)  # low, medium, high, urgent
    status = Column(String(20), default="todo", nullable=False)  # todo, in_progress, in_review, done
    
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True)
    story_points = Column(Integer, nullable=True)
    estimated_hours = Column(Float, nullable=True)
    
    order_index = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", back_populates="tickets")
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reported_tickets")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tickets")
    sprint = relationship("Sprint", back_populates="tickets")
    tags = relationship("Tag", secondary=ticket_tags, back_populates="tickets")
    comments = relationship("Comment", back_populates="ticket", cascade="all, delete-orphan", order_by="Comment.created_at")
    attachments = relationship("Attachment", back_populates="ticket", cascade="all, delete-orphan")
    activities = relationship("ActivityLog", back_populates="ticket", cascade="all, delete-orphan", order_by="desc(ActivityLog.created_at)")
    worklogs = relationship("WorkLog", back_populates="ticket", cascade="all, delete-orphan", order_by="desc(WorkLog.created_at)")
