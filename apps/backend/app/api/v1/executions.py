from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.models.execution import WorkflowExecution, NodeExecution
from app.db.supabase import get_supabase
from app.core.auth import get_current_user
from app.services.gemini import gemini_service
from supabase import Client
from datetime import datetime
import asyncio

router = APIRouter()

async def process_workflow(execution_id: int, flow_data: Dict[str, Any], supabase: Client):
    """
    Process workflow nodes in background.
    This is a simplified execution engine.
    """
    try:
        nodes = flow_data.get("nodes", [])
        edges = flow_data.get("edges", [])
        
        # Simple sequential execution for demo
        # In reality, you'd build a graph and traverse it
        
        for node in nodes:
            node_id = node.get("id")
            node_type = node.get("type")
            node_data = node.get("data", {})
            
            # Create node execution record
            node_exec_data = {
                "workflow_execution_id": execution_id,
                "node_id": node_id,
                "node_type": node_type,
                "node_label": node_data.get("label", node_type),
                "status": "running",
                "started_at": datetime.utcnow().isoformat(),
                "input_data": node_data
            }
            node_res = supabase.table("node_executions").insert(node_exec_data).execute()
            node_exec_id = node_res.data[0]["id"]
            
            # Execute logic based on type
            output_data = {}
            error = None
            
            try:
                if node_type == "ai-generate":
                    prompt = node_data.get("prompt", "")
                    result = await gemini_service.generate_content(prompt)
                    output_data = {"result": result}
                
                # Add other node types here (Qdrant, Cloudinary, etc.)
                
                # Simulate processing time
                await asyncio.sleep(1) 
                
                status = "completed"
            except Exception as e:
                error = str(e)
                status = "failed"
            
            # Update node execution
            supabase.table("node_executions").update({
                "status": status,
                "completed_at": datetime.utcnow().isoformat(),
                "output_data": output_data,
                "error_message": error
            }).eq("id", node_exec_id).execute()
            
            if status == "failed":
                raise Exception(f"Node {node_id} failed: {error}")

        # Update workflow execution
        supabase.table("workflow_executions").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "completed_nodes": len(nodes)
        }).eq("id", execution_id).execute()

    except Exception as e:
         supabase.table("workflow_executions").update({
            "status": "failed",
            "completed_at": datetime.utcnow().isoformat(),
            "error_message": str(e)
        }).eq("id", execution_id).execute()

@router.post("/{flow_id}/execute")
async def execute_flow(
    flow_id: int,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Get flow definition
    flow_res = supabase.table("flows").select("*").eq("id", flow_id).execute()
    if not flow_res.data:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    flow = flow_res.data[0]
    
    # Create execution record
    exec_data = {
        "flow_version_id": flow.get("version", 1), # Should link to actual version table
        "status": "running",
        "started_at": datetime.utcnow().isoformat(),
        "total_nodes": len(flow.get("data", {}).get("nodes", [])),
        "input_data": {}
    }
    
    res = supabase.table("workflow_executions").insert(exec_data).execute()
    execution = res.data[0]
    
    background_tasks.add_task(process_workflow, execution["id"], flow.get("data", {}), supabase)
    
    return execution

@router.get("/", response_model=List[WorkflowExecution])
async def list_executions(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("workflow_executions").select("*").range(skip, skip + limit - 1).execute()
    return response.data

@router.get("/{execution_id}", response_model=WorkflowExecution)
async def get_execution(
    execution_id: int,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("workflow_executions").select("*").eq("id", execution_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Execution not found")
    return response.data[0]
