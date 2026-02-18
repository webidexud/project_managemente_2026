from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    entity_types,
    financing_types,
    ordering_officials,
    project_statuses,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(entity_types.router)
api_router.include_router(financing_types.router)
api_router.include_router(ordering_officials.router)
api_router.include_router(project_statuses.router)
