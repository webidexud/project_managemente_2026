from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.catalogs import EntityType
from app.schemas.catalogs import EntityTypeOut, EntityTypeCreate, EntityTypeUpdate

router = APIRouter(prefix="/entity-types", tags=["Tipos de Entidad"])

@router.get("/", response_model=List[EntityTypeOut])
def list(active_only: bool = False, db: Session = Depends(get_db)):
    q = db.query(EntityType)
    if active_only: q = q.filter(EntityType.is_active == True)
    return q.order_by(EntityType.type_name).all()

@router.post("/", response_model=EntityTypeOut, status_code=201)
def create(data: EntityTypeCreate, db: Session = Depends(get_db)):
    if db.query(EntityType).filter(EntityType.type_name == data.type_name).first():
        raise HTTPException(400, "Ya existe un tipo de entidad con ese nombre")
    obj = EntityType(**data.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.put("/{id}", response_model=EntityTypeOut)
def update(id: int, data: EntityTypeUpdate, db: Session = Depends(get_db)):
    obj = db.query(EntityType).filter(EntityType.entity_type_id == id).first()
    if not obj: raise HTTPException(404, "No encontrado")
    for k, v in data.model_dump(exclude_unset=True).items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.patch("/{id}/toggle", response_model=EntityTypeOut)
def toggle(id: int, db: Session = Depends(get_db)):
    obj = db.query(EntityType).filter(EntityType.entity_type_id == id).first()
    if not obj: raise HTTPException(404, "No encontrado")
    obj.is_active = not obj.is_active
    db.commit(); db.refresh(obj)
    return obj
