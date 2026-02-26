from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

VALID_TYPES = {
    'ADDITION', 'EXTENSION', 'BOTH', 'MODIFICATION',
    'SCOPE', 'SUSPENSION', 'RESTART', 'ASSIGNMENT', 'LIQUIDATION'
}

class ModificationBase(BaseModel):
    modification_type:     str
    addition_value:        Optional[Decimal]  = None
    extension_days:        Optional[int]      = None
    new_end_date:          Optional[date]     = None
    new_total_value:       Optional[Decimal]  = None
    justification:         Optional[str]      = None
    administrative_act:    Optional[str]      = None
    approval_date:         date
    extension_period_text: Optional[str]      = None
    supervisor_name:       Optional[str]      = None
    supervisor_id:         Optional[str]      = None
    supervisor_entity_name:Optional[str]      = None
    cdp:                   Optional[str]      = None
    cdp_value:             Optional[Decimal]  = None
    rp:                    Optional[str]      = None
    rp_value:              Optional[Decimal]  = None
    requires_policy_update:              bool = False
    policy_update_description:           Optional[str] = None
    payment_method_modification:         Optional[str] = None
    entity_legal_representative_name:    Optional[str] = None
    entity_legal_representative_id:      Optional[str] = None
    entity_legal_representative_id_type: Optional[str] = None
    ordering_official_id:  Optional[int]     = None

class ModificationCreate(ModificationBase):
    pass

class ModificationUpdate(BaseModel):
    modification_type:     Optional[str]     = None
    addition_value:        Optional[Decimal] = None
    extension_days:        Optional[int]     = None
    new_end_date:          Optional[date]    = None
    new_total_value:       Optional[Decimal] = None
    justification:         Optional[str]     = None
    administrative_act:    Optional[str]     = None
    approval_date:         Optional[date]    = None
    extension_period_text: Optional[str]     = None
    supervisor_name:       Optional[str]     = None
    supervisor_id:         Optional[str]     = None
    supervisor_entity_name:Optional[str]     = None
    cdp:                   Optional[str]     = None
    cdp_value:             Optional[Decimal] = None
    rp:                    Optional[str]     = None
    rp_value:              Optional[Decimal] = None
    requires_policy_update:              Optional[bool] = None
    policy_update_description:           Optional[str]  = None
    payment_method_modification:         Optional[str]  = None
    entity_legal_representative_name:    Optional[str]  = None
    entity_legal_representative_id:      Optional[str]  = None
    entity_legal_representative_id_type: Optional[str]  = None
    ordering_official_id:  Optional[int]    = None

class ModificationOut(ModificationBase):
    modification_id:     int
    project_id:          int
    modification_number: int
    is_active:           bool
    created_at:          datetime
    updated_at:          Optional[datetime] = None

    model_config = {'from_attributes': True}
