"""
Centralized WebSocket Manager
Handles all WebSocket connections and routing
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, Callable, Any
import asyncio
import json
from datetime import datetime


class ConnectionManager:
    """Manages WebSocket connections and message routing"""
    
    def __init__(self):
        # Active connections by type
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Connection metadata
        self.connection_info: Dict[WebSocket, Dict[str, Any]] = {}
        
    async def connect(self, websocket: WebSocket, connection_type: str, metadata: Dict[str, Any] = None):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        
        if connection_type not in self.active_connections:
            self.active_connections[connection_type] = set()
        
        self.active_connections[connection_type].add(websocket)
        self.connection_info[websocket] = {
            "type": connection_type,
            "connected_at": datetime.utcnow(),
            "metadata": metadata or {}
        }
        
        print(f"✅ WebSocket connected: {connection_type} (Total: {len(self.active_connections[connection_type])})")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if websocket in self.connection_info:
            conn_type = self.connection_info[websocket]["type"]
            
            if conn_type in self.active_connections:
                self.active_connections[conn_type].discard(websocket)
            
            del self.connection_info[websocket]
            print(f"🔌 WebSocket disconnected: {conn_type}")
    
    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """Send message to specific connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"❌ Failed to send message: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: Dict[str, Any], connection_type: str):
        """Broadcast message to all connections of a type"""
        if connection_type not in self.active_connections:
            return
        
        disconnected = set()
        for connection in self.active_connections[connection_type]:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"❌ Failed to broadcast: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected
        for conn in disconnected:
            self.disconnect(conn)
    
    def get_connections(self, connection_type: str) -> Set[WebSocket]:
        """Get all connections of a type"""
        return self.active_connections.get(connection_type, set())
    
    def get_connection_count(self, connection_type: str = None) -> int:
        """Get connection count"""
        if connection_type:
            return len(self.active_connections.get(connection_type, set()))
        return sum(len(conns) for conns in self.active_connections.values())


# Global instance
manager = ConnectionManager()
