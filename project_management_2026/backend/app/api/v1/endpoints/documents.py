# backend/app/api/v1/endpoints/documents.py — v1.0
"""
Endpoints de documentos de proyectos.

Rutas:
  GET    /projects/{project_id}/documents/           → listar documentos
  POST   /projects/{project_id}/documents/upload     → subir un PDF
  GET    /documents/{document_id}/download           → descargar archivo
  DELETE /documents/{document_id}                    → eliminar (soft delete)
  GET    /document-types/                            → listar tipos de documentos
"""
import os
import shutil
from datetime import datetime, date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.catalogs import Project
from app.models.project_document import ProjectDocument, ProjectDocumentType

router = APIRouter(tags=["Documentos"])

# Directorio donde se guardan los archivos físicos
UPLOAD_DIR = "/app/uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Nomenclatura → tipo de documento ─────────────────────────────────
# El sistema detecta el código en el nombre del archivo (case-insensitive)
# Orden importa: primeros los más específicos
NOMENCLATURE_MAP = [
    ("PRESUP", "PRESUP"),
    ("PROP",   "PROP"),
    ("CONT",   "CONT"),
    ("MEMO",   "MEMO"),
    ("OFIC",   "OFIC"),
    ("PLAN",   "PLAN"),
    ("CERT",   "CERT"),
    ("POL",    "POL"),
    ("CDP",    "CDP"),
    ("INF",    "INF"),
    ("RES",    "RES"),
    ("OT",     "OT"),
    ("RP",     "RP"),
    ("AL",     "AL"),
    ("AR",     "AR"),
    ("AS",     "AS"),
    ("AF",     "AF"),
    ("AI",     "AI"),
]


def detect_type_code(filename: str) -> str:
    """Detecta el tipo de documento por la nomenclatura en el nombre del archivo."""
    name_upper = filename.upper()
    # Quitar extensión
    base = os.path.splitext(name_upper)[0]
    # Separadores comunes: _, -, espacio, punto
    parts = [p for p in base.replace('-', '_').replace(' ', '_').replace('.', '_').split('_') if p]

    for code, _ in NOMENCLATURE_MAP:
        if code in parts or base.startswith(code):
            return code
    return "OTRO"


def get_type_id_by_code(code: str, db: Session) -> int:
    """Obtiene el document_type_id por type_code, fallback a OTRO."""
    dt = db.query(ProjectDocumentType).filter(ProjectDocumentType.type_code == code).first()
    if dt:
        return dt.document_type_id
    # Fallback: OTRO
    otro = db.query(ProjectDocumentType).filter(ProjectDocumentType.type_code == 'OTRO').first()
    if otro:
        return otro.document_type_id
    raise HTTPException(500, "Tipo de documento 'OTRO' no configurado. Ejecuta el seed SQL.")


def next_doc_number(db: Session, year: int, internal_num: int) -> int:
    mx = db.query(func.max(ProjectDocument.document_number)) \
        .filter(
            ProjectDocument.project_year == year,
            ProjectDocument.internal_project_number == internal_num,
        ).scalar()
    return (mx or 0) + 1


def doc_to_dict(d: ProjectDocument, db: Session) -> dict:
    dt = db.query(ProjectDocumentType).filter(ProjectDocumentType.document_type_id == d.document_type_id).first()
    return {
        "document_id":             d.document_id,
        "project_year":            d.project_year,
        "internal_project_number": d.internal_project_number,
        "document_number":         d.document_number,
        "document_type_id":        d.document_type_id,
        "type_code":               dt.type_code if dt else None,
        "type_name":               dt.type_name if dt else None,
        "document_name":           d.document_name,
        "document_description":    d.document_description,
        "document_date":           str(d.document_date) if d.document_date else None,
        "original_filename":       d.original_filename,
        "file_extension":          d.file_extension,
        "file_size":               d.file_size,
        "document_status":         d.document_status,
        "observations":            d.observations,
        "is_confidential":         d.is_confidential,
        "is_active":               d.is_active,
        "created_at":              str(d.created_at) if d.created_at else None,
    }


# ── GET /document-types/ ─────────────────────────────────────────────
@router.get("/document-types/")
def list_document_types(db: Session = Depends(get_db)):
    return db.query(ProjectDocumentType) \
        .filter(ProjectDocumentType.is_active == True) \
        .order_by(ProjectDocumentType.type_name).all()


# ── GET /projects/{project_id}/documents/ ────────────────────────────
@router.get("/projects/{project_id}/documents/")
def list_documents(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(404, "Proyecto no encontrado")

    docs = db.query(ProjectDocument) \
        .filter(
            ProjectDocument.project_year == proj.project_year,
            ProjectDocument.internal_project_number == proj.internal_project_number,
            ProjectDocument.is_active == True,
        ) \
        .order_by(ProjectDocument.document_number).all()

    return [doc_to_dict(d, db) for d in docs]


# ── POST /projects/{project_id}/documents/upload ─────────────────────
@router.post("/projects/{project_id}/documents/upload")
async def upload_document(
    project_id:   int,
    file:         UploadFile = File(...),
    document_date: str       = Form(None),
    observations:  str       = Form(None),
    override_type: str       = Form(None),   # type_code manual (opcional)
    db:            Session   = Depends(get_db),
):
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(404, "Proyecto no encontrado")

    # Solo PDFs
    ext = os.path.splitext(file.filename or '')[-1].lower()
    if ext not in ('.pdf',):
        raise HTTPException(400, f"Solo se permiten archivos PDF. Recibido: '{ext}'")

    # Detectar tipo por nomenclatura (o usar el manual)
    type_code = override_type.upper() if override_type else detect_type_code(file.filename)
    type_id   = get_type_id_by_code(type_code, db)

    doc_num = next_doc_number(db, proj.project_year, proj.internal_project_number)

    # Nombre físico: year_internal_docnum_original.pdf
    safe_name   = f"{proj.project_year}_{proj.internal_project_number}_{doc_num}_{file.filename}"
    safe_name   = safe_name.replace(' ', '_')
    file_path   = os.path.join(UPLOAD_DIR, safe_name)

    # Guardar en disco
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    file_size = os.path.getsize(file_path)

    # Nombre descriptivo = nombre del archivo sin extensión
    doc_name = os.path.splitext(file.filename)[0][:200]

    # Parsear fecha opcional
    doc_date = None
    if document_date:
        try:
            doc_date = date.fromisoformat(document_date)
        except ValueError:
            pass

    doc = ProjectDocument(
        project_year=proj.project_year,
        internal_project_number=proj.internal_project_number,
        document_number=doc_num,
        document_type_id=type_id,
        document_name=doc_name,
        document_description=observations,
        document_date=doc_date,
        file_path=file_path,
        original_filename=file.filename,
        file_extension='pdf',
        file_size=file_size,
        document_status='ACTIVE',
        observations=observations,
        is_active=True,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc_to_dict(doc, db)


# ── GET /documents/{document_id}/download ────────────────────────────
@router.get("/documents/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(ProjectDocument).filter(
        ProjectDocument.document_id == document_id,
        ProjectDocument.is_active == True,
    ).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(404, "Archivo físico no encontrado en el servidor")

    return FileResponse(
        path=doc.file_path,
        filename=doc.original_filename or f"documento_{document_id}.pdf",
        media_type="application/pdf",
    )


# ── DELETE /documents/{document_id} ──────────────────────────────────
@router.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(ProjectDocument).filter(ProjectDocument.document_id == document_id).first()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    doc.is_active  = False
    doc.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "document_id": document_id}
