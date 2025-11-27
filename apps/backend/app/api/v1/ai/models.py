"""
AI Models Management API
Manage AI model configurations and API keys
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os

from app.core.auth import get_current_user
from app.utils.encryption import encrypt_api_key, decrypt_api_key, mask_api_key

router = APIRouter()


class AIModelConfig(BaseModel):
    provider: str  # 'openai', 'gemini', 'anthropic', etc.
    model_name: str
    display_name: str
    api_key_configured: bool
    is_available: bool
    capabilities: List[str]
    max_tokens: Optional[int] = None
    description: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "provider": "gemini",
                "model_name": "gemini-2.5-pro",
                "display_name": "Gemini 2.5 Pro",
                "api_key_configured": True,
                "is_available": True,
                "capabilities": ["chat", "text-generation", "reasoning"],
                "max_tokens": 32768,
                "description": "Stable model for complex reasoning"
            }
        }


class AIModelResponse(BaseModel):
    provider: str
    models: List[AIModelConfig]


class UpdateAPIKeyRequest(BaseModel):
    provider: str
    api_key: str


# Centralized model definitions - single source of truth
# Updated with latest models as of 2025
AVAILABLE_MODELS = {
    "gemini": [
        {
            "model_name": "gemini-3-pro-preview",
            "display_name": "Gemini 3 Pro Preview",
            "capabilities": ["chat", "text-generation", "code-generation", "reasoning"],
            "max_tokens": 32768,
            "description": "Most intelligent Google model (preview)"
        },
        {
            "model_name": "gemini-2.5-pro",
            "display_name": "Gemini 2.5 Pro",
            "capabilities": ["chat", "text-generation", "code-generation", "reasoning"],
            "max_tokens": 32768,
            "description": "Stable model for complex reasoning"
        },
        {
            "model_name": "gemini-2.5-flash",
            "display_name": "Gemini 2.5 Flash",
            "capabilities": ["chat", "text-generation", "fast-inference"],
            "max_tokens": 16384,
            "description": "Balanced price and performance"
        },
        {
            "model_name": "gemini-2.5-flash-lite",
            "display_name": "Gemini 2.5 Flash Lite",
            "capabilities": ["chat", "text-generation", "fast-inference", "high-throughput"],
            "max_tokens": 8192,
            "description": "Cost-effective, low latency for high throughput"
        },
        {
            "model_name": "gemini-2.5-flash-image",
            "display_name": "Gemini 2.5 Flash Image",
            "capabilities": ["image-generation", "image-editing", "text-to-image"],
            "max_tokens": 8192,
            "description": "Text-based image generation and editing"
        },
        {
            "model_name": "gemini-2.0-flash",
            "display_name": "Gemini 2.0 Flash",
            "capabilities": ["chat", "text-generation", "fast-inference"],
            "max_tokens": 16384,
            "description": "Previous Flash version"
        },
        {
            "model_name": "gemini-2.0-flash-lite",
            "display_name": "Gemini 2.0 Flash Lite",
            "capabilities": ["chat", "text-generation", "fast-inference"],
            "max_tokens": 8192,
            "description": "Previous Flash-Lite version"
        }
    ],
    "openai": [
        {
            "model_name": "gpt-5",
            "display_name": "GPT-5",
            "capabilities": ["chat", "text-generation", "code-generation", "reasoning"],
            "max_tokens": 128000,
            "description": "Most powerful OpenAI model"
        },
        {
            "model_name": "gpt-5.1",
            "display_name": "GPT-5.1",
            "capabilities": ["chat", "text-generation", "code-generation", "reasoning"],
            "max_tokens": 128000,
            "description": "Latest GPT-5 version"
        },
        {
            "model_name": "gpt-5-mini",
            "display_name": "GPT-5 Mini",
            "capabilities": ["chat", "text-generation", "fast-inference"],
            "max_tokens": 64000,
            "description": "Fast and cost-effective GPT-5"
        },
        {
            "model_name": "gpt-4o",
            "display_name": "GPT-4o (Omni)",
            "capabilities": ["chat", "text-generation", "vision", "audio", "multimodal"],
            "max_tokens": 128000,
            "description": "Multimodal model (text, audio, image)"
        },
        {
            "model_name": "gpt-4o-mini",
            "display_name": "GPT-4o Mini",
            "capabilities": ["chat", "text-generation", "vision", "multimodal"],
            "max_tokens": 64000,
            "description": "Lightweight, cost-effective GPT-4o"
        },
        {
            "model_name": "gpt-3.5-turbo",
            "display_name": "GPT-3.5 Turbo",
            "capabilities": ["chat", "text-generation"],
            "max_tokens": 16385,
            "description": "Legacy model, cost-effective"
        }
    ],
    "anthropic": [
        {
            "model_name": "claude-3-opus",
            "display_name": "Claude 3 Opus",
            "capabilities": ["chat", "text-generation", "code-generation", "reasoning"],
            "max_tokens": 200000,
            "description": "Most capable Claude model"
        },
        {
            "model_name": "claude-3-sonnet",
            "display_name": "Claude 3 Sonnet",
            "capabilities": ["chat", "text-generation", "code-generation"],
            "max_tokens": 200000,
            "description": "Balanced performance and speed"
        },
        {
            "model_name": "claude-3-haiku",
            "display_name": "Claude 3 Haiku",
            "capabilities": ["chat", "text-generation", "fast-inference"],
            "max_tokens": 200000,
            "description": "Fastest and most compact"
        }
    ]
}


@router.get("/", response_model=List[AIModelResponse])
async def list_ai_models(
    current_user: dict = Depends(get_current_user)
):
    """
    List all available AI models and their configurations
    Single source of truth for model definitions
    """
    # Check which API keys are configured
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    api_keys = {
        "gemini": gemini_key,
        "openai": openai_key,
        "anthropic": anthropic_key
    }
    
    models = []
    
    for provider, model_list in AVAILABLE_MODELS.items():
        api_key = api_keys.get(provider)
        provider_models = [
            AIModelConfig(
                provider=provider,
                api_key_configured=bool(api_key),
                is_available=bool(api_key),
                **model_config
            )
            for model_config in model_list
        ]
        
        models.append(AIModelResponse(
            provider=provider,
            models=provider_models
        ))
    
    return models



@router.get("/providers")
async def list_providers(
    current_user: dict = Depends(get_current_user)
):
    """List all AI providers and their status"""
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    api_keys = {
        "gemini": gemini_key,
        "openai": openai_key,
        "anthropic": anthropic_key
    }
    
    provider_names = {
        "gemini": "Google Gemini",
        "openai": "OpenAI",
        "anthropic": "Anthropic"
    }
    
    providers = []
    for provider_id, model_list in AVAILABLE_MODELS.items():
        api_key = api_keys.get(provider_id)
        providers.append({
            "id": provider_id,
            "name": provider_names.get(provider_id, provider_id.title()),
            "configured": bool(api_key),
            "masked_key": mask_api_key(api_key) if api_key else None,
            "models_count": len(model_list)
        })
    
    return {"providers": providers}


class ChatRequest(BaseModel):
    message: str
    model: str = "gemini-2.5-flash"
    conversation_history: Optional[List[dict]] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = 0.7


class ChatResponse(BaseModel):
    response: str
    model: str
    tokens_used: int


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Chat with AI assistant
    Supports multiple models
    """
    # Route to appropriate AI service based on model
    if request.model.startswith("gemini"):
        from app.api.v1.ai import ai_gemini, AISuggestRequest
        
        ai_request = AISuggestRequest(
            prompt=request.message,
            context={"history": request.conversation_history or []},
            max_tokens=request.max_tokens or 1024
        )
        
        # Call Gemini API
        response = await ai_gemini(ai_request, current_user)
        
        return ChatResponse(
            response=response.suggestion,
            model=request.model,
            tokens_used=response.tokens_used
        )
    
    elif request.model.startswith("gpt"):
        from app.api.v1.ai import ai_openai, AISuggestRequest
        
        ai_request = AISuggestRequest(
            prompt=request.message,
            context={"history": request.conversation_history or []},
            max_tokens=request.max_tokens or 1024
        )
        
        response = await ai_openai(ai_request, current_user)
        
        return ChatResponse(
            response=response.suggestion,
            model=request.model,
            tokens_used=response.tokens_used
        )
    
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Model {request.model} not supported"
        )
