# v3.0 — REEMPLAZA: backend/app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1.endpoints import (
    project_emails,
    entities, entity_types, executing_departments,
    execution_modalities, financing_types,
    ordering_officials, project_statuses, projects, rup,
    project_modifications,  # endpoint original existente
)
from app.api.v1.endpoints import modifications  # nuevo v3.0

api_router = APIRouter()
api_router.include_router(entities.router)
api_router.include_router(entity_types.router)
api_router.include_router(executing_departments.router)
api_router.include_router(execution_modalities.router)
api_router.include_router(financing_types.router)
api_router.include_router(ordering_officials.router)
api_router.include_router(project_statuses.router)
api_router.include_router(projects.router)
api_router.include_router(rup.router)
api_router.include_router(project_emails.router)
api_router.include_router(project_modifications.router)  # existente
api_router.include_router(modifications.router)          # nuevo v3.0
