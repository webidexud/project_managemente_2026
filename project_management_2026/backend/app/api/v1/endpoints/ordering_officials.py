from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.database import get_db
from app.models.catalogs import OrderingOfficial
from app.schemas.catalogs import (
    OrderingOfficialCreate,
    OrderingOfficialUpdate,
    OrderingOfficialOut,
)
from app.core.deps import get_current_user
from app.models.catalogs import AppUser

router = APIRouter(prefix="/ordering-officials", tags=["Funcionarios Ordenadores"])


def build_full_name(obj: OrderingOfficial) -> str:
    parts = [obj.first_name, obj.second_name, obj.first_surname, obj.second_surname]
    return " ".join(p for p in parts if p)


@router.get("/", response_model=List[OrderingOfficialOut])
def list_officials(
    active_only: bool = False,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    q = db.query(OrderingOfficial)
    if active_only:
        q = q.filter(OrderingOfficial.is_active == True)
    results = q.order_by(OrderingOfficial.first_surname).all()
    out = []
    for r in results:
        item = OrderingOfficialOut.model_validate(r)
        item.full_name = build_full_name(r)
        out.append(item)
    return out


@router.post("/", response_model=OrderingOfficialOut, status_code=201)
def create_official(
    data: OrderingOfficialCreate,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
):
    existing = db.query(OrderingOfficial).filter(
        OrderingOfficial.identification_type == data.identification_type,
        OrderingOfficial.identification_number == data.identification_number,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un funcionario con ese número de identificación")
    obj = OrderingOfficial(**data.model_dump(), created_by_user_id=current_user.user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    item = OrderingOfficialOut.model_validate(obj)
    item.full_name = build_full_name(obj)
    return item


@router.get("/{official_id}", response_model=OrderingOfficialOut)
def get_official(
    official_id: int,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    obj = db.query(OrderingOfficial).filter(OrderingOfficial.official_id == official_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Funcionario no encontrado")
    item = OrderingOfficialOut.model_validate(obj)
    item.full_name = build_full_name(obj)
    return item


@router.put("/{official_id}", response_model=OrderingOfficialOut)
def update_official(
    official_id: int,
    data: OrderingOfficialUpdate,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
):
    obj = db.query(OrderingOfficial).filter(OrderingOfficial.official_id == official_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Funcionario no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    obj.updated_at = datetime.utcnow()
    obj.updated_by_user_id = current_user.user_id
    db.commit()
    db.refresh(obj)
    item = OrderingOfficialOut.model_validate(obj)
    item.full_name = build_full_name(obj)
    return item


@router.patch("/{official_id}/toggle", response_model=OrderingOfficialOut)
def toggle_official(
    official_id: int,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
):
    obj = db.query(OrderingOfficial).filter(OrderingOfficial.official_id == official_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Funcionario no encontrado")
    obj.is_active = not obj.is_active
    obj.updated_at = datetime.utcnow()
    obj.updated_by_user_id = current_user.user_id
    db.commit()
    db.refresh(obj)
    item = OrderingOfficialOut.model_validate(obj)
    item.full_name = build_full_name(obj)
    return item
