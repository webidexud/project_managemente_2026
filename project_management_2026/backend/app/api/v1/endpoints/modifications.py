"""
Endpoints para modificaciones de proyectos - v3.0
ARCHIVO NUEVO: backend/app/api/v1/endpoints/modifications.py
Registrar en router.py (ver INSTRUCCIONES.md)
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.db.database import get_db
from app.models.catalogs import Project

# Importar desde el archivo de modelos existente
from app.models.project_modification import (
    ProjectModification,
    ModificationSuspension,
    ModificationAssignment,
    ModificationClauseChange,
    ModificationLiquidation,
)
from app.schemas.projects import (
    ModificationCreate, SuspensionCreate, SuspensionRestartPatch,
    ClauseChangeCreate, AssignmentCreate, LiquidationCreate
)

router = APIRouter(tags=["Modificaciones"])

VALID_TYPES = {
    'ADDITION', 'EXTENSION', 'BOTH', 'CONTRACTUAL',
    'SUSPENSION', 'RESTART',
    'CESION_CESIONARIA', 'CESION_CEDENTE', 'LIQUIDATION'
}


def next_mod_number(db: Session, project_id: int) -> int:
    from sqlalchemy import func
    mx = db.query(func.max(ProjectModification.modification_number)) \
        .filter(ProjectModification.project_id == project_id).scalar()
    return (mx or 0) + 1


def enrich_mod(m, db):
    d = {
        "modification_id": m.modification_id,
        "project_id": m.project_id,
        "modification_number": m.modification_number,
        "modification_type": m.modification_type,
        "addition_value": float(m.addition_value) if m.addition_value else None,
        "extension_days": m.extension_days,
        "new_end_date": str(m.new_end_date) if m.new_end_date else None,
        "new_total_value": float(m.new_total_value) if m.new_total_value else None,
        "justification": m.justification,
        "administrative_act": m.administrative_act,
        "approval_date": str(m.approval_date) if m.approval_date else None,
        "extension_period_text": m.extension_period_text,
        "requires_policy_update": m.requires_policy_update,
        "policy_update_description": m.policy_update_description,
        "payment_method_modification": m.payment_method_modification,
        "is_active": m.is_active,
        "created_at": str(m.created_at) if m.created_at else None,
        "suspension_start_date": None,
        "suspension_end_date": None,
    }
    if m.modification_type == 'SUSPENSION':
        sus = db.query(ModificationSuspension) \
            .filter(ModificationSuspension.modification_id == m.modification_id).first()
        if sus:
            d["suspension_start_date"] = str(sus.suspension_start_date)
            d["suspension_end_date"]   = str(sus.suspension_end_date)
    return d


@router.get("/projects/{project_id}/modifications/")
def list_modifications(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(404, "Proyecto no encontrado")
    mods = db.query(ProjectModification) \
        .filter(ProjectModification.project_id == project_id) \
        .order_by(ProjectModification.modification_number).all()
    return [enrich_mod(m, db) for m in mods]


@router.post("/projects/{project_id}/modifications/")
def create_modification(project_id: int, data: ModificationCreate, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(404, "Proyecto no encontrado")
    if data.modification_type not in VALID_TYPES:
        raise HTTPException(400, f"Tipo inválido: {data.modification_type}")

    obj = ProjectModification(
        project_id=project_id,
        modification_number=next_mod_number(db, project_id),
        modification_type=data.modification_type,
        approval_date=data.approval_date,
        administrative_act=data.administrative_act,
        justification=data.justification,
        addition_value=data.addition_value,
        extension_days=data.extension_days,
        new_end_date=data.new_end_date,
        new_total_value=data.new_total_value,
        extension_period_text=data.extension_period_text,
        requires_policy_update=data.requires_policy_update,
        policy_update_description=data.policy_update_description,
        payment_method_modification=data.payment_method_modification,
        ordering_official_id=data.ordering_official_id,
        is_active=True,
    )
    db.add(obj)

    if data.modification_type in ('EXTENSION', 'BOTH') and data.new_end_date:
        proj.end_date = data.new_end_date
        proj.updated_at = date.today()

    db.commit()
    db.refresh(obj)
    return enrich_mod(obj, db)


@router.post("/modifications/{mod_id}/suspension")
def add_suspension(mod_id: int, data: SuspensionCreate, db: Session = Depends(get_db)):
    mod = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not mod:
        raise HTTPException(404, "Modificacion no encontrada")
    sus = ModificationSuspension(
        modification_id=mod_id,
        suspension_start_date=data.suspension_start_date,
        suspension_end_date=data.suspension_end_date,
        planned_restart_date=data.planned_restart_date,
        contractor_justification=data.contractor_justification,
        supervisor_justification=data.supervisor_justification,
        entity_supervisor_name=data.entity_supervisor_name,
        entity_supervisor_id=data.entity_supervisor_id,
        suspension_status='ACTIVE',
    )
    db.add(sus)
    db.commit()
    db.refresh(sus)
    return {"ok": True, "suspension_id": sus.suspension_id}


@router.patch("/modifications/suspensions/{suspension_id}/restart")
def restart_suspension(suspension_id: int, data: SuspensionRestartPatch, db: Session = Depends(get_db)):
    sus = db.query(ModificationSuspension) \
        .filter(ModificationSuspension.suspension_id == suspension_id).first()
    if not sus:
        raise HTTPException(404, "Suspension no encontrada")
    sus.actual_restart_date     = data.actual_restart_date
    sus.restart_modification_id = data.restart_modification_id
    sus.suspension_status       = 'RESTARTED'
    db.commit()
    return {"ok": True}


@router.post("/modifications/{mod_id}/clause")
def add_clause_change(mod_id: int, data: ClauseChangeCreate, db: Session = Depends(get_db)):
    mod = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not mod:
        raise HTTPException(404, "Modificacion no encontrada")
    obj = ModificationClauseChange(
        modification_id=mod_id,
        clause_number=data.clause_number or '1',
        clause_name=data.clause_name or 'Modificacion contractual',
        new_clause_text=data.new_clause_text or data.modification_description,
        modification_description=data.modification_description,
        requires_resource_liberation=data.requires_resource_liberation,
        cdp_to_release=data.cdp_to_release,
        rp_to_release=data.rp_to_release,
        liberation_amount=data.liberation_amount,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {"ok": True, "clause_change_id": obj.clause_change_id}


@router.post("/modifications/{mod_id}/assignment")
def add_assignment(mod_id: int, data: AssignmentCreate, db: Session = Depends(get_db)):
    mod = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not mod:
        raise HTTPException(404, "Modificacion no encontrada")
    obj = ModificationAssignment(
        modification_id=mod_id,
        assignment_type=data.assignment_type,
        assignor_name=data.assignor_name,
        assignor_id=data.assignor_id,
        assignor_id_type=data.assignor_id_type,
        assignee_name=data.assignee_name,
        assignee_id=data.assignee_id,
        assignee_id_type=data.assignee_id_type,
        assignment_date=data.assignment_date,
        assignment_signature_date=data.assignment_signature_date,
        value_to_assign=data.value_to_assign,
        value_paid_to_assignor=data.value_paid_to_assignor,
        value_pending_to_assignor=data.value_pending_to_assignor,
        cdp=data.cdp,
        rp=data.rp,
        guarantee_modification_request=data.guarantee_modification_request,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {"ok": True, "assignment_id": obj.assignment_id}


@router.post("/modifications/{mod_id}/liquidation")
def add_liquidation(mod_id: int, data: LiquidationCreate, db: Session = Depends(get_db)):
    mod = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not mod:
        raise HTTPException(404, "Modificacion no encontrada")
    obj = ModificationLiquidation(
        modification_id=mod_id,
        liquidation_type=data.liquidation_type,
        execution_percentage=data.execution_percentage,
        executed_value=data.executed_value,
        pending_payment_value=data.pending_payment_value,
        value_to_release=data.value_to_release,
        cdp=data.cdp,
        cdp_value=data.cdp_value,
        rp=data.rp,
        rp_value=data.rp_value,
        initial_contract_value=data.initial_contract_value,
        final_value_with_additions=data.final_value_with_additions,
        resolution_number=data.resolution_number,
        resolution_date=data.resolution_date,
        unilateral_cause=data.unilateral_cause,
        cause_analysis=data.cause_analysis,
        liquidation_date=data.liquidation_date,
        liquidation_signature_date=data.liquidation_signature_date,
        supervisor_liquidation_request=data.supervisor_liquidation_request,
        additions_summary=json.dumps(data.additions_summary)   if data.additions_summary   else None,
        extensions_summary=json.dumps(data.extensions_summary) if data.extensions_summary else None,
        suspensions_summary=json.dumps(data.suspensions_summary) if data.suspensions_summary else None,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {"ok": True, "liquidation_id": obj.liquidation_id}


@router.patch("/modifications/{mod_id}/toggle")
def toggle_modification(mod_id: int, db: Session = Depends(get_db)):
    mod = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not mod:
        raise HTTPException(404, "Modificacion no encontrada")
    mod.is_active = not mod.is_active
    db.commit()
    return {"ok": True, "is_active": mod.is_active}
