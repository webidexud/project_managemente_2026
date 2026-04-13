# backend/app/api/v1/endpoints/tracking.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.models.catalogs import Project, ProjectStatus, Entity, ExecutingDepartment
from app.models.project_modification import ProjectModification
from app.models.project_tracking import (
    ProjectTracking, TrackingPersonnel, TrackingInvoice, TrackingReport
)

router = APIRouter(prefix="/tracking", tags=["Seguimiento"])


# ── Helpers ──────────────────────────────────────────────────────────

def _fmt(d):
    if not d: return None
    if isinstance(d, str): return d
    try: return d.isoformat()
    except: return str(d)

def _f(v):
    return float(v) if v is not None else None

def _project_snapshot(db, project_id: int) -> dict:
    """Trae datos del proyecto para autocompletar el seguimiento."""
    p = db.query(Project).filter(Project.project_id == project_id, Project.is_active == True).first()
    if not p:
        raise HTTPException(404, f"Proyecto {project_id} no encontrado")

    entity = db.query(Entity).filter(Entity.entity_id == p.entity_id).first()
    dept   = db.query(ExecutingDepartment).filter(ExecutingDepartment.department_id == p.executing_department_id).first()
    status = db.query(ProjectStatus).filter(ProjectStatus.status_id == p.project_status_id).first()

    # Fecha fin vigente (última prórroga)
    last_mod = db.query(ProjectModification).filter(
        ProjectModification.project_id == project_id,
        ProjectModification.is_active == True,
        ProjectModification.new_end_date.isnot(None),
    ).order_by(ProjectModification.modification_number.desc()).first()
    end_date_current = last_mod.new_end_date if last_mod else p.end_date

    # Total adiciones
    total_additions = db.query(func.sum(ProjectModification.addition_value)).filter(
        ProjectModification.project_id == project_id,
        ProjectModification.is_active == True,
        ProjectModification.addition_value.isnot(None),
    ).scalar() or 0

    return {
        "project_id":             p.project_id,
        "project_year":           p.project_year,
        "external_number":        p.external_project_number,
        "project_name":           p.project_name,
        "project_purpose":        p.project_purpose,
        "entity_name":            entity.entity_name if entity else "—",
        "department_name":        dept.department_name if dept else "—",
        "current_status":         status.status_name if status else "—",
        "status_color":           status.status_color if status else "#94A3B8",
        "start_date":             _fmt(p.start_date),
        "end_date_original":      _fmt(p.end_date),
        "end_date_current":       _fmt(end_date_current),
        "subscription_date":      _fmt(p.subscription_date),
        "initial_value":          _f(p.project_value),
        "total_additions":        float(total_additions),
        "total_value":            _f(p.project_value) + float(total_additions) if p.project_value else float(total_additions),
        "entity_contribution":    _f(p.entity_contribution),
        "university_contribution":_f(p.university_contribution),
        "institutional_benefit":  _f(p.institutional_benefit_value),
        "supervisor_type":        p.supervisor_type,
        "main_email":             p.main_email,
        "administrative_act":     p.administrative_act,
    }


def _tracking_to_dict(t: ProjectTracking) -> dict:
    return {
        "tracking_id":                t.tracking_id,
        "project_id":                 t.project_id,
        "cut_date":                   _fmt(t.cut_date),
        "tracking_number":            t.tracking_number,
        "current_status":             t.current_status,
        "physical_progress_pct":      _f(t.physical_progress_pct),
        "financial_progress_pct":     _f(t.financial_progress_pct),
        "initial_value":              _f(t.initial_value),
        "addition_value":             _f(t.addition_value),
        "total_value":                _f(t.total_value),
        "total_disbursements":        _f(t.total_disbursements),
        "current_balance":            _f(t.current_balance),
        "total_pending":              _f(t.total_pending),
        "idexud_loans":               _f(t.idexud_loans),
        "payments_made":              _f(t.payments_made),
        "pending_payments":           _f(t.pending_payments),
        "entity_cash":                _f(t.entity_cash),
        "entity_kind":                _f(t.entity_kind),
        "entity_na":                  _f(t.entity_na),
        "ud_cash":                    _f(t.ud_cash),
        "ud_kind":                    _f(t.ud_kind),
        "ud_na":                      _f(t.ud_na),
        "advances_description":       t.advances_description,
        "difficulties_description":   t.difficulties_description,
        "pending_activities":         t.pending_activities,
        "financial_observations":     t.financial_observations,
        "modification_observations":  t.modification_observations,
        "general_observations":       t.general_observations,
        "risks_alerts":               t.risks_alerts,
        "is_active":                  t.is_active,
        "created_at":                 _fmt(t.created_at),
        "updated_at":                 _fmt(t.updated_at),
    }


def _personnel_to_dict(p: TrackingPersonnel) -> dict:
    return {
        "personnel_id":       p.personnel_id,
        "project_id":         p.project_id,
        "role":               p.role,
        "full_name":          p.full_name,
        "resolution_contract":p.resolution_contract,
        "email":              p.email,
        "phone":              p.phone,
        "is_current":         p.is_current,
        "start_date":         _fmt(p.start_date),
        "end_date":           _fmt(p.end_date),
        "observations":       p.observations,
        "is_active":          p.is_active,
    }


def _invoice_to_dict(i: TrackingInvoice) -> dict:
    return {
        "invoice_id":          i.invoice_id,
        "project_id":          i.project_id,
        "disbursement_number": i.disbursement_number,
        "invoice_number":      i.invoice_number,
        "invoice_date":        _fmt(i.invoice_date),
        "invoice_value":       _f(i.invoice_value),
        "status":              i.status,
        "payment_date":        _fmt(i.payment_date),
        "observations":        i.observations,
        "is_active":           i.is_active,
    }


def _report_to_dict(r: TrackingReport) -> dict:
    return {
        "report_id":               r.report_id,
        "project_id":              r.project_id,
        "report_number":           r.report_number,
        "cut_percentage":          _f(r.cut_percentage),
        "delivery_date":           _fmt(r.delivery_date),
        "deliverable_description": r.deliverable_description,
        "status":                  r.status,
        "observations":            r.observations,
        "is_active":               r.is_active,
    }


# ── GET /tracking/project/{project_id}/snapshot ─────────────────────
@router.get("/project/{project_id}/snapshot")
def get_snapshot(project_id: int, db: Session = Depends(get_db)):
    """Datos del proyecto para autocompletar el formulario de seguimiento."""
    return _project_snapshot(db, project_id)


# ── GET /tracking/ — Lista todos los seguimientos ────────────────────
@router.get("/")
def list_tracking(
    project_id: Optional[int] = Query(None),
    year:       Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(ProjectTracking, Project).join(
        Project, ProjectTracking.project_id == Project.project_id
    ).filter(ProjectTracking.is_active == True, Project.is_active == True)

    if project_id: q = q.filter(ProjectTracking.project_id == project_id)
    if year:       q = q.filter(Project.project_year == year)

    results = q.order_by(ProjectTracking.cut_date.desc()).all()

    out = []
    for t, p in results:
        entity = db.query(Entity).filter(Entity.entity_id == p.entity_id).first()
        d = _tracking_to_dict(t)
        d["project_year"]    = p.project_year
        d["external_number"] = p.external_project_number
        d["project_name"]    = p.project_name
        d["entity_name"]     = entity.entity_name if entity else "—"
        out.append(d)
    return out


# ── GET /tracking/{tracking_id} — Detalle completo ──────────────────
@router.get("/{tracking_id}")
def get_tracking(tracking_id: int, db: Session = Depends(get_db)):
    t = db.query(ProjectTracking).filter(
        ProjectTracking.tracking_id == tracking_id,
        ProjectTracking.is_active == True
    ).first()
    if not t: raise HTTPException(404, "Seguimiento no encontrado")

    d = _tracking_to_dict(t)
    d["snapshot"]  = _project_snapshot(db, t.project_id)
    d["personnel"] = [_personnel_to_dict(p) for p in
                      db.query(TrackingPersonnel).filter(
                          TrackingPersonnel.project_id == t.project_id,
                          TrackingPersonnel.is_active == True
                      ).order_by(TrackingPersonnel.role, TrackingPersonnel.is_current.desc()).all()]
    d["invoices"]  = [_invoice_to_dict(i) for i in
                      db.query(TrackingInvoice).filter(
                          TrackingInvoice.project_id == t.project_id,
                          TrackingInvoice.is_active == True
                      ).order_by(TrackingInvoice.disbursement_number).all()]
    d["reports"]   = [_report_to_dict(r) for r in
                      db.query(TrackingReport).filter(
                          TrackingReport.project_id == t.project_id,
                          TrackingReport.is_active == True
                      ).order_by(TrackingReport.report_number).all()]
    return d


# ── POST /tracking/ — Crear seguimiento ─────────────────────────────
class TrackingCreate(BaseModel):
    project_id:                int
    cut_date:                  str
    current_status:            Optional[str]  = None
    physical_progress_pct:     Optional[float]= None
    financial_progress_pct:    Optional[float]= None
    initial_value:             Optional[float]= None
    addition_value:            Optional[float]= None
    total_value:               Optional[float]= None
    total_disbursements:       Optional[float]= None
    current_balance:           Optional[float]= None
    total_pending:             Optional[float]= None
    idexud_loans:              Optional[float]= None
    payments_made:             Optional[float]= None
    pending_payments:          Optional[float]= None
    entity_cash:               Optional[float]= None
    entity_kind:               Optional[float]= None
    entity_na:                 Optional[float]= None
    ud_cash:                   Optional[float]= None
    ud_kind:                   Optional[float]= None
    ud_na:                     Optional[float]= None
    advances_description:      Optional[str]  = None
    difficulties_description:  Optional[str]  = None
    pending_activities:        Optional[str]  = None
    financial_observations:    Optional[str]  = None
    modification_observations: Optional[str]  = None
    general_observations:      Optional[str]  = None
    risks_alerts:              Optional[str]  = None


@router.post("/", status_code=201)
def create_tracking(data: TrackingCreate, db: Session = Depends(get_db)):
    # Verificar que el proyecto existe
    p = db.query(Project).filter(Project.project_id == data.project_id, Project.is_active == True).first()
    if not p: raise HTTPException(404, "Proyecto no encontrado")

    # Número de seguimiento
    max_num = db.query(func.max(ProjectTracking.tracking_number)).filter(
        ProjectTracking.project_id == data.project_id
    ).scalar() or 0

    t = ProjectTracking(
        project_id                = data.project_id,
        cut_date                  = date.fromisoformat(data.cut_date),
        tracking_number           = max_num + 1,
        current_status            = data.current_status,
        physical_progress_pct     = data.physical_progress_pct,
        financial_progress_pct    = data.financial_progress_pct,
        initial_value             = data.initial_value,
        addition_value            = data.addition_value,
        total_value               = data.total_value,
        total_disbursements       = data.total_disbursements,
        current_balance           = data.current_balance,
        total_pending             = data.total_pending,
        idexud_loans              = data.idexud_loans,
        payments_made             = data.payments_made,
        pending_payments          = data.pending_payments,
        entity_cash               = data.entity_cash,
        entity_kind               = data.entity_kind,
        entity_na                 = data.entity_na,
        ud_cash                   = data.ud_cash,
        ud_kind                   = data.ud_kind,
        ud_na                     = data.ud_na,
        advances_description      = data.advances_description,
        difficulties_description  = data.difficulties_description,
        pending_activities        = data.pending_activities,
        financial_observations    = data.financial_observations,
        modification_observations = data.modification_observations,
        general_observations      = data.general_observations,
        risks_alerts              = data.risks_alerts,
    )
    db.add(t); db.commit(); db.refresh(t)
    return _tracking_to_dict(t)


# ── PUT /tracking/{tracking_id} ──────────────────────────────────────
@router.put("/{tracking_id}")
def update_tracking(tracking_id: int, data: dict, db: Session = Depends(get_db)):
    t = db.query(ProjectTracking).filter(ProjectTracking.tracking_id == tracking_id).first()
    if not t: raise HTTPException(404, "Seguimiento no encontrado")

    FIELDS = [
        'cut_date','current_status','physical_progress_pct','financial_progress_pct',
        'initial_value','addition_value','total_value','total_disbursements',
        'current_balance','total_pending','idexud_loans','payments_made','pending_payments',
        'entity_cash','entity_kind','entity_na','ud_cash','ud_kind','ud_na',
        'advances_description','difficulties_description','pending_activities',
        'financial_observations','modification_observations','general_observations','risks_alerts',
    ]
    for f in FIELDS:
        if f in data:
            val = data[f]
            if f == 'cut_date' and isinstance(val, str) and val:
                val = date.fromisoformat(val)
            setattr(t, f, val)
    t.updated_at = datetime.utcnow()
    db.commit(); db.refresh(t)
    return _tracking_to_dict(t)


# ── DELETE /tracking/{tracking_id} ───────────────────────────────────
@router.delete("/{tracking_id}")
def delete_tracking(tracking_id: int, db: Session = Depends(get_db)):
    t = db.query(ProjectTracking).filter(ProjectTracking.tracking_id == tracking_id).first()
    if not t: raise HTTPException(404, "Seguimiento no encontrado")
    t.is_active = False
    t.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


# ══════════════════════════════════════════════════════════════════════
# PERSONAL
# ══════════════════════════════════════════════════════════════════════

class PersonnelCreate(BaseModel):
    project_id:          int
    role:                str
    full_name:           str
    resolution_contract: Optional[str] = None
    email:               Optional[str] = None
    phone:               Optional[str] = None
    is_current:          bool = True
    start_date:          Optional[str] = None
    end_date:            Optional[str] = None
    observations:        Optional[str] = None


@router.get("/project/{project_id}/personnel")
def list_personnel(project_id: int, db: Session = Depends(get_db)):
    rows = db.query(TrackingPersonnel).filter(
        TrackingPersonnel.project_id == project_id,
        TrackingPersonnel.is_active == True
    ).order_by(TrackingPersonnel.role, TrackingPersonnel.is_current.desc()).all()
    return [_personnel_to_dict(r) for r in rows]


@router.post("/project/{project_id}/personnel", status_code=201)
def create_personnel(project_id: int, data: PersonnelCreate, db: Session = Depends(get_db)):
    # Si es_current=True, marcar anteriores del mismo rol como inactivo
    if data.is_current:
        db.query(TrackingPersonnel).filter(
            TrackingPersonnel.project_id == project_id,
            TrackingPersonnel.role == data.role,
            TrackingPersonnel.is_current == True,
        ).update({"is_current": False, "updated_at": datetime.utcnow()})

    obj = TrackingPersonnel(
        project_id=project_id, role=data.role, full_name=data.full_name,
        resolution_contract=data.resolution_contract, email=data.email, phone=data.phone,
        is_current=data.is_current,
        start_date=date.fromisoformat(data.start_date) if data.start_date else None,
        end_date=date.fromisoformat(data.end_date) if data.end_date else None,
        observations=data.observations,
    )
    db.add(obj); db.commit(); db.refresh(obj)
    return _personnel_to_dict(obj)


@router.put("/personnel/{personnel_id}")
def update_personnel(personnel_id: int, data: dict, db: Session = Depends(get_db)):
    obj = db.query(TrackingPersonnel).filter(TrackingPersonnel.personnel_id == personnel_id).first()
    if not obj: raise HTTPException(404)
    for f in ['full_name','resolution_contract','email','phone','is_current','start_date','end_date','observations']:
        if f in data:
            val = data[f]
            if f in ('start_date','end_date') and isinstance(val, str) and val:
                val = date.fromisoformat(val)
            setattr(obj, f, val)
    obj.updated_at = datetime.utcnow()
    db.commit(); db.refresh(obj)
    return _personnel_to_dict(obj)


@router.delete("/personnel/{personnel_id}")
def delete_personnel(personnel_id: int, db: Session = Depends(get_db)):
    obj = db.query(TrackingPersonnel).filter(TrackingPersonnel.personnel_id == personnel_id).first()
    if not obj: raise HTTPException(404)
    obj.is_active = False; obj.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


# ══════════════════════════════════════════════════════════════════════
# FACTURAS
# ══════════════════════════════════════════════════════════════════════

class InvoiceCreate(BaseModel):
    disbursement_number: int
    invoice_number:      Optional[str]   = None
    invoice_date:        Optional[str]   = None
    invoice_value:       Optional[float] = None
    status:              str = "PENDIENTE"
    payment_date:        Optional[str]   = None
    observations:        Optional[str]   = None


@router.get("/project/{project_id}/invoices")
def list_invoices(project_id: int, db: Session = Depends(get_db)):
    rows = db.query(TrackingInvoice).filter(
        TrackingInvoice.project_id == project_id,
        TrackingInvoice.is_active == True
    ).order_by(TrackingInvoice.disbursement_number).all()
    return [_invoice_to_dict(r) for r in rows]


@router.post("/project/{project_id}/invoices", status_code=201)
def create_invoice(project_id: int, data: InvoiceCreate, db: Session = Depends(get_db)):
    obj = TrackingInvoice(
        project_id=project_id,
        disbursement_number=data.disbursement_number,
        invoice_number=data.invoice_number,
        invoice_date=date.fromisoformat(data.invoice_date) if data.invoice_date else None,
        invoice_value=data.invoice_value,
        status=data.status,
        payment_date=date.fromisoformat(data.payment_date) if data.payment_date else None,
        observations=data.observations,
    )
    db.add(obj); db.commit(); db.refresh(obj)
    return _invoice_to_dict(obj)


@router.put("/invoices/{invoice_id}")
def update_invoice(invoice_id: int, data: dict, db: Session = Depends(get_db)):
    obj = db.query(TrackingInvoice).filter(TrackingInvoice.invoice_id == invoice_id).first()
    if not obj: raise HTTPException(404)
    for f in ['disbursement_number','invoice_number','invoice_date','invoice_value','status','payment_date','observations']:
        if f in data:
            val = data[f]
            if f in ('invoice_date','payment_date') and isinstance(val, str) and val:
                val = date.fromisoformat(val)
            setattr(obj, f, val)
    obj.updated_at = datetime.utcnow()
    db.commit(); db.refresh(obj)
    return _invoice_to_dict(obj)


@router.delete("/invoices/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    obj = db.query(TrackingInvoice).filter(TrackingInvoice.invoice_id == invoice_id).first()
    if not obj: raise HTTPException(404)
    obj.is_active = False; obj.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


# ══════════════════════════════════════════════════════════════════════
# INFORMES
# ══════════════════════════════════════════════════════════════════════

class ReportCreate(BaseModel):
    report_number:           int
    cut_percentage:          Optional[float] = None
    delivery_date:           Optional[str]   = None
    deliverable_description: Optional[str]   = None
    status:                  str = "EN_REVISION"
    observations:            Optional[str]   = None


@router.get("/project/{project_id}/reports")
def list_reports(project_id: int, db: Session = Depends(get_db)):
    rows = db.query(TrackingReport).filter(
        TrackingReport.project_id == project_id,
        TrackingReport.is_active == True
    ).order_by(TrackingReport.report_number).all()
    return [_report_to_dict(r) for r in rows]


@router.post("/project/{project_id}/reports", status_code=201)
def create_report(project_id: int, data: ReportCreate, db: Session = Depends(get_db)):
    obj = TrackingReport(
        project_id=project_id,
        report_number=data.report_number,
        cut_percentage=data.cut_percentage,
        delivery_date=date.fromisoformat(data.delivery_date) if data.delivery_date else None,
        deliverable_description=data.deliverable_description,
        status=data.status,
        observations=data.observations,
    )
    db.add(obj); db.commit(); db.refresh(obj)
    return _report_to_dict(obj)


@router.put("/reports/{report_id}")
def update_report(report_id: int, data: dict, db: Session = Depends(get_db)):
    obj = db.query(TrackingReport).filter(TrackingReport.report_id == report_id).first()
    if not obj: raise HTTPException(404)
    for f in ['report_number','cut_percentage','delivery_date','deliverable_description','status','observations']:
        if f in data:
            val = data[f]
            if f == 'delivery_date' and isinstance(val, str) and val:
                val = date.fromisoformat(val)
            setattr(obj, f, val)
    obj.updated_at = datetime.utcnow()
    db.commit(); db.refresh(obj)
    return _report_to_dict(obj)


@router.delete("/reports/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db)):
    obj = db.query(TrackingReport).filter(TrackingReport.report_id == report_id).first()
    if not obj: raise HTTPException(404)
    obj.is_active = False; obj.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}
