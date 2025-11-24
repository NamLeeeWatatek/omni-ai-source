from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.flow import Flow, FlowCreate, FlowUpdate, FlowResponse
from app.db.supabase import get_supabase
from app.core.auth import get_current_user
from supabase import Client

router = APIRouter()

@router.get("/", response_model=List[FlowResponse])
async def list_flows(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Filter by user_id if needed, or RLS handles it
    response = supabase.table("flows").select("*").range(skip, skip + limit - 1).execute()
    return response.data

@router.post("/", response_model=FlowResponse)
async def create_flow(
    flow: FlowCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    flow_data = flow.dict()
    flow_data["user_id"] = current_user.get("id") # Assuming Casdoor returns 'id' or 'sub'
    
    response = supabase.table("flows").insert(flow_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Could not create flow")
    return response.data[0]

@router.get("/{flow_id}", response_model=FlowResponse)
async def get_flow(
    flow_id: int,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("flows").select("*").eq("id", flow_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Flow not found")
    return response.data[0]

@router.put("/{flow_id}", response_model=FlowResponse)
async def update_flow(
    flow_id: int,
    flow: FlowUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("flows").update(flow.dict(exclude_unset=True)).eq("id", flow_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Flow not found")
    return response.data[0]

@router.delete("/{flow_id}")
async def delete_flow(
    flow_id: int,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("flows").delete().eq("id", flow_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Flow not found")
    return {"message": "Flow deleted successfully"}
