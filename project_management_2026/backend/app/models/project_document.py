# backend/app/models/project_document.py
from sqlalchemy import Column, Integer, SmallInteger, String, Text, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


class ProjectDocumentType(Base):
    __tablename__ = "project_document_types"

    document_type_id = Column(Integer, primary_key=True)
    type_code        = Column(String(10), nullable=False, unique=True)
    type_name        = Column(String(100), nullable=False)
    type_description = Column(Text)
    is_active        = Column(Boolean, default=True, nullable=False)


class ProjectDocument(Base):
    __tablename__ = "project_documents"

    document_id              = Column(Integer, primary_key=True)
    project_year             = Column(SmallInteger, nullable=False)
    internal_project_number  = Column(SmallInteger, nullable=False)
    document_number          = Column(Integer, nullable=False)
    document_type_id         = Column(Integer, ForeignKey("project_document_types.document_type_id"), nullable=False)
    document_name            = Column(String(200), nullable=False)
    document_description     = Column(Text)
    document_date            = Column(Date)
    file_path                = Column(String(300))
    original_filename        = Column(String(200))
    file_extension           = Column(String(10))
    file_size                = Column(Integer)
    is_minutes               = Column(Boolean, default=False)
    minutes_number           = Column(Integer)
    document_status          = Column(String(20), default='ACTIVE')
    signature_date           = Column(Date)
    document_version         = Column(SmallInteger, default=1)
    observations             = Column(Text)
    is_confidential          = Column(Boolean, default=False)
    is_active                = Column(Boolean, default=True, nullable=False)
    created_at               = Column(DateTime, server_default=func.now(), nullable=False)
    created_by_user_id       = Column(Integer)
    updated_at               = Column(DateTime)
    updated_by_user_id       = Column(Integer)
