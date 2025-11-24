from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
import random

router = APIRouter()

class NodeSuggestion(BaseModel):
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]
    reason: str

class SuggestRequest(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class SuggestResponse(BaseModel):
    suggestions: List[NodeSuggestion]

@router.post("/suggest-next-node", response_model=SuggestResponse)
async def suggest_next_node(data: SuggestRequest):
    """AI-powered node suggestion based on current flow"""
    
    # Simple rule-based suggestions (replace with actual AI logic)
    suggestions = []
    
    # Analyze current flow
    node_types = [node.get("type") for node in data.nodes]
    
    # Suggest based on what's missing
    if "start" in node_types and "message" not in node_types:
        suggestions.append({
            "type": "message",
            "position": {"x": 250, "y": 150},
            "data": {"label": "Welcome Message"},
            "reason": "Add a welcome message to greet users"
        })
    elif "message" in node_types and "ai-reply" not in node_types:
        suggestions.append({
            "type": "ai-reply",
            "position": {"x": 250, "y": 250},
            "data": {"label": "AI Response"},
            "reason": "Use AI to handle user queries intelligently"
        })
    elif "ai-reply" in node_types and "condition" not in node_types:
        suggestions.append({
            "type": "condition",
            "position": {"x": 250, "y": 350},
            "data": {"label": "Check Intent"},
            "reason": "Branch based on user intent"
        })
    elif "condition" in node_types and "n8n-trigger" not in node_types:
        suggestions.append({
            "type": "n8n-trigger",
            "position": {"x": 250, "y": 450},
            "data": {"label": "Trigger Workflow"},
            "reason": "Connect to n8n for advanced automation"
        })
    else:
        suggestions.append({
            "type": "end",
            "position": {"x": 250, "y": 550},
            "data": {"label": "End Conversation"},
            "reason": "Complete the conversation flow"
        })
    
    return {"suggestions": suggestions}
