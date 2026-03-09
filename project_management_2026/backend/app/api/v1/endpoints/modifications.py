"""
backend/app/api/v1/endpoints/modifications.py — v4.2
CORRECCIÓN TRAZABILIDAD:
  - Ya NO se sobreescribe projects.end_date al crear o editar una modificación.
  - start_date y end_date del proyecto son inmutables (fechas contractuales originales).
  - La fecha vigente se obtiene de la última modification con new_end_date activa.
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
            "suspension_id":             sus.suspension_id,
            "suspension_start_date":     str(sus.suspension_start_date),
            "suspension_end_date":       str(sus.suspension_end_date),
            "planned_restart_date":      str(sus.planned_restart_date),
            "actual_restart_date":       str(sus.actual_restart_date) if sus.actual_restart_date else None,
            "contractor_justification":  sus.contractor_justification,
            "supervisor_justification":  sus.supervisor_justification,
            "entity_supervisor_name":    sus.entity_supervisor_name,
            "entity_supervisor_id":      sus.entity_supervisor_id,
            "suspension_status":         sus.suspension_status,
            "restart_modification_id":   sus.restart_modification_id,
        }

    # Cesión
    asgn = db.query(ModificationAssignment).filter(
        ModificationAssignment.modification_id == m.modification_id
    ).first()
    if asgn:
        base["assignment"] = {
            "assignment_id":               asgn.assignment_id,
            "assignor_name":               asgn.assignor_name,
            "assignor_id":                 asgn.assignor_id,
            "assignor_id_type":            asgn.assignor_id_type,
            "assignee_name":               asgn.assignee_name,
            "assignee_id":                 asgn.assignee_id,
            "assignee_id_type":            asgn.assignee_id_type,
            "assignment_date":             str(asgn.assignment_date) if asgn.assignment_date else None,
            "assignment_signature_date":   str(asgn.assignment_signature_date) if asgn.assignment_signature_date else None,
            "value_to_assign":             float(asgn.value_to_assign) if asgn.value_to_assign else None,
            "value_paid_to_assignor":      float(asgn.value_paid_to_assignor) if asgn.value_paid_to_assignor else None,
            "value_pending_to_assignor":   float(asgn.value_pending_to_assignor) if asgn.value_pending_to_assignor else None,
            "cdp":                         asgn.cdp,
            "rp":                          asgn.rp,
            "guarantee_value":             float(asgn.guarantee_value) if asgn.guarantee_value else None,
        }

    # Cláusula contractual
    clause = db.query(ModificationClauseChange).filter(
        ModificationClauseChange.modification_id == m.modification_id
    ).first()
    if clause:
        base["clause"] = {
            "clause_change_id":              clause.clause_change_id,
            "modification_description":      clause.modification_description,
            "requires_resource_liberation":  clause.requires_resource_liberation,
            "cdp_to_release":                clause.cdp_to_release,
            "rp_to_release":                 clause.rp_to_release,
            "liberation_amount":             float(clause.liberation_amount) if clause.liberation_amount else None,
        }

    # Liquidación
    liq = db.query(ModificationLiquidation).filter(
        ModificationLiquidation.modification_id == m.modification_id
    ).first()
    if liq:
        base["liquidation"] = {
            "liquidation_id":                    liq.liquidation_id,
            "liquidation_date":                  str(liq.liquidation_date) if liq.liquidation_date else None,
            "execution_percentage":              float(liq.execution_percentage) if liq.execution_percentage else None,
            "supervisor_liquidation_request":    liq.supervisor_liquidation_request,
            "entity_liquidation_request":        liq.entity_liquidation_request,
            "observations":                      liq.observations,
        }

    # Si es RESTART, incluir datos de la suspensión que reinicia
    if m.modification_type == 'RESTART':
        linked_sus = db.query(ModificationSuspension).filter(
            ModificationSuspension.restart_modification_id == m.modification_id
        ).first()
        if linked_sus:
            base["restarted_suspension"] = {
                "suspension_id":         linked_sus.suspension_id,
                "actual_restart_date":   str(linked_sus.actual_restart_date) if linked_sus.actual_restart_date else None,
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
    # ✅ NO se modifica projects.end_date — la fecha original del contrato es inmutable.
    # La fecha vigente se calcula desde project_modifications.new_end_date.
    db.commit()
    db.refresh(obj)
    return enrich_mod(obj, db)


# ─────────────────────────────────────────────────────────────────────
# EDITAR modificación principal + sub-registros
# ─────────────────────────────────────────────────────────────────────
@router.put("/modifications/{mod_id}")
def update_modification(mod_id: int, data: dict, db: Session = Depends(get_db)):
    """
    Edita los campos de la modificación principal y opcionalmente sus sub-registros.
    El body puede incluir: campos base + 'suspension'|'clause'|'assignment'|'liquidation' anidados.
    NOTA: No modifica projects.end_date — la fecha original del contrato es inmutable.
    """
    from datetime import datetime as dt
    m = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not m:
        raise HTTPException(404, "Modificación no encontrada")

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
            if field in ('approval_date', 'new_end_date') and isinstance(val, str) and val:
                from datetime import date as dt_date
                val = dt_date.fromisoformat(val)
            setattr(m, field, val)

    m.updated_at = dt.utcnow()
    # ✅ NO se modifica projects.end_date — ver nota arriba.

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
                      'cdp', 'rp', 'guarantee_value'):
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
            if 'liquidation_date' in l and l['liquidation_date']:
                liq.liquidation_date = dt_date.fromisoformat(l['liquidation_date']) if isinstance(l['liquidation_date'], str) else l['liquidation_date']
            for f in ('execution_percentage', 'supervisor_liquidation_request',
                      'entity_liquidation_request', 'observations'):
                if f in l:
                    setattr(liq, f, l[f])

    db.commit()
    return enrich_mod_detail(m, db)


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
# SUSPENSIONES ACTIVAS de un proyecto
# ─────────────────────────────────────────────────────────────────────
@router.get("/projects/{project_id}/suspensions/")
def list_active_suspensions(project_id: int, db: Session = Depends(get_db)):
    mod_ids = [m.modification_id for m in
               db.query(ProjectModification).filter(
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
    clause = ModificationClauseChange(
        modification_id=mod_id,
        modification_description=data.modification_description,
        requires_resource_liberation=data.requires_resource_liberation,
        cdp_to_release=data.cdp_to_release,
        rp_to_release=data.rp_to_release,
        liberation_amount=data.liberation_amount,
    )
    db.add(clause)
    db.commit()
    db.refresh(clause)
    return {"ok": True, "clause_change_id": clause.clause_change_id}


@router.post("/modifications/{mod_id}/assignment")
def add_assignment(mod_id: int, data: AssignmentCreate, db: Session = Depends(get_db)):
    mod = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not mod:
        raise HTTPException(404, "Modificación no encontrada")
    asgn = ModificationAssignment(
        modification_id=mod_id,
        **data.model_dump(),
    )
    db.add(asgn)
    db.commit()
    db.refresh(asgn)
    return {"ok": True, "assignment_id": asgn.assignment_id}


@router.post("/modifications/{mod_id}/liquidation")
def add_liquidation(mod_id: int, data: LiquidationCreate, db: Session = Depends(get_db)):
    mod = db.query(ProjectModification).filter(ProjectModification.modification_id == mod_id).first()
    if not mod:
        raise HTTPException(404, "Modificación no encontrada")
    liq = ModificationLiquidation(
        modification_id=mod_id,
        **data.model_dump(),
    )
    db.add(liq)
    db.commit()
    db.refresh(liq)
    return {"ok": True, "liquidation_id": liq.liquidation_id}