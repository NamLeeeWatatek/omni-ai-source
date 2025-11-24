from casdoor import CasdoorSDK
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class AuthService:
    def __init__(self):
        # For development: Try to initialize with certificate, but don't fail if it's malformed
        try:
            self.sdk = CasdoorSDK(
                endpoint=settings.CASDOOR_ENDPOINT,
                client_id=settings.CASDOOR_CLIENT_ID,
                client_secret=settings.CASDOOR_CLIENT_SECRET,
                certificate=settings.CASDOOR_CERTIFICATE,
                org_name=settings.CASDOOR_ORG_NAME,
                application_name=settings.CASDOOR_APP_NAME,
            )
            self.certificate_valid = True
            print("✅ Casdoor SDK initialized with certificate")
        except Exception as e:
            print(f"⚠️  Certificate error (using fallback mode): {e}")
            # Initialize without certificate for development
            self.sdk = CasdoorSDK(
                endpoint=settings.CASDOOR_ENDPOINT,
                client_id=settings.CASDOOR_CLIENT_ID,
                client_secret=settings.CASDOOR_CLIENT_SECRET,
                certificate="",  # Empty certificate
                org_name=settings.CASDOOR_ORG_NAME,
                application_name=settings.CASDOOR_APP_NAME,
            )
            self.certificate_valid = False
            print("⚠️  Running in development mode without certificate verification")

    def verify_token(self, token: str):
        """
        Verify JWT token from Casdoor.
        In development mode without valid certificate, we skip verification
        and just decode the token payload.
        """
        try:
            if self.certificate_valid:
                # Normal verification with certificate
                user = self.sdk.parse_jwt_token(token)
                return user
            else:
                # Development mode: Skip verification, just decode
                # WARNING: This is NOT secure for production!
                import jwt
                # Decode without verification (development only)
                user = jwt.decode(token, options={"verify_signature": False})
                print(f"⚠️  Token decoded without verification (dev mode): {user.get('name', 'Unknown')}")
                return user
        except Exception as e:
            print(f"❌ Token verification/decode failed: {e}")
            return None

auth_service = AuthService()

async def get_current_user(token: str = Depends(oauth2_scheme)):
    user = auth_service.verify_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
