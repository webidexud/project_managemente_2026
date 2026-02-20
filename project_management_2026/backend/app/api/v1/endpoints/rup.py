from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from typing import List, Optional
from app.db.database import get_db
from app.models.catalogs import RupCode, ProjectRupCode
from app.schemas.projects import RupCodeOut, RupSegment, RupFamily, RupClass, ProjectRupCodeOut, ProjectRupBulk
from datetime import date

router = APIRouter(prefix="/rup", tags=["RUP Codes"])


@router.get("/segments", response_model=List[RupSegment])
def get_segments(db: Session = Depends(get_db)):
    rows = db.query(RupCode.segment_code, RupCode.segment_name)\
        .filter(RupCode.is_active == True)\
        .distinct().order_by(RupCode.segment_code).all()
    return [RupSegment(segment_code=r[0], segment_name=r[1]) for r in rows if r[0]]


@router.get("/families", response_model=List[RupFamily])
def get_families(segment_code: str, db: Session = Depends(get_db)):
    rows = db.query(RupCode.family_code, RupCode.family_name)\
        .filter(RupCode.is_active == True, RupCode.segment_code == segment_code)\
        .distinct().order_by(RupCode.family_code).all()
    return [RupFamily(family_code=r[0], family_name=r[1]) for r in rows if r[0]]


@router.get("/classes", response_model=List[RupClass])
def get_classes(family_code: str, db: Session = Depends(get_db)):
    rows = db.query(RupCode.class_code, RupCode.class_name)\
        .filter(RupCode.is_active == True, RupCode.family_code == family_code)\
        .distinct().order_by(RupCode.class_code).all()
    return [{"class_code": r[0], "class_name": r[1]} for r in rows if r[0]]


@router.get("/products", response_model=List[RupCodeOut])
def get_products(class_code: str, db: Session = Depends(get_db)):
    return db.query(RupCode)\
        .filter(RupCode.is_active == True, RupCode.class_code == class_code)\
        .order_by(RupCode.product_code).all()


@router.get("/search", response_model=List[RupCodeOut])
def search_rup(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    like = f"%{q}%"
    return db.query(RupCode).filter(
        RupCode.is_active == True,
        (RupCode.product_name.ilike(like)) |
        (RupCode.rup_code.ilike(like)) |
        (RupCode.code_description.ilike(like))
    ).order_by(RupCode.rup_code).limit(30).all()


# ── RUP de un proyecto ────────────────────────────────────────────────
@router.get("/project/{project_id}", response_model=List[ProjectRupCodeOut])
def get_project_rup(project_id: int, db: Session = Depends(get_db)):
    from app.models.catalogs import Project
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        return []
    rows = db.query(ProjectRupCode, RupCode)\
        .join(RupCode, ProjectRupCode.rup_code_id == RupCode.rup_code_id)\
        .filter(
            ProjectRupCode.project_year == proj.project_year,
            ProjectRupCode.internal_project_number == proj.internal_project_number,
            ProjectRupCode.is_active == True
        ).all()
    result = []
    for prc, rc in rows:
        result.append(ProjectRupCodeOut(
            project_rup_code_id=prc.project_rup_code_id,
            rup_code_id=rc.rup_code_id,
            rup_code=rc.rup_code,
            product_name=rc.product_name,
            class_name=rc.class_name,
            family_name=rc.family_name,
            segment_name=rc.segment_name,
            is_main_code=prc.is_main_code,
            is_active=prc.is_active,
        ))
    return result


@router.post("/project/{project_id}/assign")
def assign_rup(project_id: int, body: ProjectRupBulk, db: Session = Depends(get_db)):
    from app.models.catalogs import Project
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        return {"ok": False, "msg": "Proyecto no encontrado"}

    # Desactivar los existentes
    db.query(ProjectRupCode).filter(
        ProjectRupCode.project_year == proj.project_year,
        ProjectRupCode.internal_project_number == proj.internal_project_number,
    ).update({"is_active": False})

    today = date.today()
    for item in body.codes:
        new = ProjectRupCode(
            project_year=proj.project_year,
            internal_project_number=proj.internal_project_number,
            rup_code_id=item.rup_code_id,
            is_main_code=item.is_main_code,
            assignment_date=today,
            is_active=True,
        )
        db.add(new)
    db.commit()
    return {"ok": True, "count": len(body.codes)}
