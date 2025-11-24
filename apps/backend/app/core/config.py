# app/core/config.py

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "WataOmi"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://wataomi:wataomi@localhost:5432/wataomi"
    # Nếu bạn dùng sync driver thì để: postgresql://... (nhưng khuyến khích asyncpg)

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
    CLOUDINARY_UPLOAD_PRESET: str

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # Qdrant
    QDRANT_URL: str
    QDRANT_API_KEY: str

    # Google Gemini API
    GOOGLE_API_KEY: str

    # OpenAI (nếu dùng)
    OPENAI_API_KEY: Optional[str] = None

    # Casdoor OAuth
    CASDOOR_ENDPOINT: str
    CASDOOR_CLIENT_ID: str
    CASDOOR_CLIENT_SECRET: str
    CASDOOR_CERTIFICATE: str
    CASDOOR_APP_NAME: str
    CASDOOR_ORG_NAME: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True        # BẮT BUỘC vì key trong .env của bạn là UPPERCASE
        extra = "ignore"


# Khởi tạo instance để dùng toàn dự án
settings = Settings()