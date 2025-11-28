"""
Casdoor Authentication Service
Handles OAuth integration with Casdoor for user authentication
"""

import httpx
from typing import Optional, Dict, Any
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class CasdoorService:
    """Service for Casdoor OAuth integration"""
    
    def __init__(self):
        self.endpoint = settings.CASDOOR_ENDPOINT
        self.client_id = settings.CASDOOR_CLIENT_ID
        self.client_secret = settings.CASDOOR_CLIENT_SECRET
        self.org_name = settings.CASDOOR_ORG_NAME
        self.app_name = settings.CASDOOR_APP_NAME
    
    def get_authorization_url(self, redirect_uri: str, state: str = "random_state") -> str:
        """
        Generate Casdoor OAuth authorization URL
        
        Args:
            redirect_uri: URL to redirect after authentication
            state: Random state string for CSRF protection
            
        Returns:
            Authorization URL
        """
        return (
            f"{self.endpoint}/login/oauth/authorize"
            f"?client_id={self.client_id}"
            f"&response_type=code"
            f"&redirect_uri={redirect_uri}"
            f"&scope=profile+email"
            f"&state={state}"
        )
    
    async def exchange_code_for_token(
        self, 
        code: str, 
        redirect_uri: str
    ) -> Optional[Dict[str, Any]]:
        """
        Exchange authorization code for access token
        
        Args:
            code: Authorization code from Casdoor
            redirect_uri: Same redirect URI used in authorization
            
        Returns:
            Token response with access_token, refresh_token, etc.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.endpoint}/api/login/oauth/access_token",
                    data={
                        "grant_type": "authorization_code",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "code": code,
                        "redirect_uri": redirect_uri
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Token exchange failed: {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Token exchange error: {e}")
            return None
    
    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from Casdoor using access token
        
        Args:
            access_token: Casdoor access token
            
        Returns:
            User information dictionary
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.endpoint}/api/get-account",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Get user info failed: {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Get user info error: {e}")
            return None
    
    async def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Refresh access token using refresh token
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            New token response
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.endpoint}/api/login/oauth/refresh_token",
                    data={
                        "grant_type": "refresh_token",
                        "refresh_token": refresh_token,
                        "client_id": self.client_id,
                        "client_secret": self.client_secret
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Token refresh failed: {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            return None
    
    async def logout(self, access_token: str) -> bool:
        """
        Logout user from Casdoor
        
        Args:
            access_token: User's access token
            
        Returns:
            True if successful
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.endpoint}/api/logout",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                return response.status_code == 200
                
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return False


# Singleton instance
casdoor_service = CasdoorService()
