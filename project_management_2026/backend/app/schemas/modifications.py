# backend/app/schemas/modifications.py — v4.0
# Eliminados: supervisor_name, supervisor_id, supervisor_entity_name,
#             entity_legal_representative_*, cdp, rp, cdp_value, rp_value del base
# (esos campos viven en sub-tablas: ModificationAssignment, ModificationLiquidation)
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

VALID_TYPES = {
    'ADDITION', 'EXTENSION', 'BOTH', 'CONTRACTUAL',
    'SUSPENSION', 'RESTART',
    'CESION_CESIONARIA', 'CESION_CEDENTE', 'LIQUIDATION'
}


class ModificationBase(BaseModel):
    modification_type:           str
    addition_value:              Optional[Decimal] = None
    extension_days:              Optional[int]     = None
    new_end_date:                Optional[date]    = None
    new_total_value:             Optional[Decimal] = None
    justification:               Optional[str]     = None
    administrative_act:          Optional[str]     = None
    approval_date:               date
    extension_period_text:       Optional[str]     = None
    requires_policy_update:      bool              = False
    policy_update_description:   Optional[str]     = None
    payment_method_modification: Optional[str]     = None
    ordering_official_id:        Optional[int]     = None


class ModificationCreate(ModificationBase):
    pass


class ModificationUpdate(BaseModel):
    modification_type:           Optional[str]     = None
    addition_value:              Optional[Decimal] = None
    extension_days:              Optional[int]     = None
    new_end_date:                Optional[date]    = None
    new_total_value:             Optional[Decimal] = None
    justification:               Optional[str]     = None
    administrative_act:          Optional[str]     = None
    approval_date:               Optional[date]    = None
    extension_period_text:       Optional[str]     = None
    requires_policy_update:      Optional[bool]    = None
    policy_update_description:   Optional[str]     = None
    payment_method_modification: Optional[str]     = None
    ordering_official_id:        Optional[int]     = None


class ModificationOut(ModificationBase):
    modification_id:     int
    project_id:          int
    modification_number: int
    is_active:           bool
    created_at:          datetime
    updated_at:          Optional[datetime] = None

    model_config = {'from_attributes': True}
