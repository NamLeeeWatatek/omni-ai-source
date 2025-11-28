"""
Simple Sync Service
Just ensure database users have proper roles
No Casdoor API interaction needed
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)


async def sync_database_users():
    """Ensure all database users have proper roles"""
    try:
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
            
            # Get current users
            result = await conn.execute(text("""
                SELECT id, email, role, is_active FROM users
            """))
            users = result.fetchall()
            
            if users:
                logger.info(f"📊 Current users ({len(users)}):")
                for user in users:
                    logger.info(f"   - {user.email}: {user.role} (Active: {user.is_active})")
            else:
                logger.info("📊 No users found in database")
        
        await engine.dispose()
        return True
        
    except Exception as e:
        logger.error(f"❌ Database sync failed: {e}")
        return False


async def ensure_admin_exists():
    """Ensure at least one admin user exists"""
    try:
        from app.core.config import settings
        from sqlalchemy.ext.asyncio import create_async_engine
        
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        
        async with engine.begin() as conn:
            # Check for admin users
            result = await conn.execute(text("""
                SELECT COUNT(*) FROM users 
                WHERE role IN ('admin', 'super_admin')
            """))
            admin_count = result.scalar()
            
            if admin_count == 0:
                # Make first user admin
                await conn.execute(text("""
                    UPDATE users 
                    SET role = 'admin' 
                    WHERE id = (SELECT MIN(id) FROM users)
                """))
                logger.info("✅ Set first user as admin")
            else:
                logger.info(f"✅ Found {admin_count} admin user(s)")
        
        await engine.dispose()
        return True
        
    except Exception as e:
        logger.error(f"❌ Admin check failed: {e}")
        return False
