from sqlalchemy import Column, Integer, SmallInteger, String, Numeric, Date, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base   # ← import correcto igual que catalogs.py


class ProjectModification(Base):
    __tablename__ = 'project_modifications'

    modification_id       = Column(Integer, primary_key=True)
    project_id            = Column(Integer, ForeignKey('projects.project_id', ondelete='CASCADE'), nullable=False)
    modification_number   = Column(SmallInteger, nullable=False)
    modification_type     = Column(String(20), nullable=False)
    addition_value        = Column(Numeric(15, 2))
    extension_days        = Column(Integer)
    new_end_date          = Column(Date)
    new_total_value       = Column(Numeric(15, 2))
    justification         = Column(Text)
    administrative_act    = Column(String(50))
    approval_date         = Column(Date)
    created_by_user_id    = Column(Integer)
    created_at            = Column(DateTime, server_default=func.now(), nullable=False)
    is_active             = Column(Boolean, default=True, nullable=False)
    extension_period_text = Column(String(200))
    supervisor_name       = Column(String(200))
    supervisor_id         = Column(String(50))
    supervisor_entity_name= Column(String(200))
    cdp                   = Column(String(100))
    cdp_value             = Column(Numeric(15, 2))
    rp                    = Column(String(100))
    rp_value              = Column(Numeric(15, 2))
    requires_policy_update        = Column(Boolean, default=False)
    policy_update_description     = Column(Text)
    payment_method_modification   = Column(Text)
    updated_at            = Column(DateTime)
    updated_by_user_id    = Column(Integer)
    entity_legal_representative_name    = Column(String(200))
    entity_legal_representative_id      = Column(String(50))
    entity_legal_representative_id_type = Column(String(10))
    ordering_official_id  = Column(Integer, ForeignKey('ordering_officials.official_id'))
