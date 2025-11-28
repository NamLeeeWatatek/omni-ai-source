# Library Structure

## Authentication
- **`hooks/useAuth.ts`** - NextAuth hook for client components
- **`auth.ts`** (root) - NextAuth v5 configuration

## API Clients
- **`axios-client.ts`** - For client components (uses NextAuth session)
- **`axios-server.ts`** - For server components (uses NextAuth auth())
- **`api.ts`** - Fetch-based API helper (legacy, prefer axios)

## State Management
- **`store/`** - Redux Toolkit store
  - `hooks.ts` - Typed hooks (useAppDispatch, useAppSelector)
  - `slices/` - Redux slices
  - `Provider.tsx` - Redux provider wrapper

## Constants
- **`constants/storage.ts`** - Storage key definitions

## Usage Examples

### Client Component
```tsx
'use client'
import { useAuth } from '@/lib/hooks/useAuth'
import axiosClient from '@/lib/axios-client'

export default function MyComponent() {
  const { user, isAuthenticated, accessToken } = useAuth()
  
  const fetchData = async () => {
    const data = await axiosClient.get('/endpoint')
  }
}
```

### Server Component
```tsx
import { auth } from '@/auth'
import { getAuthenticatedAxios } from '@/lib/axios-server'

export default async function MyPage() {
  const session = await auth()
  const axios = await getAuthenticatedAxios()
  const data = await axios.get('/endpoint')
}
```

### Redux
```tsx
'use client'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { fetchFlows } from '@/lib/store/slices/flowsSlice'

export default function MyComponent() {
  const dispatch = useAppDispatch()
  const flows = useAppSelector(state => state.flows.items)
  
  useEffect(() => {
    dispatch(fetchFlows())
  }, [])
}
```
