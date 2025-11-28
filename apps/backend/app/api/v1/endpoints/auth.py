"""
Authentication Endpoints
Handles Casdoor OAuth flow and token management
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import jwt
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.permissions import get_role_permissions
from app.api.deps import get_current_user

router = APIRouter()


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    user: Dict[str, Any]


class CasdoorCallbackRequest(BaseModel):
    """Casdoor OAuth callback"""
    code: str
    state: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


@router.get("/login/url")
async def get_login_url():
    """
    Get Casdoor login URL for OAuth flow
    Frontend redirects user to this URL
    """
    if not settings.CASDOOR_ENDPOINT or not settings.CASDOOR_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Casdoor not configured"
        )
    
    # Build OAuth authorization URL
    auth_url = (
        f"{settings.CASDOOR_ENDPOINT}/login/oauth/authorize"
        f"?client_id={settings.CASDOOR_CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={settings.FRONTEND_URL}/auth/callback"
        f"&scope=profile+email"
        f"&state=random_state_string"
    )
    
    return {
        "url": auth_url,
        "redirect_uri": f"{settings.FRONTEND_URL}/auth/callback"
    }


@router.post("/callback", response_model=TokenResponse)
async def handle_callback(request: CasdoorCallbackRequest):
    """
    Handle Casdoor OAuth callback
    Exchange authorization code for access token
    """
    if not all([settings.CASDOOR_ENDPOINT, settings.CASDOOR_CLIENT_ID, settings.CASDOOR_CLIENT_SECRET]):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Casdoor not configured"
        )
    
    try:
        # Exchange code for token
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.CASDOOR_ENDPOINT}/api/login/oauth/access_token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": settings.CASDOOR_CLIENT_ID,
                    "client_secret": settings.CASDOOR_CLIENT_SECRET,
                    "code": request.code,
                    "redirect_uri": f"{settings.FRONTEND_URL}/auth/callback"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to get token: {response.text}"
                )
            
            token_data = response.json()
            casdoor_token = token_data.get("access_token")
            
            if not casdoor_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No access token in response"
                )
            
            # Decode Casdoor JWT to get user info
            # Note: In production, verify signature with Casdoor's public key
            user_info = jwt.decode(
                casdoor_token,
                options={"verify_signature": False}  # Skip verification for now
            )
            
            # Extract user data
            user_id = user_info.get("sub") or user_info.get("name")
            email = user_info.get("email")
            role = user_info.get("tag") or user_info.get("role") or "user"
            name = user_info.get("displayName") or user_info.get("name")
            
            # Create our own JWT with user info and permissions
            access_token = create_access_token(
                user_id=user_id,
                email=email,
                role=role,
                name=name
            )
            
            refresh_token = create_refresh_token(user_id=user_id)
            
            return TokenResponse(
                access_token=access_token,
                token_type="bearer",
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                refresh_token=refresh_token,
                user={
                    "id": user_id,
                    "email": email,
                    "name": name,
                    "role": role,
                    "permissions": list(get_role_permissions(role))
                }
            )
            
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"HTTP error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    """
    try:
        # Decode refresh token
        payload = jwt.decode(
            request.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        # In production, fetch user from database to get latest role
        # For now, we'll need to store role in refresh token or fetch from Casdoor
        
        # Create new access token
        access_token = create_access_token(
            user_id=user_id,
            email=payload.get("email"),
            role=payload.get("role", "user"),
            name=payload.get("name")
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user={
                "id": user_id,
                "email": payload.get("email"),
                "name": payload.get("name"),
                "role": payload.get("role", "user"),
                "permissions": list(get_role_permissions(payload.get("role", "user")))
            }
        )
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.get("/me")
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get current authenticated user info
    """
    return {
        "id": current_user.get("id"),
        "email": current_user.get("email"),
        "name": current_user.get("name"),
        "role": current_user.get("role"),
        "permissions": current_user.get("permissions", [])
    }


@router.post("/logout")
async def logout(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Logout current user
    In production, invalidate token in Redis/database
    """
    # TODO: Add token to blacklist in Redis
    return {"message": "Logged out successfully"}


def create_access_token(
    user_id: str,
    email: str,
    role: str,
    name: str
) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "name": name,
        "permissions": list(get_role_permissions(role)),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }
    
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create JWT refresh token"""
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    }
    
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
