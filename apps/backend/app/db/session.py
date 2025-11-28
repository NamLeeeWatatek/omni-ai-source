from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from app.core.config import settings

# Create Async Engine
engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG, future=True)

async def init_db():
    # Import all models to ensure they are registered with SQLModel
    from app.models.user import User, Workspace, WorkspaceMember
    from app.models.conversation import Channel, ChannelConnection, Conversation, Message
    from app.models.bot import Bot, FlowVersion
    from app.models.flow import Flow
    from app.models.execution import WorkflowExecution, NodeExecution
    from app.models.integration import IntegrationConfig
    from app.models.template import WorkflowTemplate
    
    async with engine.begin() as conn:
        # await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session


# Context manager for standalone scripts
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_session_context():
    """Get session for standalone scripts (not FastAPI dependency)"""
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
