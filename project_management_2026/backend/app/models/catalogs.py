from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


class EntityType(Base):
    __tablename__ = "entity_types"
    entity_type_id = Column(Integer, primary_key=True)
    type_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    created_by_user_id = Column(Integer)


class Entity(Base):
    __tablename__ = "entities"
    entity_id = Column(Integer, primary_key=True)
    entity_name = Column(String(255), nullable=False)
    tax_id = Column(String(100), nullable=False)
    entity_type_id = Column(Integer, ForeignKey("entity_types.entity_type_id"))
    main_address = Column(String(200))
    main_phone = Column(String(100))
    institutional_email = Column(String(200))
    website = Column(String(200))
    main_contact = Column(String(100))
    contact_position = Column(String(100))
    contact_phone = Column(String(50))
    contact_email = Column(String(200))
    last_update_date = Column(Date)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    created_by_user_id = Column(Integer)
    updated_at = Column(DateTime)
    updated_by_user_id = Column(Integer)


class ExecutingDepartment(Base):
    __tablename__ = "executing_departments"
    department_id = Column(Integer, primary_key=True)
    department_name = Column(String(200), nullable=False)
    website = Column(String(200))
    address = Column(String(200))
    phone = Column(String(50))
    email = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    created_by_user_id = Column(Integer)
    updated_at = Column(DateTime)
    updated_by_user_id = Column(Integer)


class ExecutionModality(Base):
    __tablename__ = "execution_modalities"
    execution_modality_id = Column(Integer, primary_key=True)
    modality_name = Column(String(100), nullable=False)
    modality_description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    created_by_user_id = Column(Integer)
    updated_at = Column(DateTime)
    updated_by_user_id = Column(Integer)


class FinancingType(Base):
    __tablename__ = "financing_types"
    financing_type_id = Column(Integer, primary_key=True)
    financing_name = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)


class OrderingOfficial(Base):
    __tablename__ = "ordering_officials"
    official_id = Column(Integer, primary_key=True)
    first_name = Column(String(100), nullable=False)
    second_name = Column(String(100))
    first_surname = Column(String(100), nullable=False)
    second_surname = Column(String(100))
    identification_type = Column(String(10))
    identification_number = Column(String(50))
    appointment_resolution = Column(String(100))
    resolution_date = Column(Date)
    institutional_email = Column(String(200))
    phone = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime)


class ProjectStatus(Base):
    __tablename__ = "project_statuses"
    status_id = Column(Integer, primary_key=True)
    status_code = Column(String(20), nullable=False)
    status_name = Column(String(100), nullable=False)
    status_color = Column(String(20))
    status_order = Column(Integer)
    status_description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
