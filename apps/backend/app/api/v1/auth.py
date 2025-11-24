from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.core.auth import auth_service
from typing import Optional

router = APIRouter()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    workspace_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CasdoorLoginRequest(BaseModel):
    code: str
    state: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: dict
    workspace: Optional[dict] = None

@router.post("/casdoor/login", response_model=AuthResponse)
async def casdoor_login(data: CasdoorLoginRequest):
    """Login with Casdoor code"""
    try:
        # Exchange code for token
        token = auth_service.sdk.get_oauth_token(code=data.code)
        if not token:
             raise HTTPException(status_code=400, detail="Failed to get token from Casdoor")
        
        # Verify the token to get user info
        user = auth_service.verify_token(token)
        if not user:
             raise HTTPException(status_code=400, detail="Invalid token received from Casdoor")

        # TODO: Sync user to local database if needed
        # For now, we return the Casdoor token directly as our access token
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user,
            "workspace": {"id": 1, "name": "Default Workspace"} # Mock workspace
        }
    except Exception as e:
        print(f"Casdoor login error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/register", response_model=AuthResponse)
async def register(data: RegisterRequest):
    """Register a new user and create their workspace"""
    # TODO: Check if user exists
    # TODO: Create user in database
    # TODO: Create workspace
    # TODO: Add user as workspace owner
    
    # Mock response
    access_token = create_access_token({"sub": "user@example.com", "workspace_id": 1})
    refresh_token = create_refresh_token({"sub": "user@example.com"})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": 1,
            "email": data.email,
            "name": data.name
        },
        "workspace": {
            "id": 1,
            "name": data.workspace_name,
            "slug": data.workspace_name.lower().replace(" ", "-")
        }
    }

@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    """Login with email and password"""
    # TODO: Verify credentials
    # TODO: Get user and workspace from database
    
    # Mock response
    access_token = create_access_token({"sub": data.email, "workspace_id": 1})
    refresh_token = create_refresh_token({"sub": data.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": 1,
            "email": data.email,
            "name": "John Doe"
        },
        "workspace": {
            "id": 1,
            "name": "My Workspace",
            "slug": "my-workspace"
        }
    }

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh access token"""
    # TODO: Verify refresh token
    # TODO: Generate new access token
    
    access_token = create_access_token({"sub": "user@example.com", "workspace_id": 1})
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me")
async def get_current_user():
    """Get current authenticated user"""
    # TODO: Get user from token
    
    return {
        "id": 1,
        "email": "user@example.com",
        "name": "John Doe",
        "workspace": {
            "id": 1,
            "name": "My Workspace"
        }
    }

@router.post("/logout")
async def logout():
    """Logout user - client should clear token"""
    # For JWT-based auth, logout is handled client-side by removing the token
    # For Casdoor, we could optionally revoke the token here
    # For now, just return success
    return {
        "message": "Logged out successfully"
    }
