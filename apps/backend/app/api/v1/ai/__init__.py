"""
AI-related API endpoints
"""
from fastapi import APIRouter
from .chat import router as chat_router
from .models import router as models_router
from .suggestions import router as suggestions_router
from .configs import router as configs_router
from .conversations import router as conversations_router

router = APIRouter()

# Include all AI sub-routers
router.include_router(chat_router, prefix="/chat", tags=["AI Chat"])
router.include_router(models_router, prefix="/models", tags=["AI Models"])
router.include_router(suggestions_router, prefix="/suggestions", tags=["AI Suggestions"])
router.include_router(configs_router, prefix="/configs", tags=["AI Configs"])
router.include_router(conversations_router, prefix="/conversations", tags=["AI Conversations"])
