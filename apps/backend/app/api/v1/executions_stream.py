"""
Real-time Workflow Execution with Server-Sent Events (SSE)
Following n8n architecture pattern
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
import json
import asyncio
from datetime import datetime

from app.core.auth import get_current_user
from app.services.flow_executor import FlowExecutor

router = APIRouter()


class ExecuteStreamRequest(BaseModel):
    flow_id: int
    input_data: Optional[dict] = None


async def execution_event_stream(
    flow_id: int,
    input_data: dict,
    user_id: str
) -> AsyncGenerator[str, None]:
    """
    Stream execution events in SSE format
    Format: data: {json}\n\n
    """
    
    try:
        # Initialize executor
        executor = FlowExecutor()
        
        # Send start event
        yield f"data: {json.dumps({
            'type': 'executionStarted',
            'data': {
                'executionId': None,  # Will be set after creation
                'startedAt': datetime.utcnow().isoformat()
            }
        })}\n\n"
        
        # Execute workflow with callbacks
        print(f"📡 [SSE] Starting event stream for flow_id={flow_id}")
        async for event in executor.execute_with_events(flow_id, input_data, user_id):
            # Stream each event immediately
            print(f"📤 [SSE] Sending event: {event['type']}")
            event_data = f"data: {json.dumps(event)}\n\n"
            yield event_data
            
            # Force flush by yielding control
            await asyncio.sleep(0)
        
        # Send completion event
        yield f"data: {json.dumps({
            'type': 'executionFinished',
            'data': {
                'finishedAt': datetime.utcnow().isoformat()
            }
        })}\n\n"
        
    except Exception as e:
        # Send error event
        yield f"data: {json.dumps({
            'type': 'executionError',
            'data': {
                'error': str(e)
            }
        })}\n\n"


@router.post("/stream")
async def execute_workflow_stream(
    request: ExecuteStreamRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Execute workflow with real-time SSE updates
    
    Event types:
    - executionStarted: Workflow execution started
    - nodeExecutionBefore: Node about to execute
    - nodeExecutionAfter: Node execution completed
    - executionFinished: Workflow completed
    - executionError: Error occurred
    """
    
    return StreamingResponse(
        execution_event_stream(
            flow_id=request.flow_id,
            input_data=request.input_data or {},
            user_id=current_user['sub']
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )
