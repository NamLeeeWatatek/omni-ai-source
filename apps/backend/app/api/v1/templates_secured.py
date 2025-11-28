"""
Secured Templates API with RBAC and Audit Logging
Replace the content of templates.py with this file
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.models.template import WorkflowTemplate
from typing import List, Optional
from datetime import datetime
from app.core.auth import require_permission
from app.core.permissions import Permission
from app.core.audit import log_action
from app.core.utils import to_int

router = APIRouter()


class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "general"
    nodes: List[dict]
    edges: List[dict]
    flow_id: Optional[int] = None


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    nodes: Optional[List[dict]] = None
    edges: Optional[List[dict]] = None


class TemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    nodes: List[dict]
    edges: List[dict]
    flow_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    category: Optional[str] = None,
    current_user: dict = Depends(require_permission(Permission.TEMPLATE_LIST.value)),
    session: AsyncSession = Depends(get_session)
):
    """List all workflow templates. Permission: TEMPLATE_LIST"""
    query = select(WorkflowTemplate)
    
    if category:
        query = query.where(WorkflowTemplate.category == category)
    
    query = query.order_by(WorkflowTemplate.created_at.desc())
    
    result = await session.execute(query)
    templates = result.scalars().all()
    
    return templates


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    current_user: dict = Depends(require_permission(Permission.TEMPLATE_READ.value)),
    session: AsyncSession = Depends(get_session)
):
    """Get a specific template. Permission: TEMPLATE_READ"""
    template = await session.get(WorkflowTemplate, template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template


@router.post("/", response_model=TemplateResponse)
async def create_template(
    data: TemplateCreate,
    request: Request,
    current_user: dict = Depends(require_permission(Permission.TEMPLATE_CREATE.value)),
    session: AsyncSession = Depends(get_session)
):
    """Create a new workflow template. Permission: TEMPLATE_CREATE"""
    user_id = to_int(current_user["id"])
    
    template = WorkflowTemplate(**data.model_dump())
    session.add(template)
    await session.commit()
    await session.refresh(template)
    
    # Log action
    await log_action(
        session=session,
        user_id=user_id,
        action="create",
        resource_type="template",
        resource_id=template.id,
        details={"name": template.name, "category": template.category},
        request=request
    )
    
    return template


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    data: TemplateUpdate,
    request: Request,
    current_user: dict = Depends(require_permission(Permission.TEMPLATE_UPDATE.value)),
    session: AsyncSession = Depends(get_session)
):
    """Update a template. Permission: TEMPLATE_UPDATE"""
    user_id = to_int(current_user["id"])
    
    template = await session.get(WorkflowTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)
    
    template.updated_at = datetime.utcnow()
    session.add(template)
    await session.commit()
    await session.refresh(template)
    
    # Log action
    await log_action(
        session=session,
        user_id=user_id,
        action="update",
        resource_type="template",
        resource_id=template.id,
        details={"name": template.name, "changes": list(update_data.keys())},
        request=request
    )
    
    return template


@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    request: Request,
    current_user: dict = Depends(require_permission(Permission.TEMPLATE_DELETE.value)),
    session: AsyncSession = Depends(get_session)
):
    """Delete a template. Permission: TEMPLATE_DELETE"""
    user_id = to_int(current_user["id"])
    
    template = await session.get(WorkflowTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template_name = template.name
    
    await session.delete(template)
    await session.commit()
    
    # Log action
    await log_action(
        session=session,
        user_id=user_id,
        action="delete",
        resource_type="template",
        resource_id=template_id,
        details={"name": template_name},
        request=request
    )
    
    return {"message": "Template deleted successfully"}


@router.post("/{template_id}/duplicate", response_model=TemplateResponse)
async def duplicate_template(
    template_id: int,
    request: Request,
    current_user: dict = Depends(require_permission(Permission.TEMPLATE_CREATE.value)),
    session: AsyncSession = Depends(get_session)
):
    """Duplicate a template. Permission: TEMPLATE_CREATE"""
    user_id = to_int(current_user["id"])
    
    original = await session.get(WorkflowTemplate, template_id)
    if not original:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Create duplicate
    duplicate = WorkflowTemplate(
        name=f"{original.name} (Copy)",
        description=original.description,
        category=original.category,
        nodes=original.nodes,
        edges=original.edges,
        flow_id=None  # Don't link to original flow
    )
    
    session.add(duplicate)
    await session.commit()
    await session.refresh(duplicate)
    
    # Log action
    await log_action(
        session=session,
        user_id=user_id,
        action="duplicate",
        resource_type="template",
        resource_id=duplicate.id,
        details={"name": duplicate.name, "original_id": template_id},
        request=request
    )
    
    return duplicate
