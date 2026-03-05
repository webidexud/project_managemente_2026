"""
backend/app/api/v1/endpoints/modifications.py — v4.1
Nuevos endpoints:
  GET  /modifications/{mod_id}         → detalle enriquecido con sub-registros
  PUT  /modifications/{mod_id}         → editar modificación principal + sub-registros
  GET  /projects/{id}/suspensions/     → suspensiones activas
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.db.database import get_db
from app.models.catalogs import Project
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
    """Retorna dict con campos base de la modificación."""
    return {
        "modification_id":             m.modification_id,
        "project_id":                  m.project_id,
        "modification_number":         m.modification_number,
        "modification_type":           m.modification_type,
        "addition_value":              float(m.addition_value) if m.addition_value else None,
        "extension_days":              m.extension_days,
        "new_end_date":                str(m.new_end_date) if m.new_end_date else None,
        "new_total_value":             float(m.new_total_value) if m.new_total_value else None,
        "justification":               m.justification,
        "administrative_act":          m.administrative_act,
        "approval_date":               str(m.approval_date) if m.approval_date else None,
        "extension_period_text":       m.extension_period_text,
        "requires_policy_update":      m.requires_policy_update,
        "policy_update_description":   m.policy_update_description,
        "payment_method_modification": m.payment_method_modification,
        "ordering_official_id":        m.ordering_official_id,
        "is_active":                   m.is_active,
        "created_at":                  str(m.created_at) if m.created_at else None,
        "updated_at":                  str(m.updated_at) if m.updated_at else None,
    }


def enrich_mod_detail(m, db):
    """Retorna dict enriquecido con TODOS los sub-registros."""
    base = enrich_mod(m, db)

    # Suspensión
    sus = db.query(ModificationSuspension).filter(
        ModificationSuspension.modification_id == m.modification_id
    ).first()
    if sus:
        base["suspension"] = {
            "suspension_id":          sus.suspension_id,
            "suspension_start_date":  str(sus.suspension_start_date),
            "suspension_end_date":    str(sus.suspension_end_date),
            "planned_restart_date":   str(sus.planned_restart_date),
            "actual_restart_date":    str(sus.actual_restart_date) if sus.actual_restart_date else None,
            "suspension_status":      sus.suspension_status,
            "contractor_justification": sus.contractor_justification,
            "supervisor_justification": sus.supervisor_justification,
        }

    # Cláusula (CONTRACTUAL)
    clause = db.query(ModificationClauseChange).filter(
        ModificationClauseChange.modification_id == m.modification_id
    ).first()
    if clause:
        base["clause"] = {
            "clause_change_id":          clause.clause_change_id,
            "modification_description":  clause.modification_description,
            "requires_resource_liberation": clause.requires_resource_liberation,
            "cdp_to_release":            clause.cdp_to_release,
            "rp_to_release":             clause.rp_to_release,
            "liberation_amount":         float(clause.liberation_amount) if clause.liberation_amount else None,
        }

    # Cesión
    assignment = db.query(ModificationAssignment).filter(
        ModificationAssignment.modification_id == m.modification_id
    ).first()
    if assignment:
        base["assignment"] = {
            "assignment_id":             assignment.assignment_id,
            "assignment_type":           assignment.assignment_type,
            "assignor_name":             assignment.assignor_name,
            "assignor_id":               assignment.assignor_id,
            "assignor_id_type":          assignment.assignor_id_type,
            "assignee_name":             assignment.assignee_name,
            "assignee_id":               assignment.assignee_id,
            "assignee_id_type":          assignment.assignee_id_type,
            "assignment_date":           str(assignment.assignment_date) if assignment.assignment_date else None,
            "assignment_signature_date": str(assignment.assignment_signature_date) if assignment.assignment_signature_date else None,
            "value_to_assign":           float(assignment.value_to_assign) if assignment.value_to_assign else None,
            "value_paid_to_assignor":    float(assignment.value_paid_to_assignor) if assignment.value_paid_to_assignor else None,
            "value_pending_to_assignor": float(assignment.value_pending_to_assignor) if assignment.value_pending_to_assignor else None,
            "cdp":                       assignment.cdp,
            "rp":                        assignment.rp,
            "guarantee_modification_request": assignment.guarantee_modification_request,
        }

    # Liquidación
    liq = db.query(ModificationLiquidation).filter(
        ModificationLiquidation.modification_id == m.modification_id
    ).first()
    if liq:
        base["liquidation"] = {
            "liquidation_id":              liq.liquidation_id,
            "liquidation_type":            liq.liquidation_type,
            "execution_percentage":        float(liq.execution_percentage) if liq.execution_percentage else None,
            "executed_value":              float(liq.executed_value) if liq.executed_value else None,
            "pending_payment_value":       float(liq.pending_payment_value) if liq.pending_payment_value else None,
            "value_to_release":            float(liq.value_to_release) if liq.value_to_release else None,
            "cdp":                         liq.cdp,
            "cdp_value":                   float(liq.cdp_value) if liq.cdp_value else None,
            "rp":                          liq.rp,
            "rp_value":                    float(liq.rp_value) if liq.rp_value else None,
            "initial_contract_value":      float(liq.initial_contract_value) if liq.initial_contract_value else None,
            "final_value_with_additions":  float(liq.final_value_with_additions) if liq.final_value_with_additions else None,
            "resolution_number":           liq.resolution_number,
            "resolution_date":             str(liq.resolution_date) if liq.resolution_date else None,
            "unilateral_cause":            liq.unilateral_cause,
            "cause_analysis":              liq.cause_analysis,
            "liquidation_date":            str(liq.liquidation_date) if liq.liquidation_date else None,
            "liquidation_signature_date":  str(liq.liquidation_signature_date) if liq.liquidation_signature_date else None,
            "supervisor_liquidation_request": liq.supervisor_liquidation_request,
        }

    # Reinicio: buscar suspensión que fue reiniciada por esta modificación
    if m.modification_type == 'RESTART':
        linked_sus = db.query(ModificationSuspension).filter(
            ModificationSuspension.restart_modification_id == m.modification_id
        ).first()
        if linked_sus:
            base["restart"] = {
                "suspension_id":        linked_sus.suspension_id,
                "actual_restart_date":  str(linked_sus.actual_restart_date) if linked_sus.actual_restart_date else None,
                "suspension_start_date": str(linked_sus.suspension_start_date),
                "suspension_end_date":   str(linked_sus.suspension_end_date),
            }

    return base


# ─────────────────────────────────────────────────────────────────────
# LISTAR modificaciones de un proyecto
# ─────────────────────────────────────────────────────────────────────
@router.get("/projects/{project_id}/modifications/")
def list_modifications(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(404, "Proyecto no encontrado")
    mods = db.query(ProjectModification) \
        .filter(ProjectModification.project_id == project_id) \
        .order_by(ProjectModification.modification_number).all()
    return [enrich_mod_detail(m, db) for m in mods]


# ─────────────────────────────────────────────────────────────────────
# DETALLE de una modificación (con sub-registros)
# ─────────────────────────────────────────────────────────────────────
@router.get("/modifications/{mod_id}")
def get_modification(mod_id: int, db: Session = Depends(get_db)):
    m = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not m:
        raise HTTPException(404, "Modificación no encontrada")
    return enrich_mod_detail(m, db)


# ─────────────────────────────────────────────────────────────────────
# EDITAR modificación principal + sub-registros
# ─────────────────────────────────────────────────────────────────────
@router.put("/modifications/{mod_id}")
def update_modification(mod_id: int, data: dict, db: Session = Depends(get_db)):
    """
    Edita los campos de la modificación principal y opcionalmente sus sub-registros.
    El body puede incluir: campos base + 'suspension'|'clause'|'assignment'|'liquidation' anidados.
    """
    from datetime import datetime as dt
    m = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not m:
        raise HTTPException(404, "Modificación no encontrada")

    proj = db.query(Project).filter(Project.project_id == m.project_id).first()

    # Campos base editables
    BASE_FIELDS = [
        'administrative_act', 'approval_date', 'justification',
        'addition_value', 'new_end_date', 'extension_days',
        'extension_period_text', 'new_total_value',
        'requires_policy_update', 'policy_update_description',
        'payment_method_modification',
    ]
    for field in BASE_FIELDS:
        if field in data:
            val = data[field]
            # Convertir fechas
            if field in ('approval_date', 'new_end_date') and isinstance(val, str) and val:
                from datetime import date as dt_date
                val = dt_date.fromisoformat(val)
            setattr(m, field, val)

    m.updated_at = dt.utcnow()

    # Actualizar fecha fin del proyecto si cambió new_end_date
    if 'new_end_date' in data and data['new_end_date'] and m.modification_type in ('EXTENSION', 'BOTH'):
        from datetime import date as dt_date
        proj.end_date = dt_date.fromisoformat(data['new_end_date']) if isinstance(data['new_end_date'], str) else data['new_end_date']
        proj.updated_at = dt.utcnow()

    # Sub-registro: suspensión
    if 'suspension' in data and data['suspension']:
        sus = db.query(ModificationSuspension).filter(
            ModificationSuspension.modification_id == mod_id
        ).first()
        if sus:
            s = data['suspension']
            from datetime import date as dt_date
            for f in ('suspension_start_date', 'suspension_end_date', 'planned_restart_date'):
                if f in s and s[f]:
                    setattr(sus, f, dt_date.fromisoformat(s[f]) if isinstance(s[f], str) else s[f])
            for f in ('contractor_justification', 'supervisor_justification'):
                if f in s:
                    setattr(sus, f, s[f])

    # Sub-registro: cláusula (CONTRACTUAL)
    if 'clause' in data and data['clause']:
        clause = db.query(ModificationClauseChange).filter(
            ModificationClauseChange.modification_id == mod_id
        ).first()
        if clause:
            c = data['clause']
            for f in ('modification_description', 'requires_resource_liberation',
                      'cdp_to_release', 'rp_to_release', 'liberation_amount'):
                if f in c:
                    setattr(clause, f, c[f])
            clause.new_clause_text = c.get('modification_description', clause.new_clause_text)

    # Sub-registro: cesión
    if 'assignment' in data and data['assignment']:
        asgn = db.query(ModificationAssignment).filter(
            ModificationAssignment.modification_id == mod_id
        ).first()
        if asgn:
            a = data['assignment']
            from datetime import date as dt_date
            for f in ('assignment_date', 'assignment_signature_date'):
                if f in a and a[f]:
                    setattr(asgn, f, dt_date.fromisoformat(a[f]) if isinstance(a[f], str) else a[f])
            for f in ('assignor_name', 'assignor_id', 'assignor_id_type',
                      'assignee_name', 'assignee_id', 'assignee_id_type',
                      'value_to_assign', 'value_paid_to_assignor', 'value_pending_to_assignor',
                      'cdp', 'rp', 'guarantee_modification_request'):
                if f in a:
                    setattr(asgn, f, a[f])

    # Sub-registro: liquidación
    if 'liquidation' in data and data['liquidation']:
        liq = db.query(ModificationLiquidation).filter(
            ModificationLiquidation.modification_id == mod_id
        ).first()
        if liq:
            l = data['liquidation']
            from datetime import date as dt_date
            for f in ('liquidation_date', 'liquidation_signature_date', 'resolution_date'):
                if f in l and l[f]:
                    setattr(liq, f, dt_date.fromisoformat(l[f]) if isinstance(l[f], str) else l[f])
            for f in ('liquidation_type', 'execution_percentage', 'executed_value',
                      'pending_payment_value', 'value_to_release',
                      'cdp', 'cdp_value', 'rp', 'rp_value',
                      'resolution_number', 'unilateral_cause', 'cause_analysis',
                      'supervisor_liquidation_request'):
                if f in l:
                    setattr(liq, f, l[f])

    db.commit()
    db.refresh(m)
    return enrich_mod_detail(m, db)


# ─────────────────────────────────────────────────────────────────────
# SUSPENSIONES activas de un proyecto (para selector de Reinicio)
# ─────────────────────────────────────────────────────────────────────
@router.get("/projects/{project_id}/suspensions/")
def list_suspensions(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(404, "Proyecto no encontrado")

    mod_ids = [m.modification_id for m in
               db.query(ProjectModification)
               .filter(
                   ProjectModification.project_id == project_id,
                   ProjectModification.modification_type == 'SUSPENSION',
                   ProjectModification.is_active == True
               ).all()]

    if not mod_ids:
        return []

    suspensions = db.query(ModificationSuspension) \
        .filter(
            ModificationSuspension.modification_id.in_(mod_ids),
            ModificationSuspension.suspension_status == 'ACTIVE'
        ).all()

    # Incluir modification_number para mostrar en el selector
    mod_map = {m.modification_id: m.modification_number for m in
               db.query(ProjectModification)
               .filter(ProjectModification.modification_id.in_(mod_ids)).all()}

    return [{
        "suspension_id":         s.suspension_id,
        "modification_id":       s.modification_id,
        "modification_number":   mod_map.get(s.modification_id),
        "suspension_start_date": str(s.suspension_start_date),
        "suspension_end_date":   str(s.suspension_end_date),
        "planned_restart_date":  str(s.planned_restart_date),
        "suspension_status":     s.suspension_status,
    } for s in suspensions]


# ─────────────────────────────────────────────────────────────────────
# CREAR modificación principal
# ─────────────────────────────────────────────────────────────────────
@router.post("/projects/{project_id}/modifications/")
def create_modification(project_id: int, data: ModificationCreate, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(404, "Proyecto no encontrado")

    if data.modification_type not in VALID_TYPES:
        raise HTTPException(400, f"Tipo inválido. Permitidos: {', '.join(sorted(VALID_TYPES))}")

    mod_num = next_mod_number(db, project_id)

    obj = ProjectModification(
        project_id=project_id,
        modification_number=mod_num,
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

    # Actualizar fecha fin del proyecto en prórroga (acumulativa)
    if data.modification_type in ('EXTENSION', 'BOTH') and data.new_end_date:
        proj.end_date = data.new_end_date
        proj.updated_at = date.today()

    db.commit()
    db.refresh(obj)
    return enrich_mod(obj, db)


# ─────────────────────────────────────────────────────────────────────
# TOGGLE activo/inactivo
# ─────────────────────────────────────────────────────────────────────
@router.patch("/modifications/{mod_id}/toggle")
def toggle_modification(mod_id: int, db: Session = Depends(get_db)):
    obj = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not obj:
        raise HTTPException(404, "Modificación no encontrada")
    obj.is_active = not obj.is_active
    db.commit()
    return {"ok": True, "is_active": obj.is_active}


# ─────────────────────────────────────────────────────────────────────
# SUB-REGISTROS: agregar
# ─────────────────────────────────────────────────────────────────────
@router.post("/modifications/{mod_id}/suspension")
def add_suspension(mod_id: int, data: SuspensionCreate, db: Session = Depends(get_db)):
    mod = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not mod:
        raise HTTPException(404, "Modificación no encontrada")
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
        raise HTTPException(404, "Suspensión no encontrada")
    sus.actual_restart_date     = data.actual_restart_date
    sus.restart_modification_id = data.restart_modification_id
    sus.suspension_status       = 'RESTARTED'
    db.commit()
    return {"ok": True}


@router.post("/modifications/{mod_id}/clause")
def add_clause_change(mod_id: int, data: ClauseChangeCreate, db: Session = Depends(get_db)):
    mod = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not mod:
        raise HTTPException(404, "Modificación no encontrada")
    obj = ModificationClauseChange(
        modification_id=mod_id,
        clause_number=data.clause_number or '1',
        clause_name=data.clause_name or 'Modificación Contractual',
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
        raise HTTPException(404, "Modificación no encontrada")
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
        raise HTTPException(404, "Modificación no encontrada")
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
        additions_summary=json.dumps(data.additions_summary, default=str) if data.additions_summary else None,
        extensions_summary=json.dumps(data.extensions_summary, default=str) if data.extensions_summary else None,
        suspensions_summary=json.dumps(data.suspensions_summary, default=str) if data.suspensions_summary else None,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {"ok": True, "liquidation_id": obj.liquidation_id}
