# backend/app/models/project_tracking.py
from sqlalchemy import Column, Integer, SmallInteger, String, Boolean, DateTime, Date, Text, Numeric, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


class ProjectTracking(Base):
    __tablename__ = "project_tracking"
    __table_args__ = {"extend_existing": True}

    tracking_id               = Column(Integer, primary_key=True)
    project_id                = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    cut_date                  = Column(Date, nullable=False)
    tracking_number           = Column(SmallInteger, nullable=False, default=1)

    # Estado y ejecución
    current_status            = Column(String(50))
    physical_progress_pct     = Column(Numeric(5, 2))
    financial_progress_pct    = Column(Numeric(5, 2))

    # Financiero
    initial_value             = Column(Numeric(15, 2))
    addition_value            = Column(Numeric(15, 2), default=0)
    total_value               = Column(Numeric(15, 2))
    total_disbursements       = Column(Numeric(15, 2), default=0)
    current_balance           = Column(Numeric(15, 2))
    total_pending             = Column(Numeric(15, 2))
    idexud_loans              = Column(Numeric(15, 2), default=0)
    payments_made             = Column(Numeric(15, 2), default=0)
    pending_payments          = Column(Numeric(15, 2), default=0)

    # Aportes
    entity_cash               = Column(Numeric(15, 2), default=0)
    entity_kind               = Column(Numeric(15, 2), default=0)
    entity_na                 = Column(Numeric(15, 2), default=0)
    ud_cash                   = Column(Numeric(15, 2), default=0)
    ud_kind                   = Column(Numeric(15, 2), default=0)
    ud_na                     = Column(Numeric(15, 2), default=0)

    # Diálogo seguimiento
    advances_description      = Column(Text)
    difficulties_description  = Column(Text)
    pending_activities        = Column(Text)
    financial_observations    = Column(Text)
    modification_observations = Column(Text)
    general_observations      = Column(Text)
    risks_alerts              = Column(Text)

    is_active                 = Column(Boolean, default=True)
    created_at                = Column(DateTime, server_default=func.now())
    created_by_user_id        = Column(Integer)
    updated_at                = Column(DateTime)
    updated_by_user_id        = Column(Integer)


class TrackingPersonnel(Base):
    __tablename__ = "tracking_personnel"
    __table_args__ = {"extend_existing": True}

    personnel_id        = Column(Integer, primary_key=True)
    project_id          = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    role                = Column(String(30), nullable=False)  # SUPERVISOR|DIRECTOR|COORDINADOR|ADMINISTRATIVO
    full_name           = Column(String(200), nullable=False)
    resolution_contract = Column(String(100))
    email               = Column(String(200))
    phone               = Column(String(50))
    is_current          = Column(Boolean, default=True)
    start_date          = Column(Date)
    end_date            = Column(Date)
    observations        = Column(Text)
    is_active           = Column(Boolean, default=True)
    created_at          = Column(DateTime, server_default=func.now())
    created_by_user_id  = Column(Integer)
    updated_at          = Column(DateTime)
    updated_by_user_id  = Column(Integer)


class TrackingInvoice(Base):
    __tablename__ = "tracking_invoices"
    __table_args__ = {"extend_existing": True}

    invoice_id          = Column(Integer, primary_key=True)
    project_id          = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    disbursement_number = Column(SmallInteger, nullable=False)
    invoice_number      = Column(String(100))
    invoice_date        = Column(Date)
    invoice_value       = Column(Numeric(15, 2))
    status              = Column(String(20), default='PENDIENTE')  # PAGADA|PENDIENTE|EN_REVISION
    payment_date        = Column(Date)
    observations        = Column(Text)
    is_active           = Column(Boolean, default=True)
    created_at          = Column(DateTime, server_default=func.now())
    created_by_user_id  = Column(Integer)
    updated_at          = Column(DateTime)
    updated_by_user_id  = Column(Integer)


class TrackingReport(Base):
    __tablename__ = "tracking_reports"
    __table_args__ = {"extend_existing": True}

    report_id               = Column(Integer, primary_key=True)
    project_id              = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    report_number           = Column(SmallInteger, nullable=False)
    cut_percentage          = Column(Numeric(5, 2))
    delivery_date           = Column(Date)
    deliverable_description = Column(Text)
    status                  = Column(String(20), default='EN_REVISION')  # APROBADO|EN_REVISION|DEVUELTO
    observations            = Column(Text)
    is_active               = Column(Boolean, default=True)
    created_at              = Column(DateTime, server_default=func.now())
    created_by_user_id      = Column(Integer)
    updated_at              = Column(DateTime)
    updated_by_user_id      = Column(Integer)
