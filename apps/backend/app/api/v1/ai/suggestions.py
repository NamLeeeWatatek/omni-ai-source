from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.core.auth import get_current_user
import json

router = APIRouter()

class WorkflowSuggestRequest(BaseModel):
    description: str
    context: Optional[str] = None

class NodeSuggestion(BaseModel):
    id: str
    type: str
    label: str
    position: Dict[str, float]
    config: Dict[str, Any]

class EdgeSuggestion(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None

class WorkflowSuggestResponse(BaseModel):
    nodes: List[NodeSuggestion]
    edges: List[EdgeSuggestion]
    description: str
    suggested_name: str

@router.post("/suggest", response_model=WorkflowSuggestResponse)
async def suggest_workflow(
    request: WorkflowSuggestRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    AI-powered workflow suggestion based on user description.
    
    This endpoint analyzes the user's description and generates a workflow
    with appropriate nodes and connections.
    """
    
    # Parse user description to determine workflow type
    description_lower = request.description.lower()
    
    # Simple rule-based AI (can be replaced with actual AI model later)
    nodes = []
    edges = []
    suggested_name = "Custom Workflow"
    
    # Customer Support Flow
    if any(keyword in description_lower for keyword in ['customer', 'support', 'help', 'service']):
        suggested_name = "Customer Support Workflow"
        nodes = [
            {
                "id": "trigger-1",
                "type": "custom",
                "label": "New Message",
                "position": {"x": 250, "y": 50},
                "config": {"type": "trigger-message"}
            },
            {
                "id": "ai-1",
                "type": "custom",
                "label": "AI Analyze Intent",
                "position": {"x": 250, "y": 200},
                "config": {
                    "type": "ai-classify",
                    "categories": ["question", "complaint", "feedback", "urgent"]
                }
            },
            {
                "id": "condition-1",
                "type": "custom",
                "label": "Is Urgent?",
                "position": {"x": 250, "y": 350},
                "config": {
                    "type": "logic-condition",
                    "operator": "equals",
                    "value": "urgent"
                }
            },
            {
                "id": "ai-2",
                "type": "custom",
                "label": "AI Suggest Response",
                "position": {"x": 100, "y": 500},
                "config": {
                    "type": "ai-suggest",
                    "prompt": "Provide a helpful response to: {customer_message}"
                }
            },
            {
                "id": "send-1",
                "type": "custom",
                "label": "Send Reply",
                "position": {"x": 100, "y": 650},
                "config": {
                    "type": "send-message",
                    "message": "{ai_response}"
                }
            },
            {
                "id": "notify-1",
                "type": "custom",
                "label": "Alert Team",
                "position": {"x": 400, "y": 500},
                "config": {
                    "type": "send-notification",
                    "message": "🚨 Urgent: {customer_message}"
                }
            }
        ]
        edges = [
            {"id": "e1-2", "source": "trigger-1", "target": "ai-1"},
            {"id": "e2-3", "source": "ai-1", "target": "condition-1"},
            {"id": "e3-4", "source": "condition-1", "target": "ai-2", "label": "No"},
            {"id": "e3-5", "source": "condition-1", "target": "notify-1", "label": "Yes"},
            {"id": "e4-5", "source": "ai-2", "target": "send-1"}
        ]
    
    # Lead Qualification Flow
    elif any(keyword in description_lower for keyword in ['lead', 'sales', 'qualify', 'prospect']):
        suggested_name = "Lead Qualification Workflow"
        nodes = [
            {
                "id": "trigger-1",
                "type": "custom",
                "label": "New Lead",
                "position": {"x": 250, "y": 50},
                "config": {"type": "trigger-message"}
            },
            {
                "id": "ai-1",
                "type": "custom",
                "label": "Extract Info",
                "position": {"x": 250, "y": 200},
                "config": {
                    "type": "ai-extract",
                    "fields": ["name", "email", "company", "budget"]
                }
            },
            {
                "id": "condition-1",
                "type": "custom",
                "label": "Has Budget?",
                "position": {"x": 250, "y": 350},
                "config": {
                    "type": "logic-condition",
                    "operator": "not_empty",
                    "field": "budget"
                }
            },
            {
                "id": "crm-1",
                "type": "custom",
                "label": "Add to CRM",
                "position": {"x": 100, "y": 500},
                "config": {
                    "type": "action-crm",
                    "action": "create_lead"
                }
            },
            {
                "id": "send-1",
                "type": "custom",
                "label": "Send Follow-up",
                "position": {"x": 400, "y": 500},
                "config": {
                    "type": "send-email",
                    "template": "nurture"
                }
            }
        ]
        edges = [
            {"id": "e1-2", "source": "trigger-1", "target": "ai-1"},
            {"id": "e2-3", "source": "ai-1", "target": "condition-1"},
            {"id": "e3-4", "source": "condition-1", "target": "crm-1", "label": "Yes"},
            {"id": "e3-5", "source": "condition-1", "target": "send-1", "label": "No"}
        ]
    
    # Order Processing Flow
    elif any(keyword in description_lower for keyword in ['order', 'purchase', 'buy', 'checkout', 'payment']):
        suggested_name = "Order Processing Workflow"
        nodes = [
            {
                "id": "trigger-1",
                "type": "custom",
                "label": "New Order",
                "position": {"x": 250, "y": 50},
                "config": {"type": "trigger-webhook"}
            },
            {
                "id": "validate-1",
                "type": "custom",
                "label": "Validate Order",
                "position": {"x": 250, "y": 200},
                "config": {
                    "type": "logic-validate",
                    "rules": ["has_items", "has_payment"]
                }
            },
            {
                "id": "payment-1",
                "type": "custom",
                "label": "Process Payment",
                "position": {"x": 250, "y": 350},
                "config": {
                    "type": "action-payment",
                    "provider": "stripe"
                }
            },
            {
                "id": "send-1",
                "type": "custom",
                "label": "Send Confirmation",
                "position": {"x": 250, "y": 500},
                "config": {
                    "type": "send-email",
                    "template": "order_confirmation"
                }
            }
        ]
        edges = [
            {"id": "e1-2", "source": "trigger-1", "target": "validate-1"},
            {"id": "e2-3", "source": "validate-1", "target": "payment-1"},
            {"id": "e3-4", "source": "payment-1", "target": "send-1"}
        ]
    
    # Chatbot Flow
    elif any(keyword in description_lower for keyword in ['chat', 'bot', 'conversation', 'ai', 'gpt']):
        suggested_name = "AI Chatbot Workflow"
        nodes = [
            {
                "id": "trigger-1",
                "type": "custom",
                "label": "New Message",
                "position": {"x": 250, "y": 50},
                "config": {"type": "trigger-message"}
            },
            {
                "id": "ai-1",
                "type": "custom",
                "label": "AI Response",
                "position": {"x": 250, "y": 200},
                "config": {
                    "type": "ai-gemini",
                    "model": "gemini-2.5-flash",
                    "prompt": "You are a helpful assistant. User says: {message}",
                    "temperature": 0.7
                }
            },
            {
                "id": "send-1",
                "type": "custom",
                "label": "Send Response",
                "position": {"x": 250, "y": 350},
                "config": {
                    "type": "send-message",
                    "message": "{ai_response}"
                }
            }
        ]
        edges = [
            {"id": "e1-2", "source": "trigger-1", "target": "ai-1"},
            {"id": "e2-3", "source": "ai-1", "target": "send-1"}
        ]
    
    # Default: Simple Message Flow
    else:
        suggested_name = "Message Automation Workflow"
        nodes = [
            {
                "id": "trigger-1",
                "type": "custom",
                "label": "Trigger",
                "position": {"x": 250, "y": 50},
                "config": {"type": "trigger-message"}
            },
            {
                "id": "action-1",
                "type": "custom",
                "label": "Process Message",
                "position": {"x": 250, "y": 200},
                "config": {
                    "type": "action-process",
                    "action": "analyze"
                }
            },
            {
                "id": "send-1",
                "type": "custom",
                "label": "Send Response",
                "position": {"x": 250, "y": 350},
                "config": {
                    "type": "send-message",
                    "message": "Thank you for your message!"
                }
            }
        ]
        edges = [
            {"id": "e1-2", "source": "trigger-1", "target": "action-1"},
            {"id": "e2-3", "source": "action-1", "target": "send-1"}
        ]
    
    return {
        "nodes": nodes,
        "edges": edges,
        "description": f"AI-generated workflow based on: {request.description}",
        "suggested_name": suggested_name
    }

@router.get("/templates")
async def get_workflow_templates(
    current_user: dict = Depends(get_current_user)
):
    """Get predefined workflow templates"""
    
    templates = [
        {
            "id": "customer-support",
            "name": "Customer Support",
            "description": "AI-powered customer support with intelligent routing",
            "category": "Customer Service",
            "icon": "💬"
        },
        {
            "id": "lead-qualification",
            "name": "Lead Qualification",
            "description": "Automatically qualify and route sales leads",
            "category": "Sales",
            "icon": "🎯"
        },
        {
            "id": "order-processing",
            "name": "Order Processing",
            "description": "Process orders and send confirmations",
            "category": "E-commerce",
            "icon": "🛒"
        },
        {
            "id": "ai-chatbot",
            "name": "AI Chatbot",
            "description": "GPT-powered conversational AI",
            "category": "AI",
            "icon": "🤖"
        },
        {
            "id": "appointment-booking",
            "name": "Appointment Booking",
            "description": "Schedule appointments with calendar integration",
            "category": "Scheduling",
            "icon": "📅"
        },
        {
            "id": "feedback-collection",
            "name": "Feedback Collection",
            "description": "Collect and analyze customer feedback",
            "category": "Analytics",
            "icon": "⭐"
        }
    ]
    
    return {"templates": templates}
