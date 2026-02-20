from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.catalogs import ProjectStatus
from app.schemas.catalogs import ProjectStatusOut, ProjectStatusCreate, ProjectStatusUpdate

router = APIRouter(prefix="/project-statuses", tags=["Estados"])

@router.get("/", response_model=List[ProjectStatusOut])
def list(active_only: bool = False, db: Session = Depends(get_db)):
    q = db.query(ProjectStatus)
    if active_only: q = q.filter(ProjectStatus.is_active == True)
    return q.order_by(ProjectStatus.status_order).all()

@router.post("/", response_model=ProjectStatusOut, status_code=201)
def create(data: ProjectStatusCreate, db: Session = Depends(get_db)):
    if db.query(ProjectStatus).filter(
        (ProjectStatus.status_code == data.status_code) | (ProjectStatus.status_name == data.status_name)
    ).first():
        raise HTTPException(400, "Ya existe un estado con ese código o nombre")
    obj = ProjectStatus(**data.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.put("/{id}", response_model=ProjectStatusOut)
def update(id: int, data: ProjectStatusUpdate, db: Session = Depends(get_db)):
    obj = db.query(ProjectStatus).filter(ProjectStatus.status_id == id).first()
    if not obj: raise HTTPException(404, "No encontrado")
    for k, v in data.model_dump(exclude_unset=True).items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.patch("/{id}/toggle", response_model=ProjectStatusOut)
def toggle(id: int, db: Session = Depends(get_db)):
    obj = db.query(ProjectStatus).filter(ProjectStatus.status_id == id).first()
    if not obj: raise HTTPException(404, "No encontrado")
    obj.is_active = not obj.is_active
    db.commit(); db.refresh(obj)
    return obj
