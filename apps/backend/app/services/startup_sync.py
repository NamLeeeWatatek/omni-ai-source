"""
Startup Sync Service
Run on application startup to sync with Casdoor and database
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_session
from app.services.casdoor_sync import casdoor_sync

logger = logging.getLogger(__name__)


async def sync_on_startup():
    """
    Run all sync operations on application startup
    - Sync roles to Casdoor
    - Ensure database users have roles
    - Create sample users (optional)
    """
    logger.info("🚀 Running startup sync...")
    
    try:
        # 1. Sync roles to Casdoor
        logger.info("📋 Step 1: Syncing roles to Casdoor...")
        try:
            await casdoor_sync.sync_all_roles()
        except Exception as e:
            logger.warning(f"⚠️  Casdoor sync failed (may not be running): {e}")
        
        # 2. Ensure all database users have roles
        logger.info("👥 Step 2: Ensuring database users have roles...")
        from app.core.config import settings
        from sqlalchemy.ext.asyncio import create_async_engine
        
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        async with engine.begin() as conn:
            # Update users without roles
            result = await conn.execute(text("""
                UPDATE users 
                SET role = 'user', is_active = true 
                WHERE role IS NULL OR role = ''
            """))
            
            updated = result.rowcount
            if updated > 0:
                logger.info(f"✅ Updated {updated} users with default role")
            
            # Log current users
            result = await conn.execute(text("""
                SELECT id, email, role, is_active FROM users
            """))
            users = result.fetchall()
            
            logger.info(f"📊 Current users in database:")
            for user in users:
                logger.info(f"   - {user.email}: {user.role} (Active: {user.is_active})")
        
        await engine.dispose()
        
        logger.info("✅ Startup sync completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Startup sync failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def create_sample_users_if_empty():
    """Create sample users if database is empty"""
    try:
        from app.core.config import settings
        from sqlalchemy.ext.asyncio import create_async_engine
        
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        async with engine.begin() as conn:
            # Check if users exist
            result = await conn.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            
            if count == 0:
                logger.info("📝 No users found. Creating sample users in Casdoor...")
                await casdoor_sync.sync_sample_users()
            else:
                logger.info(f"✅ Found {count} existing users")
        
        await engine.dispose()
        
    except Exception as e:
        logger.warning(f"⚠️  Could not create sample users: {e}")
