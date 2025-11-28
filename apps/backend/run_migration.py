"""
Run database migration
Usage: python run_migration.py migrations/add_bot_icon.sql
"""
import sys
import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def run_migration(migration_file: str):
    """Run a SQL migration file"""
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    # Read migration file
    migration_path = Path(migration_file)
    if not migration_path.exists():
        print(f"❌ Migration file not found: {migration_file}")
        return False
    
    sql = migration_path.read_text()
    
    print(f"� Run:ning migration: {migration_path.name}")
    print(f"📄 SQL:\n{sql}\n")
    
    try:
        async with engine.begin() as conn:
            # Split by semicolon and execute each statement
            statements = [s.strip() for s in sql.split(';') if s.strip()]
            for statement in statements:
                if statement and not statement.startswith('--'):
                    # Skip comments
                    clean_statement = '\n'.join(
                        line for line in statement.split('\n') 
                        if not line.strip().startswith('--')
                    ).strip()
                    
                    if clean_statement:
                        print(f"Executing: {clean_statement[:100]}...")
                        await conn.execute(text(clean_statement))
        
        print(f"✅ Migration completed successfully!")
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await engine.dispose()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_migration.py <migration_file>")
        print("Example: python run_migration.py migrations/add_bot_icon.sql")
        sys.exit(1)
    
    migration_file = sys.argv[1]
    success = asyncio.run(run_migration(migration_file))
    sys.exit(0 if success else 1)
