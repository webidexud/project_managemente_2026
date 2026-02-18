from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.catalogs import EntityType
from app.schemas.catalogs import EntityTypeCreate, EntityTypeUpdate, EntityTypeOut
from app.core.deps import get_current_user
from app.models.catalogs import AppUser

router = APIRouter(prefix="/entity-types", tags=["Tipos de Entidad"])


@router.get("/", response_model=List[EntityTypeOut])
def list_entity_types(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    q = db.query(EntityType)
    if active_only:
        q = q.filter(EntityType.is_active == True)
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=EntityTypeOut, status_code=201)
def create_entity_type(
    data: EntityTypeCreate,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
):
    existing = db.query(EntityType).filter(EntityType.type_name == data.type_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tipo de entidad ya existe")
    obj = EntityType(**data.model_dump(), created_by_user_id=current_user.user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{entity_type_id}", response_model=EntityTypeOut)
def get_entity_type(
    entity_type_id: int,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    obj = db.query(EntityType).filter(EntityType.entity_type_id == entity_type_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Tipo de entidad no encontrado")
    return obj


@router.put("/{entity_type_id}", response_model=EntityTypeOut)
def update_entity_type(
    entity_type_id: int,
    data: EntityTypeUpdate,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    obj = db.query(EntityType).filter(EntityType.entity_type_id == entity_type_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Tipo de entidad no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.patch("/{entity_type_id}/toggle", response_model=EntityTypeOut)
def toggle_entity_type(
    entity_type_id: int,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    obj = db.query(EntityType).filter(EntityType.entity_type_id == entity_type_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Tipo de entidad no encontrado")
    obj.is_active = not obj.is_active
    db.commit()
    db.refresh(obj)
    return obj
