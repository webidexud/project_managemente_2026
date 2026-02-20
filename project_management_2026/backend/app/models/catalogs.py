from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, Numeric, SmallInteger, ForeignKey
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


class ProjectType(Base):
    __tablename__ = "project_types"
    project_type_id = Column(Integer, primary_key=True)
    type_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)


class Project(Base):
    __tablename__ = "projects"
    project_id = Column(Integer, primary_key=True)
    project_year = Column(SmallInteger, nullable=False)
    internal_project_number = Column(SmallInteger, nullable=False)
    external_project_number = Column(String(20))
    project_name = Column(String(800), nullable=False)
    project_purpose = Column(Text, nullable=False)
    entity_id = Column(Integer, ForeignKey("entities.entity_id"), nullable=False)
    executing_department_id = Column(Integer, ForeignKey("executing_departments.department_id"), nullable=False)
    project_status_id = Column(Integer, ForeignKey("project_statuses.status_id"), nullable=False)
    project_type_id = Column(Integer, ForeignKey("project_types.project_type_id"), nullable=False)
    financing_type_id = Column(Integer, ForeignKey("financing_types.financing_type_id"), nullable=False)
    execution_modality_id = Column(Integer, ForeignKey("execution_modalities.execution_modality_id"), nullable=False)
    project_value = Column(Numeric(15, 2), nullable=False)
    accounting_code = Column(String(50))
    institutional_benefit_percentage = Column(Numeric(5, 2), default=12.00)
    institutional_benefit_value = Column(Numeric(15, 2))
    university_contribution = Column(Numeric(15, 2), default=0)
    entity_contribution = Column(Numeric(15, 2))
    beneficiaries_count = Column(Integer)
    subscription_date = Column(Date)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    ordering_official_id = Column(Integer, ForeignKey("ordering_officials.official_id"), nullable=False)
    main_email = Column(String(200))
    administrative_act = Column(String(50))
    secop_link = Column(String(1000))
    observations = Column(Text)
    rup_codes_general_observations = Column(Text)
    session_type = Column(String(50))
    minutes_date = Column(Date)
    minutes_number = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    created_by_user_id = Column(Integer)
    updated_at = Column(DateTime)
    updated_by_user_id = Column(Integer)


class RupCode(Base):
    __tablename__ = "rup_codes"
    rup_code_id      = Column(Integer, primary_key=True)
    rup_code         = Column(String(20), nullable=False)
    code_description = Column(Text)
    segment_code     = Column(String(10))
    segment_name     = Column(String(200))
    family_code      = Column(String(10))
    family_name      = Column(String(200))
    class_code       = Column(String(10))
    class_name       = Column(String(200))
    product_code     = Column(String(10))
    product_name     = Column(String(200))
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime, server_default=func.now())


class ProjectRupCode(Base):
    __tablename__ = "project_rup_codes"
    project_rup_code_id    = Column(Integer, primary_key=True)
    project_year           = Column(SmallInteger, nullable=False)
    internal_project_number= Column(SmallInteger, nullable=False)
    rup_code_id            = Column(Integer, ForeignKey("rup_codes.rup_code_id"), nullable=False)
    is_main_code           = Column(Boolean, default=False)
    assignment_date        = Column(Date)
    assigned_by_user_id    = Column(Integer)
    is_active              = Column(Boolean, default=True)
