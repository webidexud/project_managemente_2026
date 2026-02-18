from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.catalogs import FinancingType
from app.schemas.catalogs import FinancingTypeCreate, FinancingTypeUpdate, FinancingTypeOut
from app.core.deps import get_current_user
from app.models.catalogs import AppUser

router = APIRouter(prefix="/financing-types", tags=["Tipos de Financiación"])


@router.get("/", response_model=List[FinancingTypeOut])
def list_financing_types(
    active_only: bool = False,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    q = db.query(FinancingType)
    if active_only:
        q = q.filter(FinancingType.is_active == True)
    return q.all()


@router.post("/", response_model=FinancingTypeOut, status_code=201)
def create_financing_type(
    data: FinancingTypeCreate,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    existing = db.query(FinancingType).filter(FinancingType.financing_name == data.financing_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tipo de financiación ya existe")
    obj = FinancingType(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{financing_type_id}", response_model=FinancingTypeOut)
def get_financing_type(
    financing_type_id: int,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    obj = db.query(FinancingType).filter(FinancingType.financing_type_id == financing_type_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="No encontrado")
    return obj


@router.put("/{financing_type_id}", response_model=FinancingTypeOut)
def update_financing_type(
    financing_type_id: int,
    data: FinancingTypeUpdate,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    obj = db.query(FinancingType).filter(FinancingType.financing_type_id == financing_type_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="No encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.patch("/{financing_type_id}/toggle", response_model=FinancingTypeOut)
def toggle_financing_type(
    financing_type_id: int,
    db: Session = Depends(get_db),
    _: AppUser = Depends(get_current_user),
):
    obj = db.query(FinancingType).filter(FinancingType.financing_type_id == financing_type_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="No encontrado")
    obj.is_active = not obj.is_active
    db.commit()
    db.refresh(obj)
    return obj
