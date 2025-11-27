@echo off
echo ============================================================
echo WATAOMI - Database Setup (Using psql)
echo ============================================================
echo.

echo Running migrations...
echo.

echo [1/2] Creating main schema...
psql -U wataomi -d wataomi -f migrations/000_init_complete_schema.sql
if %errorlevel% neq 0 (
    echo ERROR: Main schema migration failed!
    pause
    exit /b 1
)
echo ✓ Main schema created
echo.

echo [2/2] Adding AI conversations...
psql -U wataomi -d wataomi -f migrations/add_ai_conversations.sql
if %errorlevel% neq 0 (
    echo ERROR: AI conversations migration failed!
    pause
    exit /b 1
)
echo ✓ AI conversations added
echo.

echo ============================================================
echo SUCCESS! Database setup completed
echo ============================================================
echo.
echo Next steps:
echo 1. Seed data (optional): python seed_data.py
echo 2. Start backend: python -m uvicorn app.main:app --reload
echo 3. Start frontend: cd ..\web ^&^& npm run dev
echo.
pause
