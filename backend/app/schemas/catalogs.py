from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date, datetime


# ─── AUTH ───────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"


class TokenData(BaseModel):
    username: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    password: str
    is_admin: bool = False


class UserOut(BaseModel):
    user_id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool

    class Config:
        from_attributes = True


# ─── ENTITY TYPES ───────────────────────────────────────────────────────────

class EntityTypeBase(BaseModel):
    type_name: str


class EntityTypeCreate(EntityTypeBase):
    pass


class EntityTypeUpdate(BaseModel):
    type_name: Optional[str] = None
    is_active: Optional[bool] = None


class EntityTypeOut(EntityTypeBase):
    entity_type_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── FINANCING TYPES ─────────────────────────────────────────────────────────

class FinancingTypeBase(BaseModel):
    financing_name: str


class FinancingTypeCreate(FinancingTypeBase):
    pass


class FinancingTypeUpdate(BaseModel):
    financing_name: Optional[str] = None
    is_active: Optional[bool] = None


class FinancingTypeOut(FinancingTypeBase):
    financing_type_id: int
    is_active: bool

    class Config:
        from_attributes = True


# ─── ORDERING OFFICIALS ──────────────────────────────────────────────────────

class OrderingOfficialBase(BaseModel):
    first_name: str
    second_name: Optional[str] = None
    first_surname: str
    second_surname: Optional[str] = None
    identification_type: str
    identification_number: str
    appointment_resolution: Optional[str] = None
    resolution_date: Optional[date] = None
    institutional_email: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("identification_type")
    @classmethod
    def validate_id_type(cls, v):
        allowed = ["CC", "CE", "TI", "PP", "NIT"]
        if v not in allowed:
            raise ValueError(f"Tipo de identificación debe ser uno de: {allowed}")
        return v


class OrderingOfficialCreate(OrderingOfficialBase):
    pass


class OrderingOfficialUpdate(BaseModel):
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    first_surname: Optional[str] = None
    second_surname: Optional[str] = None
    identification_type: Optional[str] = None
    identification_number: Optional[str] = None
    appointment_resolution: Optional[str] = None
    resolution_date: Optional[date] = None
    institutional_email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class OrderingOfficialOut(OrderingOfficialBase):
    official_id: int
    is_active: bool
    created_at: datetime
    full_name: Optional[str] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_fullname(cls, obj):
        data = cls.model_validate(obj)
        parts = [obj.first_name, obj.second_name, obj.first_surname, obj.second_surname]
        data.full_name = " ".join(p for p in parts if p)
        return data


# ─── PROJECT STATUSES ────────────────────────────────────────────────────────

class ProjectStatusBase(BaseModel):
    status_code: str
    status_name: str
    status_color: Optional[str] = None
    status_order: Optional[int] = None
    status_description: Optional[str] = None


class ProjectStatusCreate(ProjectStatusBase):
    pass


class ProjectStatusUpdate(BaseModel):
    status_code: Optional[str] = None
    status_name: Optional[str] = None
    status_color: Optional[str] = None
    status_order: Optional[int] = None
    status_description: Optional[str] = None
    is_active: Optional[bool] = None


class ProjectStatusOut(ProjectStatusBase):
    status_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
