"""
Database Migration Runner Script

This script runs SQL migrations in sequential order, tracking which migrations
have been applied to prevent duplicate execution. Each migration runs in a
transaction with automatic rollback on failure.

Usage:
    python app/scripts/run_migration.py
"""

import asyncio
import asyncpg
from pathlib import Path
import sys
import os
from typing import Set, List

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.config import settings


async def create_migrations_table(conn: asyncpg.Connection) -> None:
    """
    Create the schema_migrations table if it doesn't exist.
    
    This table tracks which migration files have been applied to the database.
    
    Args:
        conn: Active database connection
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            checksum VARCHAR(64)
        )
    """)
    print("✅ Migration tracking table ready")


async def get_applied_migrations(conn: asyncpg.Connection) -> Set[str]:
    """
    Get the set of migration filenames that have already been applied.
    
    Args:
        conn: Active database connection
        
    Returns:
        Set of migration filenames that have been applied
    """
    rows = await conn.fetch(
        "SELECT filename FROM schema_migrations ORDER BY filename"
    )
    return {row['filename'] for row in rows}


async def get_migration_files(migrations_dir: Path) -> List[Path]:
    """
    Get all SQL migration files sorted by filename.
    
    Args:
        migrations_dir: Path to migrations directory
        
    Returns:
        Sorted list of migration file paths
    """
    migration_files = sorted(migrations_dir.glob('*.sql'))
    return migration_files


async def run_migration_file(
    conn: asyncpg.Connection, 
    migration_file: Path
) -> None:
    """
    Execute a single migration file within a transaction.
    
    If the migration fails, the transaction is automatically rolled back.
    
    Args:
        conn: Active database connection
        migration_file: Path to the migration SQL file
        
    Raises:
        Exception: If migration execution fails
    """
    filename = migration_file.name
    
    print(f"🔄 Running migration: {filename}")
    
    # Read migration SQL
    sql = migration_file.read_text(encoding='utf-8')
    
    # Execute in transaction - will auto-rollback on exception
    async with conn.transaction():
        # Execute the migration SQL
        await conn.execute(sql)
        
        # Record that this migration has been applied
        await conn.execute(
            "INSERT INTO schema_migrations (filename) VALUES ($1)",
            filename
        )
    
    print(f"✅ Completed: {filename}")


async def run_migrations() -> None:
    """
    Main migration runner function.
    
    Connects to the database, creates the migration tracking table,
    and runs all pending migrations in sequential order.
    """
    # Parse DATABASE_URL - convert from SQLAlchemy format to asyncpg format
    db_url = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
    
    print("🚀 Starting database migrations...")
    print(f"📦 Database: {db_url.split('@')[1] if '@' in db_url else 'unknown'}")
    
    # Connect to database
    try:
        conn = await asyncpg.connect(db_url)
    except Exception as e:
        print(f"\n❌ Failed to connect to database: {e}")
        print("💡 Make sure PostgreSQL is running and DATABASE_URL is correct")
        sys.exit(1)
    
    try:
        # Create migrations tracking table
        await create_migrations_table(conn)
        
        # Get list of applied migrations
        applied_migrations = await get_applied_migrations(conn)
        
        # Get migration files
        migrations_dir = Path(__file__).parent.parent.parent / 'migrations'
        
        if not migrations_dir.exists():
            print(f"\n⚠️  Migrations directory not found: {migrations_dir}")
            print("Creating migrations directory...")
            migrations_dir.mkdir(parents=True, exist_ok=True)
        
        migration_files = await get_migration_files(migrations_dir)
        
        if not migration_files:
            print("\n📭 No migration files found")
            return
        
        print(f"\n📊 Migration Status:")
        print(f"   Total migration files: {len(migration_files)}")
        print(f"   Already applied: {len(applied_migrations)}")
        print(f"   Pending: {len(migration_files) - len(applied_migrations)}")
        print()
        
        # Run pending migrations
        pending_count = 0
        for migration_file in migration_files:
            filename = migration_file.name
            
            if filename in applied_migrations:
                print(f"⏭️  Skipping {filename} (already applied)")
                continue
            
            try:
                await run_migration_file(conn, migration_file)
                pending_count += 1
            except Exception as e:
                print(f"\n❌ Migration failed: {filename}")
                print(f"   Error: {e}")
                print(f"   Transaction has been rolled back")
                raise
        
        if pending_count == 0:
            print("\n✨ Database is up to date! No migrations needed.")
        else:
            print(f"\n✨ Successfully applied {pending_count} migration(s)!")
        
    except Exception as e:
        print(f"\n❌ Migration process failed: {e}")
        sys.exit(1)
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run_migrations())
