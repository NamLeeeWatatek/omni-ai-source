# Quick Start Guide

## 🚀 5-Minute Setup

### 1. Install & Run (2 minutes)

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start server
python run.py
```

Server runs at: http://localhost:8000

### 2. Setup Casdoor (2 minutes)

```bash
# Start Casdoor
docker-compose up -d casdoor
```

Open http://localhost:8030 (login: `admin` / `123`)

1. **Create Organization**: `wataomi`
2. **Create Application**: `wataomi-app`
3. **Copy credentials** to `.env`:
   ```env
   CASDOOR_CLIENT_ID=<your_client_id>
   CASDOOR_CLIENT_SECRET=<your_client_secret>
   ```

### 3. Create Test User (1 minute)

In Casdoor UI → Users → Add:
- Organization: `wataomi`
- Email: `admin@wataomi.com`
- Password: `Admin@123`
- Tag: `super_admin` ← **This is the role!**
- ✅ Is admin

## ✅ Verify

```bash
# Check health
curl http://localhost:8000/health

# Get login URL
curl http://localhost:8000/api/v1/casdoor/auth/login/url
```

## 📚 Next Steps

- [Full Setup Guide](docs/GETTING_STARTED.md)
- [Authentication Guide](docs/AUTHENTICATION.md)
- [Permissions Guide](docs/PERMISSIONS.md)
- [API Documentation](http://localhost:8000/docs)

## 🎯 Key Endpoints

```
GET  /api/v1/casdoor/auth/login/url      # Get OAuth URL
POST /api/v1/casdoor/auth/callback       # Login callback
GET  /api/v1/permissions/me/capabilities # Get user permissions
GET  /docs                                # API documentation
```

## 🔐 Test Roles

Create users with different roles (Tag field):
- `super_admin` - Full access
- `admin` - Organization admin
- `manager` - Campaign manager
- `editor` - Content editor
- `viewer` - Read-only
- `user` - Basic user

## 📁 Project Structure

```
apps/backend/
├── app/
│   ├── api/v1/endpoints/   # Auth & Permission APIs
│   ├── core/permissions.py # RBAC definitions
│   ├── services/auth/      # Auth services
│   └── main.py             # FastAPI app
├── docs/                   # Documentation
├── .env                    # Configuration
└── run.py                  # Entry point
```

## 🆘 Troubleshooting

**Server won't start?**
```bash
pip install -r requirements.txt
```

**Casdoor connection error?**
```bash
docker-compose up -d casdoor
# Check: http://localhost:8030
```

**Permission denied?**
- Check user's Tag field in Casdoor
- Verify it matches a role: super_admin, admin, manager, editor, viewer, user

## 🎉 Done!

You now have:
- ✅ Backend running
- ✅ Casdoor OAuth setup
- ✅ RBAC system ready
- ✅ Test user created

Ready to integrate with frontend! 🚀
