# Getting Started with WataOmi Backend

## Prerequisites

- Python 3.10+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (optional)

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd wataomi/apps/backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/wataomi
SECRET_KEY=your-secret-key-here

# Casdoor (after setup)
CASDOOR_ENDPOINT=http://localhost:8030
CASDOOR_CLIENT_ID=your_client_id
CASDOOR_CLIENT_SECRET=your_client_secret
CASDOOR_ORG_NAME=wataomi
CASDOOR_APP_NAME=wataomi-app

# Optional services
CLOUDINARY_CLOUD_NAME=your_cloud_name
SUPABASE_URL=your_supabase_url
QDRANT_URL=your_qdrant_url
```

### 5. Setup Database

```bash
# Create database
createdb wataomi

# Run migrations (if using Alembic)
alembic upgrade head
```

### 6. Setup Casdoor

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed Casdoor setup.

Quick steps:
1. Start Casdoor: `docker-compose up -d casdoor`
2. Access UI: http://localhost:8030 (admin/123)
3. Create organization: `wataomi`
4. Create application: `wataomi-app`
5. Copy Client ID & Secret to `.env`

### 7. Create Users

In Casdoor UI:
1. Go to Users → Add
2. Fill in:
   - Organization: `wataomi`
   - Email: `admin@wataomi.com`
   - Password: `Admin@123`
   - Tag: `super_admin` (this is the role!)
3. Enable "Is admin" for admin users
4. Save

Create users for each role:
- `super_admin` - Full access
- `admin` - Organization admin
- `manager` - Campaign manager
- `editor` - Content editor
- `viewer` - Read-only
- `user` - Basic user

### 8. Start Development Server

```bash
python run.py
```

Server will start at: http://localhost:8000

## Verify Installation

### 1. Check API Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy"}
```

### 2. Check API Documentation

Open in browser:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3. Test Authentication

```bash
# Get login URL
curl http://localhost:8000/api/v1/casdoor/auth/login/url

# Response will contain Casdoor OAuth URL
# Open it in browser to test login
```

### 4. Test with Token

After logging in and getting a token:

```bash
curl http://localhost:8000/api/v1/casdoor/auth/me \
  -H "Authorization: Bearer <your_token>"
```

## Project Structure

```
apps/backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/          # New auth & permission endpoints
│   │   │   │   ├── auth.py         # Casdoor OAuth
│   │   │   │   └── permissions.py  # RBAC APIs
│   │   │   ├── *.py                # Resource endpoints
│   │   │   └── __init__.py
│   │   └── deps.py                 # Auth dependencies
│   ├── core/
│   │   ├── config.py               # Settings
│   │   ├── permissions.py          # RBAC definitions
│   │   └── auth.py                 # Legacy auth
│   ├── db/
│   │   ├── session.py              # Database session
│   │   └── base.py                 # SQLModel base
│   ├── models/                     # Database models
│   ├── services/
│   │   ├── auth/                   # Auth services
│   │   │   ├── __init__.py
│   │   │   └── casdoor.py          # Casdoor integration
│   │   └── *.py                    # Other services
│   └── main.py                     # FastAPI app
├── docs/                           # Documentation
│   ├── GETTING_STARTED.md          # This file
│   ├── AUTHENTICATION.md           # Auth guide
│   ├── PERMISSIONS.md              # RBAC guide
│   └── API.md                      # API reference
├── .env.example                    # Environment template
├── requirements.txt                # Dependencies
├── run.py                          # Entry point
└── README.md                       # Overview
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature
```

### 2. Make Changes

Edit code in `app/` directory

### 3. Test Changes

```bash
# Run tests
pytest

# Check code quality
black app/
flake8 app/
```

### 4. Run Development Server

```bash
python run.py
```

Server auto-reloads on code changes.

### 5. Test API

Use Swagger UI: http://localhost:8000/docs

Or use curl/Postman to test endpoints.

## Common Tasks

### Add New Endpoint

1. Create endpoint file in `app/api/v1/`:

```python
# app/api/v1/my_resource.py
from fastapi import APIRouter, Depends
from app.api.deps import require_permission

router = APIRouter()

@router.get("/")
async def list_resources(
    current_user = Depends(require_permission("resource:read"))
):
    return {"items": []}
```

2. Register in `app/main.py`:

```python
from app.api.v1 import my_resource

app.include_router(
    my_resource.router,
    prefix=f"{settings.API_V1_STR}/my-resource",
    tags=["my-resource"]
)
```

### Add New Permission

1. Add to `app/core/permissions.py`:

```python
class Permission(str, Enum):
    # ... existing permissions
    MY_RESOURCE_CREATE = "my_resource:create"
    MY_RESOURCE_READ = "my_resource:read"
```

2. Add to role mappings:

```python
ROLE_PERMISSIONS = {
    Role.ADMIN: {
        # ... existing permissions
        Permission.MY_RESOURCE_CREATE.value,
        Permission.MY_RESOURCE_READ.value,
    },
    # ... other roles
}
```

### Add New Service

1. Create service file in `app/services/`:

```python
# app/services/my_service.py
class MyService:
    def __init__(self):
        pass
    
    async def do_something(self):
        pass

my_service = MyService()
```

2. Use in endpoints:

```python
from app.services.my_service import my_service

@router.post("/")
async def create_resource():
    result = await my_service.do_something()
    return result
```

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# Check connection string in .env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/wataomi
```

### Casdoor Connection Error

```bash
# Check Casdoor is running
curl http://localhost:8030

# Check .env configuration
CASDOOR_ENDPOINT=http://localhost:8030
```

### Import Errors

```bash
# Reinstall dependencies
pip install -r requirements.txt

# Check Python version
python --version  # Should be 3.10+
```

### Permission Denied Errors

1. Check user's role in Casdoor (Tag field)
2. Verify ROLE_PERMISSIONS in `app/core/permissions.py`
3. Check JWT token contains role field

## Next Steps

1. ✅ Complete Casdoor setup
2. ✅ Create test users
3. ✅ Test authentication flow
4. ✅ Test permission system
5. ⏭️ Integrate with frontend
6. ⏭️ Add custom business logic
7. ⏭️ Deploy to production

## Resources

- [README.md](../README.md) - Project overview
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Auth setup
- [PERMISSIONS.md](./PERMISSIONS.md) - RBAC guide
- [API.md](./API.md) - API reference
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Casdoor Docs](https://casdoor.org/docs/overview)

## Support

For issues or questions:
1. Check documentation in `docs/`
2. Check API docs: http://localhost:8000/docs
3. Review error logs
4. Create an issue in repository

Happy coding! 🚀
