# API Documentation

## Base URL

```
Development: http://localhost:8000
Production: https://api.wataomi.com
```

## Authentication

All API requests (except auth endpoints) require authentication using JWT Bearer token:

```http
Authorization: Bearer <access_token>
```

## Response Format

### Success Response

```json
{
  "data": {...},
  "message": "Success",
  "status": 200
}
```

### Error Response

```json
{
  "detail": "Error message",
  "status": 400
}
```

## Endpoints

### Authentication

#### Get Login URL
```http
GET /api/v1/casdoor/auth/login/url
```

#### OAuth Callback
```http
POST /api/v1/casdoor/auth/callback
Content-Type: application/json

{
  "code": "string",
  "state": "string"
}
```

#### Get Current User
```http
GET /api/v1/casdoor/auth/me
Authorization: Bearer <token>
```

#### Refresh Token
```http
POST /api/v1/casdoor/auth/refresh
Content-Type: application/json

{
  "refresh_token": "string"
}
```

#### Logout
```http
POST /api/v1/casdoor/auth/logout
Authorization: Bearer <token>
```

### Permissions

#### Get User Capabilities
```http
GET /api/v1/permissions/me/capabilities
Authorization: Bearer <token>
```

#### Check Permissions
```http
POST /api/v1/permissions/check
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissions": ["flow:create", "flow:delete"]
}
```

#### Get Available Widgets
```http
GET /api/v1/permissions/widgets
Authorization: Bearer <token>
```

#### Get Resource Permissions
```http
GET /api/v1/permissions/resources/{resource_type}
Authorization: Bearer <token>
```

#### Get All Roles (Admin Only)
```http
GET /api/v1/permissions/roles
Authorization: Bearer <token>
```

### Flows

#### List Flows
```http
GET /api/v1/flows?skip=0&limit=10
Authorization: Bearer <token>
```

#### Get Flow
```http
GET /api/v1/flows/{flow_id}
Authorization: Bearer <token>
```

#### Create Flow
```http
POST /api/v1/flows
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "nodes": [...],
  "edges": [...]
}
```

#### Update Flow
```http
PUT /api/v1/flows/{flow_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "nodes": [...],
  "edges": [...]
}
```

#### Delete Flow
```http
DELETE /api/v1/flows/{flow_id}
Authorization: Bearer <token>
```

### Bots

#### List Bots
```http
GET /api/v1/bots
Authorization: Bearer <token>
```

#### Get Bot
```http
GET /api/v1/bots/{bot_id}
Authorization: Bearer <token>
```

#### Create Bot
```http
POST /api/v1/bots
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "flow_id": "string"
}
```

#### Update Bot
```http
PUT /api/v1/bots/{bot_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "flow_id": "string"
}
```

#### Delete Bot
```http
DELETE /api/v1/bots/{bot_id}
Authorization: Bearer <token>
```

### Templates

#### List Templates
```http
GET /api/v1/templates?skip=0&limit=10
Authorization: Bearer <token>
```

#### Get Template
```http
GET /api/v1/templates/{template_id}
Authorization: Bearer <token>
```

#### Create Template
```http
POST /api/v1/templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "content": "string",
  "type": "text|image|video"
}
```

#### Update Template
```http
PUT /api/v1/templates/{template_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "content": "string"
}
```

#### Delete Template
```http
DELETE /api/v1/templates/{template_id}
Authorization: Bearer <token>
```

### Channels

#### List Channels
```http
GET /api/v1/channels
Authorization: Bearer <token>
```

#### Get Channel
```http
GET /api/v1/channels/{channel_id}
Authorization: Bearer <token>
```

#### Create Channel
```http
POST /api/v1/channels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "type": "whatsapp|facebook|instagram",
  "config": {...}
}
```

### Conversations

#### List Conversations
```http
GET /api/v1/conversations?skip=0&limit=10
Authorization: Bearer <token>
```

#### Get Conversation
```http
GET /api/v1/conversations/{conversation_id}
Authorization: Bearer <token>
```

### Analytics

#### Get Dashboard Stats
```http
GET /api/v1/stats/dashboard
Authorization: Bearer <token>
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

## Rate Limiting

- 100 requests per minute per user
- 1000 requests per hour per user

## Pagination

List endpoints support pagination:

```http
GET /api/v1/flows?skip=0&limit=10
```

Response includes pagination metadata:

```json
{
  "items": [...],
  "total": 100,
  "skip": 0,
  "limit": 10
}
```

## Interactive Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
