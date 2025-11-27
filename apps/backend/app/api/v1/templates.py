from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from app.db.session import get_session
from app.core.auth import get_current_user
from app.models.flow_template import (
    FlowTemplate,
    FlowTemplateCreate,
    FlowTemplateUpdate,
    FlowTemplateResponse
)

router = APIRouter()

@router.get("/", response_model=List[FlowTemplateResponse])
async def list_templates(
    category: Optional[str] = Query(None),
    is_public: Optional[bool] = Query(None),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """List flow templates"""
    user_id = current_user.get("id")
    
    query = select(FlowTemplate)
    
    # Filter by category
    if category:
        query = query.where(FlowTemplate.category == category)
    
    # Show public templates + user's own templates
    if is_public is not None:
        query = query.where(FlowTemplate.is_public == is_public)
    else:
        query = query.where(
            (FlowTemplate.is_public == True) | (FlowTemplate.created_by == user_id)
        )
    
    result = await session.execute(query)
    return result.scalars().all()

@router.post("/", response_model=FlowTemplateResponse)
async def create_template(
    template: FlowTemplateCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create a new flow template"""
    user_id = current_user.get("id")
    
    new_template = FlowTemplate(
        **template.model_dump(),
        created_by=user_id
    )
    session.add(new_template)
    await session.commit()
    await session.refresh(new_template)
    return new_template

@router.get("/{template_id}", response_model=FlowTemplateResponse)
async def get_template(
    template_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get a specific template"""
    user_id = current_user.get("id")
    
    template = await session.get(FlowTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check access: public or owned by user
    if not template.is_public and template.created_by != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return template

@router.put("/{template_id}", response_model=FlowTemplateResponse)
async def update_template(
    template_id: int,
    template_update: FlowTemplateUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update a template"""
    user_id = current_user.get("id")
    
    template = await session.get(FlowTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if template.created_by != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for key, value in template_update.model_dump(exclude_unset=True).items():
        setattr(template, key, value)
    
    template.updated_at = datetime.utcnow()
    session.add(template)
    await session.commit()
    await session.refresh(template)
    return template

@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete a template"""
    user_id = current_user.get("id")
    
    template = await session.get(FlowTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if template.created_by != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await session.delete(template)
    await session.commit()
    return {"status": "success"}

@router.post("/{template_id}/use")
async def use_template(
    template_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Increment usage count when template is used"""
    template = await session.get(FlowTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template.usage_count += 1
    session.add(template)
    await session.commit()
    return {"status": "success", "usage_count": template.usage_count}

@router.post("/seed")
async def seed_templates(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Seed default workflow templates from workflow_templates.py"""
    from app.data.workflow_templates import WORKFLOW_TEMPLATES
    
    user_id = current_user.get("id")
    
    # Check if templates already exist
    result = await session.execute(select(FlowTemplate))
    existing = result.scalars().all()
    if len(existing) > 0:
        return {"status": "success", "message": "Templates already seeded", "count": len(existing)}
    
    # Convert workflow templates to database format
    created_templates = []
    for template_id, template_data in WORKFLOW_TEMPLATES.items():
        db_template = FlowTemplate(
            name=template_data["name"],
            description=template_data["description"],
            category=template_data.get("category", "general"),
            icon="FiZap",  # Default icon
            is_public=True,
            created_by=user_id,
            template_data={
                "nodes": template_data["nodes"],
                "edges": template_data["edges"]
            }
        )
        session.add(db_template)
        created_templates.append(db_template)
    
    await session.commit()
    
    return {
        "status": "success",
        "message": f"Seeded {len(created_templates)} templates",
        "count": len(created_templates)
    }

@router.post("/reseed")
async def reseed_templates(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Force re-seed all default templates (delete existing and recreate)"""
    from app.data.workflow_templates import WORKFLOW_TEMPLATES
    
    user_id = current_user.get("id")
    
    # Delete all existing public templates
    result = await session.execute(
        select(FlowTemplate).where(FlowTemplate.is_public == True)
    )
    existing_templates = result.scalars().all()
    
    for template in existing_templates:
        await session.delete(template)
    
    await session.commit()
    
    # Convert workflow templates to database format
    created_templates = []
    for template_id, template_data in WORKFLOW_TEMPLATES.items():
        db_template = FlowTemplate(
            name=template_data["name"],
            description=template_data["description"],
            category=template_data.get("category", "general"),
            icon="FiZap",  # Default icon
            is_public=True,
            created_by=user_id,
            template_data={
                "nodes": template_data["nodes"],
                "edges": template_data["edges"]
            }
        )
        session.add(db_template)
        created_templates.append(db_template)
    
    await session.commit()
    
    return {
        "status": "success",
        "message": f"Re-seeded {len(created_templates)} templates (deleted {len(existing_templates)} old templates)",
        "deleted": len(existing_templates),
        "created": len(created_templates)
    }

