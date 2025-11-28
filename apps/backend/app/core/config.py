from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # tránh lỗi extra_forbidden
    )
    # App
    PROJECT_NAME: str = "WataOmi"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://wataomi:wataomi@localhost:5432/wataomi"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # n8n
    N8N_URL: str = "http://localhost:5678"
    N8N_API_KEY: Optional[str] = None

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    CLOUDINARY_UPLOAD_PRESET: Optional[str] = None

    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    # Qdrant
    QDRANT_URL: Optional[str] = None
    QDRANT_API_KEY: Optional[str] = None

    # Google
    GOOGLE_API_KEY: Optional[str] = None

    # Casdoor
    CASDOOR_ENDPOINT: Optional[str] = None
    CASDOOR_CLIENT_ID: Optional[str] = None
    CASDOOR_CLIENT_SECRET: Optional[str] = None
    CASDOOR_APP_NAME: Optional[str] = None
    CASDOOR_ORG_NAME: Optional[str] = None
    CASDOOR_CERTIFICATE: Optional[str] = None

    # OAuth Providers for Channels
    FACEBOOK_APP_ID: Optional[str] = None
    FACEBOOK_APP_SECRET: Optional[str] = None
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    INSTAGRAM_APP_ID: Optional[str] = None
    INSTAGRAM_APP_SECRET: Optional[str] = None
    
    # Frontend URL for OAuth redirects
    FRONTEND_URL: str = "http://localhost:3000"


settings = Settings()
