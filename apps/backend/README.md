# WataOmi Backend

AI-powered omnichannel customer engagement platform backend built with FastAPI.

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start development server
python run.py
```

## 📁 Project Structure

```
apps/backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/      # API endpoints
│   │   │   │   ├── auth.py     # Casdoor OAuth authentication
│   │   │   │   └── permissions.py  # Permission & capability APIs
│   │   │   ├── ai/             # AI-related endpoints
│   │   │   ├── *.py            # Resource endpoints (flows, bots, etc.)
│   │   │   └── __init__.py
│   │   └── deps.py             # Shared dependencies (auth, permissions)
│   ├── core/
│   │   ├── config.py           # Application configuration
│   │   ├── permissions.py      # RBAC permission definitions
│   │   └── auth.py             # Legacy auth (deprecated)
│   ├── db/
│   │   ├── session.py          # Database session management
│   │   └── base.py             # SQLModel base
│   ├── models/                 # Database models
│   ├── services/               # Business logic services
│   │   ├── auth/               # Authentication services
│   │   │   └── casdoor.py      # Casdoor integration
│   │   └── *.py                # Other services
│   └── main.py                 # FastAPI application
├── alembic/                    # Database migrations
├── docs/                       # Documentation
├── .env                        # Environment variables
├── requirements.txt            # Python dependencies
└── run.py                      # Application entry point
```

## 🔐 Authentication & Authorization

### Casdoor Integration

This project uses [Casdoor](https://casdoor.org/) for authentication and user management.

#### Setup Casdoor

1. **Start Casdoor** (via Docker):
```bash
docker-compose up -d casdoor
```

2. **Access Casdoor UI**: http://localhost:8030
   - Default credentials: `admin` / `123`

3. **Create Organization**:
   - Go to Organizations → Add
   - Name: `wataomi`
   - Enable: Password, Signup, Signin

4. **Create Application**:
   - Go to Applications → Add
   - Name: `wataomi-app`
   - Organization: `wataomi`
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:8000/api/v1/auth/callback`

5. **Update .env**:
```env
CASDOOR_ENDPOINT=http://localhost:8030
CASDOOR_ORG_NAME=wataomi
CASDOOR_APP_NAME=wataomi-app
CASDOOR_CLIENT_ID=<your_client_id>
CASDOOR_CLIENT_SECRET=<your_client_secret>
```

### Role-Based Access Control (RBAC)

The system implements RBAC with 6 roles:

| Role | Description | Permissions |
|------|-------------|-------------|
| `super_admin` | System administrator | All permissions |
| `admin` | Organization admin | Most permissions except user deletion |
| `manager` | Campaign manager | Create/manage campaigns, bots, channels |
| `editor` | Content editor | Create/edit content, flows, templates |
| `viewer` | Read-only user | View all resources |
| `user` | Basic user | Execute flows, view limited resources |

#### Permission Format

Permissions follow the pattern: `resource:action`

Examples:
- `flow:create` - Create flows
- `flow:read` - View flows
- `flow:update` - Edit flows
- `flow:delete` - Delete flows
- `flow:execute` - Execute flows

See `app/core/permissions.py` for full permission list.

## 📡 API Endpoints

### Authentication

```http
GET  /api/v1/casdoor/auth/login/url      # Get Casdoor OAuth URL
POST /api/v1/casdoor/auth/callback       # Handle OAuth callback
POST /api/v1/casdoor/auth/refresh        # Refresh access token
GET  /api/v1/casdoor/auth/me             # Get current user info
POST /api/v1/casdoor/auth/logout         # Logout
```

### Permissions

```http
GET  /api/v1/permissions/me/capabilities # Get user capabilities
POST /api/v1/permissions/check           # Check specific permissions
GET  /api/v1/permissions/widgets         # Get available widgets
GET  /api/v1/permissions/resources/{type} # Get resource permissions
GET  /api/v1/permissions/roles           # Get all roles (admin only)
```

### Resources

```http
# Flows
GET    /api/v1/flows
POST   /api/v1/flows
GET    /api/v1/flows/{id}
PUT    /api/v1/flows/{id}
DELETE /api/v1/flows/{id}

# Bots
GET    /api/v1/bots
POST   /api/v1/bots
GET    /api/v1/bots/{id}
PUT    /api/v1/bots/{id}
DELETE /api/v1/bots/{id}

# Templates
GET    /api/v1/templates
POST   /api/v1/templates
GET    /api/v1/templates/{id}
PUT    /api/v1/templates/{id}
DELETE /api/v1/templates/{id}

# ... and more
```

## 🔧 Development

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

### Code Quality

```bash
# Format code
black app/

# Lint
flake8 app/
pylint app/

# Type checking
mypy app/
```

## 🌐 Environment Variables

```env
# Application
PROJECT_NAME=WataOmi
API_V1_STR=/api/v1
DEBUG=True

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/wataomi

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Casdoor
CASDOOR_ENDPOINT=http://localhost:8030
CASDOOR_CLIENT_ID=your_client_id
CASDOOR_CLIENT_SECRET=your_client_secret
CASDOOR_APP_NAME=wataomi-app
CASDOOR_ORG_NAME=wataomi
CASDOOR_CERTIFICATE=-----BEGIN CERTIFICATE-----...

# External Services
N8N_URL=http://localhost:5678
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key
GOOGLE_API_KEY=your_google_api_key

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 📚 Documentation

- [API Documentation](http://localhost:8000/docs) - Swagger UI
- [ReDoc](http://localhost:8000/redoc) - Alternative API docs
- [Casdoor Docs](https://casdoor.org/docs/overview) - Casdoor documentation

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📝 License

MIT License
