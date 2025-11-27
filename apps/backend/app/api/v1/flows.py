from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.models.flow import Flow, FlowCreate, FlowUpdate, FlowResponse
from app.db.session import get_session
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[FlowResponse])
async def list_flows(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    statement = select(Flow).offset(skip).limit(limit)
    result = await session.execute(statement)
    flows = result.scalars().all()
    return flows

@router.post("/", response_model=FlowResponse)
async def create_flow(
    flow: FlowCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    db_flow = Flow(**flow.model_dump())
    user_id = current_user.get("id") or current_user.get("sub")
    db_flow.user_id = str(user_id) if user_id else None
    
    session.add(db_flow)
    await session.commit()
    await session.refresh(db_flow)
    return db_flow

@router.get("/{flow_id}", response_model=FlowResponse)
async def get_flow(
    flow_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    db_flow = await session.get(Flow, flow_id)
    if not db_flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return db_flow

@router.put("/{flow_id}", response_model=FlowResponse)
@router.patch("/{flow_id}", response_model=FlowResponse)
async def update_flow(
    flow_id: int,
    flow: FlowUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    db_flow = await session.get(Flow, flow_id)
    if not db_flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    flow_data = flow.model_dump(exclude_unset=True)
    for key, value in flow_data.items():
        setattr(db_flow, key, value)
    
    db_flow.updated_at = datetime.utcnow()
    session.add(db_flow)
    await session.commit()
    await session.refresh(db_flow)
    return db_flow

@router.delete("/{flow_id}")
async def delete_flow(
    flow_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    from app.models.execution import WorkflowExecution, NodeExecution
    
    db_flow = await session.get(Flow, flow_id)
    if not db_flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Delete related node_executions first (via workflow_executions)
    exec_stmt = select(WorkflowExecution).where(WorkflowExecution.flow_id == flow_id)
    exec_result = await session.execute(exec_stmt)
    executions = exec_result.scalars().all()
    
    for execution in executions:
        # Delete node executions
        node_stmt = select(NodeExecution).where(NodeExecution.workflow_execution_id == execution.id)
        node_result = await session.execute(node_stmt)
        node_executions = node_result.scalars().all()
        for node_exec in node_executions:
            await session.delete(node_exec)
        
        # Delete workflow execution
        await session.delete(execution)
    
    # Now delete the flow
    await session.delete(db_flow)
    await session.commit()
    return {"status": "success", "message": "Flow deleted"}

@router.post("/{flow_id}/archive")
async def archive_flow(
    flow_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Archive a flow (soft delete)"""
    from app.models.archive import Archive
    from app.utils.serializers import prepare_entity_for_archive
    
    db_flow = await session.get(Flow, flow_id)
    if not db_flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    user_id = current_user.get("id") or current_user.get("sub")
    
    # Create archive record with JSON-safe entity data
    archive = Archive(
        entity_type="flow",
        entity_id=flow_id,
        entity_data=prepare_entity_for_archive(db_flow),
        archived_by=str(user_id),
        archive_reason="Archived by user"
    )
    
    # Update flow status
    db_flow.status = "archived"
    db_flow.updated_at = datetime.utcnow()
    
    session.add(archive)
    session.add(db_flow)
    await session.commit()
    await session.refresh(db_flow)
    
    return db_flow

@router.post("/{flow_id}/duplicate")
async def duplicate_flow(
    flow_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Duplicate a flow"""
    original_flow = await session.get(Flow, flow_id)
    if not original_flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    user_id = current_user.get("id") or current_user.get("sub")
    
    new_flow = Flow(
        name=f"{original_flow.name} (Copy)",
        description=original_flow.description,
        status="draft",
        version=1,
        data=original_flow.data,
        user_id=str(user_id)
    )
    
    session.add(new_flow)
    await session.commit()
    await session.refresh(new_flow)
    return new_flow
