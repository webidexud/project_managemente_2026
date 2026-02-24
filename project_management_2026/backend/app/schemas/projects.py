from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class ProjectTypeOut(BaseModel):
    project_type_id: int
    type_name: str
    is_active: bool
    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    project_id: int
    project_year: int
    internal_project_number: int
    external_project_number: Optional[str] = None
    project_name: str
    project_purpose: str
    entity_id: int
    entity_name: Optional[str] = None
    executing_department_id: int
    department_name: Optional[str] = None
    project_status_id: int
    status_name: Optional[str] = None
    status_color: Optional[str] = None
    project_type_id: int
    type_name: Optional[str] = None
    financing_type_id: int
    financing_name: Optional[str] = None
    execution_modality_id: int
    modality_name: Optional[str] = None
    project_value: Decimal
    accounting_code: Optional[str] = None
    institutional_benefit_percentage: Optional[Decimal] = None
    institutional_benefit_value: Optional[Decimal] = None
    university_contribution: Optional[Decimal] = None
    entity_contribution: Optional[Decimal] = None
    beneficiaries_count: Optional[int] = None
    subscription_date: Optional[date] = None
    start_date: date
    end_date: date
    ordering_official_id: int
    official_name: Optional[str] = None
    main_email: Optional[str] = None
    administrative_act: Optional[str] = None
    secop_link: Optional[str] = None
    observations: Optional[str] = None
    rup_codes_general_observations: Optional[str] = None
    session_type: Optional[str] = None
    minutes_date: Optional[date] = None
    minutes_number: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    project_year: int
    # internal_project_number se genera automáticamente en el backend
    external_project_number: Optional[str] = None
    project_name: str
    project_purpose: str
    entity_id: int
    executing_department_id: int
    project_status_id: int
    project_type_id: int
    financing_type_id: int
    execution_modality_id: int
    project_value: Decimal
    accounting_code: Optional[str] = None
    institutional_benefit_percentage: Optional[Decimal] = Decimal("12.00")
    institutional_benefit_value: Optional[Decimal] = None
    university_contribution: Optional[Decimal] = Decimal("0")
    entity_contribution: Optional[Decimal] = None
    beneficiaries_count: Optional[int] = None
    subscription_date: Optional[date] = None
    start_date: date
    end_date: date
    ordering_official_id: int
    main_email: Optional[str] = None
    administrative_act: Optional[str] = None
    secop_link: Optional[str] = None
    observations: Optional[str] = None
    rup_codes_general_observations: Optional[str] = None
    session_type: Optional[str] = None
    minutes_date: Optional[date] = None
    minutes_number: Optional[str] = None

    @field_validator('end_date')
    @classmethod
    def end_after_start(cls, v, info):
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('La fecha de fin debe ser posterior a la fecha de inicio')
        return v

    @field_validator('project_value')
    @classmethod
    def value_positive(cls, v):
        if v <= 0:
            raise ValueError('El valor del proyecto debe ser mayor a 0')
        return v


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    project_purpose: Optional[str] = None
    external_project_number: Optional[str] = None
    entity_id: Optional[int] = None
    executing_department_id: Optional[int] = None
    project_status_id: Optional[int] = None
    project_type_id: Optional[int] = None
    financing_type_id: Optional[int] = None
    execution_modality_id: Optional[int] = None
    project_value: Optional[Decimal] = None
    accounting_code: Optional[str] = None
    institutional_benefit_percentage: Optional[Decimal] = None
    institutional_benefit_value: Optional[Decimal] = None
    university_contribution: Optional[Decimal] = None
    entity_contribution: Optional[Decimal] = None
    beneficiaries_count: Optional[int] = None
    subscription_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    ordering_official_id: Optional[int] = None
    main_email: Optional[str] = None
    administrative_act: Optional[str] = None
    secop_link: Optional[str] = None
    observations: Optional[str] = None
    rup_codes_general_observations: Optional[str] = None
    session_type: Optional[str] = None
    minutes_date: Optional[date] = None
    minutes_number: Optional[str] = None


# ── RUP ──────────────────────────────────────────────────────────────
class RupCodeOut(BaseModel):
    rup_code_id: int
    rup_code: str
    code_description: str
    segment_code: Optional[str] = None
    segment_name: Optional[str] = None
    family_code: Optional[str] = None
    family_name: Optional[str] = None
    class_code: Optional[str] = None
    class_name: Optional[str] = None
    product_code: Optional[str] = None
    product_name: Optional[str] = None
    model_config = {"from_attributes": True}

class RupSegment(BaseModel):
    segment_code: str
    segment_name: str

class RupFamily(BaseModel):
    family_code: str
    family_name: str

class RupClass(BaseModel):
    class_code: str
    class_name: str

class ProjectRupCodeOut(BaseModel):
    project_rup_code_id: int
    rup_code_id: int
    rup_code: str
    product_name: Optional[str] = None
    class_name: Optional[str] = None
    family_name: Optional[str] = None
    segment_name: Optional[str] = None
    is_main_code: bool
    is_active: bool
    model_config = {"from_attributes": True}

class ProjectRupAssign(BaseModel):
    rup_code_id: int
    is_main_code: bool = False

class ProjectRupBulk(BaseModel):
    codes: list[ProjectRupAssign]


# ── Correos secundarios ───────────────────────────────────────────────
class SecondaryEmailCreate(BaseModel):
    email:            str
    contact_type:     Optional[str] = None
    contact_name:     Optional[str] = None
    contact_position: Optional[str] = None
    contact_phone:    Optional[str] = None
    observations:     Optional[str] = None

class SecondaryEmailUpdate(BaseModel):
    email:            Optional[str] = None
    contact_type:     Optional[str] = None
    contact_name:     Optional[str] = None
    contact_position: Optional[str] = None
    contact_phone:    Optional[str] = None
    observations:     Optional[str] = None

class SecondaryEmailOut(BaseModel):
    secondary_email_id: int
    project_id:         int
    email:              str
    contact_type:       Optional[str] = None
    contact_name:       Optional[str] = None
    contact_position:   Optional[str] = None
    contact_phone:      Optional[str] = None
    observations:       Optional[str] = None
    is_active:          bool
    model_config = {"from_attributes": True}
