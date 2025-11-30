# Mock Data Removal - Complete ✅

## Summary

Đã loại bỏ tất cả mock data trong frontend. Frontend giờ chỉ gọi backend thực tế.

## Changes Made

### 1. ✅ WebSocket Execution Hook
**File:** `apps/web/lib/hooks/use-execution-websocket.ts`

**Before:**
- Có mock execution với random success/failure
- Simulate node execution với timeout
- Mock output data

**After:**
- Kết nối WebSocket thực tế tới backend
- Nhận real-time events từ backend
- Không còn mock data

### 2. ✅ Permissions API
**File:** `apps/web/lib/api/permissions.ts`

**Before:**
```typescript
getAllRoles: async () => {
  return Promise.resolve([
    { id: 'admin', name: 'Admin', description: 'Full access' },
    { id: 'user', name: 'User', description: 'Standard user' },
  ])
}
```

**After:**
```typescript
getAllRoles: async () => {
  return axiosClient.get('/permissions/roles')
}
```

Tương tự cho:
- `getAvailableWidgets()` - Gọi `/permissions/widgets`
- `getResourcePermissions()` - Gọi `/permissions/resources/{type}`

## Verified Clean

✅ **No mock data found in:**
- `apps/web/lib/api/flows.ts` - All real API calls
- `apps/web/lib/api/nodeTypes.ts` - All real API calls
- `apps/web/lib/api/permissions.ts` - All real API calls (fixed)
- `apps/web/lib/hooks/` - All hooks use real services
- `apps/web/lib/services/` - WebSocket service is real
- `apps/web/app/` - No static data in pages
- `apps/web/components/` - No hardcoded data

✅ **No localStorage/sessionStorage mock data**

✅ **No commented-out API calls**

✅ **No static return statements with fake data**

## How Frontend Calls Backend Now

### 1. REST API Calls
```typescript
// Via axios-client.ts
import axiosClient from '@/lib/axios-client'

// Example: Fetch flows
const flows = await axiosClient.get('/flows/')

// Example: Create flow
const newFlow = await axiosClient.post('/flows/', data)
```

### 2. WebSocket Connections
```typescript
// Via websocket-service.ts
import { wsService } from '@/lib/services/websocket-service'

// Connect and listen to events
wsService.connect('/ws/execute/123', () => {
  wsService.send('/ws/execute/123', { action: 'start' })
})

wsService.on('/ws/execute/123', 'nodeExecutionAfter', (data) => {
  console.log('Node completed:', data)
})
```

### 3. Server-Side API Calls (Next.js Server Components)
```typescript
// Via axios-server.ts
import { getAuthenticatedAxios } from '@/lib/axios-server'

const axios = await getAuthenticatedAxios()
const response = await axios.get('/flows/')
```

## Backend Endpoints Required

Frontend expects these backend endpoints to work:

### Auth
- `POST /api/v1/auth/casdoor/callback` - OAuth callback
- `GET /api/v1/auth/me` - Get current user

### Flows
- `GET /api/v1/flows/` - List flows
- `GET /api/v1/flows/{id}` - Get flow
- `POST /api/v1/flows/` - Create flow
- `PATCH /api/v1/flows/{id}` - Update flow
- `DELETE /api/v1/flows/{id}` - Delete flow
- `POST /api/v1/flows/{id}/duplicate` - Duplicate flow
- `POST /api/v1/flows/{id}/archive` - Archive flow

### Node Types
- `GET /api/v1/node-types/` - List node types
- `GET /api/v1/node-types/categories` - List categories
- `GET /api/v1/node-types/{id}` - Get node type

### Permissions
- `GET /api/v1/permissions/me/capabilities` - Get user capabilities
- `POST /api/v1/permissions/check` - Check permissions
- `GET /api/v1/permissions/roles` - List roles (admin)
- `GET /api/v1/permissions/widgets` - Get available widgets
- `GET /api/v1/permissions/resources/{type}` - Get resource permissions

### WebSocket
- `WS /ws/execute/{flowId}` - Execute flow with real-time updates

## Testing

To verify everything works:

1. **Start backend:**
   ```bash
   cd apps/backend
   npm run start:dev
   ```

2. **Start frontend:**
   ```bash
   cd apps/web
   npm run dev
   ```

3. **Test flows:**
   - Create a flow
   - Execute a flow
   - Check WebSocket connection in browser DevTools

4. **Test permissions:**
   - Login with different roles
   - Check permission-based UI rendering

## Notes

- All API calls now go through `axios-client.ts` or `axios-server.ts`
- WebSocket connections use `websocket-service.ts`
- No more mock data, no more fake responses
- Frontend will show errors if backend is not running
- Make sure backend endpoints are implemented and working

## Next Steps

If you see errors:
1. Check backend is running
2. Check backend endpoints exist
3. Check CORS settings
4. Check authentication tokens
5. Check WebSocket connection URL
