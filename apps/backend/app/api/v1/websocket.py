"""
Centralized WebSocket Router
All WebSocket endpoints in one place
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

from app.core.websocket_manager import manager
from app.services.flow_executor import FlowExecutor
from app.db.session import get_session

router = APIRouter()


@router.websocket("/ws/execute/{flow_id}")
async def ws_execute_workflow(websocket: WebSocket, flow_id: int):
    """
    WebSocket endpoint for real-time workflow execution
    
    Client sends: {"action": "start", "input_data": {...}}
    Server sends: {"type": "nodeExecutionBefore", "data": {...}}
    """
    await manager.connect(websocket, "execution", {"flow_id": flow_id})
    
    try:
        # Wait for start command
        data = await websocket.receive_json()
        
        if data.get("action") != "start":
            await manager.send_personal_message({
                "type": "error",
                "data": {"message": "Expected 'start' action"}
            }, websocket)
            return
        
        input_data = data.get("input_data", {})
        
        # Send started event
        await manager.send_personal_message({
            "type": "executionStarted",
            "data": {"flowId": flow_id}
        }, websocket)
        
        # Get database session and execute
        async for session in get_session():
            executor = FlowExecutor(session)
            
            try:
                # Execute with events
                async for event in executor.execute_with_events(flow_id, input_data, "websocket_user"):
                    await manager.send_personal_message(event, websocket)
                    await asyncio.sleep(0.01)
                
                # Send finished event
                await manager.send_personal_message({
                    "type": "executionFinished",
                    "data": {"flowId": flow_id}
                }, websocket)
                
            except Exception as e:
                # Send error event
                await manager.send_personal_message({
                    "type": "executionError",
                    "data": {"error": str(e)}
                }, websocket)
            
            break
        
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await manager.send_personal_message({
                "type": "error",
                "data": {"message": str(e)}
            }, websocket)
        except:
            pass
    finally:
        manager.disconnect(websocket)


@router.websocket("/ws/notifications")
async def ws_notifications(websocket: WebSocket):
    """
    WebSocket endpoint for real-time notifications
    Future: System notifications, alerts, etc.
    """
    await manager.connect(websocket, "notifications")
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            
            # Echo for now (implement notification logic later)
            await manager.send_personal_message({
                "type": "notification",
                "data": {"message": "Notifications endpoint ready"}
            }, websocket)
            
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)


@router.websocket("/ws/chat/{conversation_id}")
async def ws_chat(websocket: WebSocket, conversation_id: int):
    """
    WebSocket endpoint for real-time AI chat
    Future: Streaming AI responses
    """
    await manager.connect(websocket, "chat", {"conversation_id": conversation_id})
    
    try:
        await manager.send_personal_message({
            "type": "connected",
            "data": {"message": "Chat endpoint ready"}
        }, websocket)
        
        while True:
            data = await websocket.receive_json()
            
            # Future: Handle chat messages
            await manager.send_personal_message({
                "type": "message",
                "data": {"echo": data}
            }, websocket)
            
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)


@router.get("/ws/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    return {
        "total_connections": manager.get_connection_count(),
        "by_type": {
            "execution": manager.get_connection_count("execution"),
            "notifications": manager.get_connection_count("notifications"),
            "chat": manager.get_connection_count("chat")
        }
    }
