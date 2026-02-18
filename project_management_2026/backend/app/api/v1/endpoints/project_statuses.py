from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.catalogs import ProjectStatus
from app.schemas.catalogs import ProjectStatusCreate, ProjectStatusUpdate, ProjectStatusOut
from app.core.deps import get_current_user
from app.models.catalogs import AppUser

router = APIRouter(prefix="/project-statuses", tags=["Estados de Proyecto"])


@router.get("/", response_model=List[ProjectStatusOut])
def list_statuses(
    active_only: bool = False,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    q = db.query(ProjectStatus)
    if active_only:
        q = q.filter(ProjectStatus.is_active == True)
    return q.order_by(ProjectStatus.status_order).all()


@router.post("/", response_model=ProjectStatusOut, status_code=201)
def create_status(
    data: ProjectStatusCreate,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
):
    existing = db.query(ProjectStatus).filter(
        (ProjectStatus.status_code == data.status_code) |
        (ProjectStatus.status_name == data.status_name)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Código o nombre de estado ya existe")
    obj = ProjectStatus(**data.model_dump(), created_by_user_id=current_user.user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{status_id}", response_model=ProjectStatusOut)
def get_status(
    status_id: int,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    obj = db.query(ProjectStatus).filter(ProjectStatus.status_id == status_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Estado no encontrado")
    return obj


@router.put("/{status_id}", response_model=ProjectStatusOut)
def update_status(
    status_id: int,
    data: ProjectStatusUpdate,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    obj = db.query(ProjectStatus).filter(ProjectStatus.status_id == status_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Estado no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.patch("/{status_id}/toggle", response_model=ProjectStatusOut)
def toggle_status(
    status_id: int,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    obj = db.query(ProjectStatus).filter(ProjectStatus.status_id == status_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Estado no encontrado")
    obj.is_active = not obj.is_active
    db.commit()
    db.refresh(obj)
    return obj
