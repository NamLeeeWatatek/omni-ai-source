# Changelog

## [Unreleased] - 2025-11-28

### Added
- **Casdoor OAuth Integration**
  - OAuth 2.0 authentication flow
  - JWT token management
  - User session handling
  - Token refresh mechanism
  
- **Role-Based Access Control (RBAC)**
  - 6 predefined roles (super_admin, admin, manager, editor, viewer, user)
  - Granular permission system (resource:action format)
  - Permission checking middleware
  - Role-based endpoint protection
  
- **Permission API Endpoints**
  - Get user capabilities
  - Check specific permissions
  - Get available widgets
  - Get resource permissions
  - List all roles (admin only)
  
- **Auth Service Layer**
  - Organized auth services in `app/services/auth/`
  - Casdoor service for OAuth operations
  - Clean separation of concerns
  
- **Comprehensive Documentation**
  - Getting Started guide
  - Authentication setup guide
  - Permissions & RBAC guide
  - API reference documentation
  - Project README with structure overview

### Changed
- **Project Structure Reorganization**
  - Moved auth logic to `app/services/auth/`
  - Centralized auth endpoints in `app/api/v1/endpoints/`
  - Cleaned up root directory (removed temporary scripts)
  - Organized documentation in `docs/` folder
  
- **Dependency Management**
  - Updated `app/api/deps.py` with new auth dependencies
  - Added permission checking decorators
  - Improved JWT token validation

### Removed
- Temporary setup scripts (sync_casdoor_manual.py, setup_casdoor_org.py, etc.)
- Old documentation files (multiple MD files in root)
- Unused migration scripts
- CSV import files

### Fixed
- Auth flow with proper JWT handling
- Permission checking logic
- Role extraction from Casdoor JWT

## Project Structure

```
apps/backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/      # Auth & Permission APIs
│   │   │   └── *.py            # Resource endpoints
│   │   └── deps.py             # Auth dependencies
│   ├── core/
│   │   ├── config.py           # Configuration
│   │   └── permissions.py      # RBAC definitions
│   ├── models/                 # Database models
│   ├── services/
│   │   ├── auth/               # Auth services
│   │   └── *.py                # Other services
│   └── main.py                 # FastAPI app
├── docs/                       # Documentation
│   ├── GETTING_STARTED.md
│   ├── AUTHENTICATION.md
│   ├── PERMISSIONS.md
│   └── API.md
├── .env.example                # Environment template
├── requirements.txt
├── run.py
└── README.md
```

## API Endpoints

### Authentication
- `GET /api/v1/casdoor/auth/login/url` - Get OAuth URL
- `POST /api/v1/casdoor/auth/callback` - Handle OAuth callback
- `GET /api/v1/casdoor/auth/me` - Get current user
- `POST /api/v1/casdoor/auth/refresh` - Refresh token
- `POST /api/v1/casdoor/auth/logout` - Logout

### Permissions
- `GET /api/v1/permissions/me/capabilities` - Get user capabilities
- `POST /api/v1/permissions/check` - Check permissions
- `GET /api/v1/permissions/widgets` - Get available widgets
- `GET /api/v1/permissions/resources/{type}` - Get resource permissions
- `GET /api/v1/permissions/roles` - List all roles

## Roles & Permissions

| Role | Description | Use Case |
|------|-------------|----------|
| super_admin | Full system access | Platform owners |
| admin | Organization admin | IT managers |
| manager | Campaign manager | Marketing managers |
| editor | Content editor | Content creators |
| viewer | Read-only access | Stakeholders |
| user | Basic user | End users |

## Next Steps

1. ✅ Setup Casdoor
2. ✅ Create users with roles
3. ✅ Test authentication
4. ⏭️ Integrate with frontend
5. ⏭️ Add custom business logic
6. ⏭️ Deploy to production

## Contributors

- Development Team

## License

MIT License
