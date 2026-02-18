from sqlalchemy import Boolean, Column, Integer, String, DateTime, Date, Numeric, Text, SmallInteger
from sqlalchemy.sql import func
from app.db.database import Base


class EntityType(Base):
    __tablename__ = "entity_types"

    entity_type_id = Column(Integer, primary_key=True, index=True)
    type_name = Column(String(100), nullable=False, unique=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    created_by_user_id = Column(Integer)


class FinancingType(Base):
    __tablename__ = "financing_types"

    financing_type_id = Column(Integer, primary_key=True, index=True)
    financing_name = Column(String(100), nullable=False, unique=True)
    is_active = Column(Boolean, default=True, nullable=False)


class OrderingOfficial(Base):
    __tablename__ = "ordering_officials"

    official_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    second_name = Column(String(50))
    first_surname = Column(String(50), nullable=False)
    second_surname = Column(String(50))
    identification_type = Column(String(10), nullable=False)
    identification_number = Column(String(20), nullable=False)
    appointment_resolution = Column(String(50))
    resolution_date = Column(Date)
    institutional_email = Column(String(200))
    phone = Column(String(50))
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    created_by_user_id = Column(Integer)
    updated_at = Column(DateTime)
    updated_by_user_id = Column(Integer)


class ProjectStatus(Base):
    __tablename__ = "project_statuses"

    status_id = Column(Integer, primary_key=True, index=True)
    status_code = Column(String(10), nullable=False, unique=True)
    status_name = Column(String(100), nullable=False, unique=True)
    status_color = Column(String(7))
    status_order = Column(Integer)
    status_description = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    created_by_user_id = Column(Integer)


# Tabla de usuarios del sistema (administradores del SIEXUD)
class AppUser(Base):
    __tablename__ = "app_users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(200), nullable=False, unique=True)
    full_name = Column(String(200))
    hashed_password = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
