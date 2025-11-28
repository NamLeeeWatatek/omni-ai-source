from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlmodel import select, func, col
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.models.flow import Flow, FlowCreate, FlowUpdate, FlowResponse
from app.db.session import get_session
from app.core.auth import get_current_user, get_current_active_user, require_permission, check_resource_ownership
from app.core.permissions import Permission, is_admin_role
from app.core.audit import log_action
from app.core.utils import to_int

router = APIRouter()

@router.get("/")
async def list_flows(
    # Pagination params
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    
    # Search & Filter params - ALL handled on backend
    search: Optional[str] = Query(None, description="Search in name and description"),
    status: Optional[str] = Query(None, description="Filter by status: draft, published, archived"),
    channel_id: Optional[int] = Query(None, description="Filter by channel"),
    
    # Sort params
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    
    current_user: dict = Depends(require_permission(Permission.FLOW_LIST.value)),
    session: AsyncSession = Depends(get_session)
):
    """
    Get paginated list of flows with search, filter, and sort
    ALL logic handled on backend - frontend only displays results
    Permission: FLOW_LIST
    """
    user_id = to_int(current_user["id"])
    user_role = current_user.get("role", "user")
    
    # Build base query
    query = select(Flow)
    
    # Non-admin users only see their own flows
    if not is_admin_role(user_role):
        query = query.where(Flow.owner_id == user_id)
    
    # Apply search - backend handles this
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (col(Flow.name).ilike(search_filter)) |
            (col(Flow.description).ilike(search_filter))
        )
    
    # Apply filters - backend handles this
    if status:
        query = query.where(Flow.status == status)
    if channel_id:
        query = query.where(Flow.channel_id == channel_id)
    
    # Count total before pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply sorting - backend handles this
    sort_column = getattr(Flow, sort_by, Flow.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute query
    result = await session.execute(query)
    flows = result.scalars().all()
    
    # Calculate pagination metadata
    total_pages = (total + page_size - 1) // page_size
    has_next = page < total_pages
    has_prev = page > 1
    
    # TODO: Enrich with execution stats (avoid N+1 queries)
    # For now, return flows as-is
    # In production, use JOIN or batch query to get executions count and success rate
    
    # Calculate aggregated stats for ALL flows (not just current page)
    from sqlalchemy import case
    
    stats_query = select(
        func.count(Flow.id).label('total'),
        func.sum(case((Flow.status == 'published', 1), else_=0)).label('active'),
        func.sum(case((Flow.status == 'draft', 1), else_=0)).label('draft'),
        func.sum(case((Flow.status == 'archived', 1), else_=0)).label('archived'),
    )
    stats_result = await session.execute(stats_query)
    stats_row = stats_result.first()
    
    # Return paginated response with stats
    return {
        "items": flows,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": has_next,
        "has_prev": has_prev,
        # Stats for all flows (calculated on backend)
        "stats": {
            "total": int(stats_row.total or 0),
            "active": int(stats_row.active or 0),
            "draft": int(stats_row.draft or 0),
            "archived": int(stats_row.archived or 0),
            "successRate": 0,  # TODO: Calculate from executions
            "avgDuration": 0,  # TODO: Calculate from executions
        }
    }

@router.post("/", response_model=FlowResponse)
async def create_flow(
    flow: FlowCreate,
    request: Request,
    current_user: dict = Depends(require_permission(Permission.FLOW_CREATE.value)),
    session: AsyncSession = Depends(get_session)
):
    """Create a new flow. Permission: FLOW_CREATE"""
    user_id = to_int(current_user["id"])
    
    db_flow = Flow(**flow.model_dump())
    db_flow.user_id = str(user_id)
    db_flow.owner_id = user_id
    
    session.add(db_flow)
    await session.commit()
    await session.refresh(db_flow)
    
    # Log action
    await log_action(
        session=session,
        user_id=user_id,
        action="create",
        resource_type="flow",
        resource_id=db_flow.id,
        details={"name": db_flow.name, "status": db_flow.status},
        request=request
    )
    
    return db_flow

@router.get("/{flow_id}", response_model=FlowResponse)
async def get_flow(
    flow_id: int,
    current_user: dict = Depends(require_permission(Permission.FLOW_READ.value)),
    session: AsyncSession = Depends(get_session)
):
    """Get a flow by ID. Permission: FLOW_READ"""
    db_flow = await session.get(Flow, flow_id)
    if not db_flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Check ownership for non-admin users
    user_role = current_user.get("role", "user")
    if not is_admin_role(user_role) and db_flow.owner_id:
        await check_resource_ownership(db_flow.owner_id, current_user)
    
    return db_flow

@router.put("/{flow_id}", response_model=FlowResponse)
@router.patch("/{flow_id}", response_model=FlowResponse)
async def update_flow(
    flow_id: int,
    flow: FlowUpdate,
    request: Request,
    current_user: dict = Depends(require_permission(Permission.FLOW_UPDATE.value)),
    session: AsyncSession = Depends(get_session)
):
    """Update a flow. Permission: FLOW_UPDATE"""
    user_id = to_int(current_user["id"])
    
    db_flow = await session.get(Flow, flow_id)
    if not db_flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Check ownership for non-admin users
    user_role = current_user.get("role", "user")
    if not is_admin_role(user_role) and db_flow.owner_id:
        await check_resource_ownership(db_flow.owner_id, current_user)
    
    flow_data = flow.model_dump(exclude_unset=True)
    for key, value in flow_data.items():
        setattr(db_flow, key, value)
    
    db_flow.updated_at = datetime.utcnow()
    session.add(db_flow)
    await session.commit()
    await session.refresh(db_flow)
    
    # Log action
    await log_action(
        session=session,
        user_id=user_id,
        action="update",
        resource_type="flow",
        resource_id=db_flow.id,
        details={"name": db_flow.name, "changes": list(flow_data.keys())},
        request=request
    )
    
    return db_flow

@router.delete("/{flow_id}")
async def delete_flow(
    flow_id: int,
    request: Request,
    current_user: dict = Depends(require_permission(Permission.FLOW_DELETE.value)),
    session: AsyncSession = Depends(get_session)
):
    """Delete a flow. Permission: FLOW_DELETE"""
    from app.models.execution import WorkflowExecution, NodeExecution
    
    user_id = to_int(current_user["id"])
    user_role = current_user.get("role", "user")
    
    db_flow = await session.get(Flow, flow_id)
    if not db_flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Check ownership for non-admin users
    if not is_admin_role(user_role) and db_flow.owner_id:
        await check_resource_ownership(db_flow.owner_id, current_user)
    
    flow_name = db_flow.name
    
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
    
    # Log action
    await log_action(
        session=session,
        user_id=user_id,
        action="delete",
        resource_type="flow",
        resource_id=flow_id,
        details={"name": flow_name},
        request=request
    )
    
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
