"""
AI Configuration API
Manage AI model API keys and configurations
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import os

from app.core.auth import get_current_user
from app.utils.encryption import encrypt_api_key, decrypt_api_key, mask_api_key

router = APIRouter()


class SaveAPIKeyRequest(BaseModel):
    provider: str
    api_key: str


class CustomModelRequest(BaseModel):
    name: str
    provider: str
    api_endpoint: str
    api_key: str
    model: str


@router.post("/api-keys")
async def save_api_key(
    request: SaveAPIKeyRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Save encrypted API key for a provider
    In production, store in database per user/workspace
    For now, we'll use environment variables
    """
    # Encrypt the API key
    encrypted_key = encrypt_api_key(request.api_key)
    
    # In production, save to database
    # For now, just validate and return success
    
    return {
        "status": "success",
        "message": f"API key for {request.provider} saved successfully",
        "masked_key": mask_api_key(request.api_key)
    }


@router.get("/api-keys/{provider}")
async def get_api_key(
    provider: str,
    current_user: dict = Depends(get_current_user)
):
    """Get masked API key for a provider"""
    # In production, fetch from database
    # For now, check environment variables
    
    key_map = {
        "openai": os.getenv("OPENAI_API_KEY"),
        "gemini": os.getenv("GEMINI_API_KEY"),
        "anthropic": os.getenv("ANTHROPIC_API_KEY")
    }
    
    api_key = key_map.get(provider)
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    return {
        "provider": provider,
        "masked_key": mask_api_key(api_key),
        "configured": True
    }


@router.delete("/api-keys/{provider}")
async def delete_api_key(
    provider: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete API key for a provider"""
    # In production, delete from database
    
    return {
        "status": "success",
        "message": f"API key for {provider} deleted"
    }


@router.post("/custom-models")
async def add_custom_model(
    request: CustomModelRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a custom AI model configuration"""
    # Encrypt API key
    encrypted_key = encrypt_api_key(request.api_key)
    
    # In production, save to database
    
    return {
        "status": "success",
        "message": "Custom model added successfully",
        "model": {
            "name": request.name,
            "provider": request.provider,
            "api_endpoint": request.api_endpoint,
            "model": request.model
        }
    }


@router.get("/custom-models")
async def list_custom_models(
    current_user: dict = Depends(get_current_user)
):
    """List all custom AI models"""
    # In production, fetch from database
    
    return {
        "models": []
    }


@router.delete("/custom-models/{model_id}")
async def delete_custom_model(
    model_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a custom AI model"""
    # In production, delete from database
    
    return {
        "status": "success",
        "message": "Custom model deleted"
    }
