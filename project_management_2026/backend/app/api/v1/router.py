from fastapi import APIRouter
from app.api.v1.endpoints import (
    entities, entity_types, executing_departments,
    execution_modalities, financing_types,
    ordering_officials, project_statuses, projects, rup,
)

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
