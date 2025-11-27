from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.core.auth import get_current_user
import os

router = APIRouter()

class AISuggestRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None
    max_tokens: Optional[int] = 150
    model: Optional[str] = None

class AIResponse(BaseModel):
    suggestion: str
    model: str
    tokens_used: int

@router.post("/suggest", response_model=AIResponse)
async def ai_suggest(
    request: AISuggestRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate AI response suggestions for customer messages
    """
    try:
        # For now, return a mock response
        # TODO: Integrate with actual AI service (OpenAI, Gemini, etc.)
        
        suggestion = f"Based on your prompt: '{request.prompt}', here's a suggested response: "
        suggestion += "Thank you for your message! We'll get back to you shortly."
        
        return AIResponse(
            suggestion=suggestion,
            model="mock-ai-v1",
            tokens_used=50
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/openai", response_model=AIResponse)
async def ai_openai(
    request: AISuggestRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Call OpenAI API (GPT-4, etc.)
    """
    try:
        # Check if OpenAI API key is configured
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not configured"
            )
        
        # For now, return mock response
        # TODO: Implement actual OpenAI API call
        suggestion = f"OpenAI response to: '{request.prompt}'"
        
        return AIResponse(
            suggestion=suggestion,
            model=request.model or "gpt-4o",
            tokens_used=100
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/gemini", response_model=AIResponse)
async def ai_gemini(
    request: AISuggestRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Call Google Gemini API
    """
    try:
        from app.services.gemini import gemini_service
        
        # Build prompt with context if provided
        prompt = request.prompt
        if request.context and request.context.get("history"):
            history = request.context["history"]
            history_text = "\n".join([
                f"{msg['role']}: {msg['content']}" 
                for msg in history[-5:]  # Last 5 messages for context
            ])
            prompt = f"Previous conversation:\n{history_text}\n\nUser: {request.prompt}\n\nAssistant:"
        
        # Call Gemini API
        model_name = request.model or "gemini-2.5-flash"
        response = await gemini_service.generate_content(prompt, model_name=model_name)
        
        if not response:
            raise HTTPException(
                status_code=500,
                detail="Failed to get response from Gemini"
            )
        
        return AIResponse(
            suggestion=response,
            model=model_name,
            tokens_used=len(response.split()) * 2  # Rough estimate
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ClassifyRequest(BaseModel):
    text: str
    categories: list[str]

class ClassifyResponse(BaseModel):
    category: str
    confidence: float

@router.post("/classify", response_model=ClassifyResponse)
async def ai_classify(
    request: ClassifyRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Classify text into categories using AI
    """
    try:
        # Mock classification
        # TODO: Implement actual AI classification
        
        if not request.categories:
            raise HTTPException(status_code=400, detail="Categories list is empty")
        
        # Simple keyword-based classification for demo
        text_lower = request.text.lower()
        
        if "urgent" in text_lower or "asap" in text_lower:
            category = "urgent"
        elif "question" in text_lower or "?" in text_lower:
            category = "question"
        elif "complaint" in text_lower or "problem" in text_lower:
            category = "complaint"
        else:
            category = request.categories[0]
        
        return ClassifyResponse(
            category=category,
            confidence=0.85
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
