# NextAuth v5 Migration Complete ✅

## Vấn đề đã fix

**Lỗi gốc**: NextAuth v4 không tương thích với Next.js 14 App Router
- Error: `410 Gone` khi gọi `/api/auth/session`
- Message: "Please use /auth/login for Casdoor OAuth"

**Nguyên nhân**: NextAuth v4 được thiết kế cho Pages Router, không phải App Router của Next.js 14+

**Giải pháp**: Upgrade lên NextAuth v5 (Auth.js)

## Những thay đổi đã thực hiện

### 1. Upgrade package
```bash
npm install next-auth@beta
```

### 2. Tạo file auth.ts mới (root level)
- Di chuyển từ `lib/auth.ts` → `auth.ts`
- Sử dụng cú pháp mới của NextAuth v5
- Export `handlers`, `signIn`, `signOut`, `auth`

### 3. Update API route
**File**: `app/api/auth/[...nextauth]/route.ts`
```typescript
// Cũ (v4)
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

// Mới (v5)
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### 4. Update middleware
**File**: `middleware.ts`
- Sử dụng `auth()` function thay vì `withAuth()`
- Cú pháp đơn giản hơn và rõ ràng hơn

### 5. Update SessionProvider
**File**: `components/providers/session-provider.tsx`
- Thêm `basePath="/api/auth"` để đảm bảo routing đúng

### 6. Update type definitions
**File**: `lib/types/next-auth.d.ts`
- Thay đổi từ `"next-auth/jwt"` → `"@auth/core/jwt"`

## Cách test

### 1. Restart dev server
```bash
npm run dev
```

### 2. Kiểm tra session
Truy cập: `http://localhost:3000/test-auth`

Bạn sẽ thấy:
- ✅ Status: "unauthenticated" (nếu chưa login)
- ✅ Session: null
- ✅ Không còn lỗi 410

### 3. Test login flow
1. Vào `/login`
2. Click "Sign in with Casdoor"
3. Đăng nhập tại Casdoor
4. Callback về `/callback`
5. Redirect về `/dashboard`

### 4. Kiểm tra protected routes
- Truy cập `/dashboard` khi chưa login → redirect về `/login`
- Login xong → có thể truy cập `/dashboard`

## API Changes (NextAuth v4 → v5)

### Import changes
```typescript
// v4
import { useSession, signIn, signOut } from "next-auth/react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// v5
import { useSession, signIn, signOut } from "next-auth/react"
import { auth } from "@/auth"
```

### Server-side auth
```typescript
// v4
const session = await getServerSession(authOptions)

// v5
const session = await auth()
```

### Middleware
```typescript
// v4
import { withAuth } from "next-auth/middleware"
export default withAuth({ ... })

// v5
import { auth } from "@/auth"
export default auth((req) => { ... })
```

## Breaking Changes

### 1. Configuration structure
- `authOptions` object → direct config in `NextAuth()`
- Callbacks signature slightly different

### 2. Type definitions
- `next-auth/jwt` → `@auth/core/jwt`

### 3. Server functions
- `getServerSession()` → `auth()`

## Files Changed

✅ `auth.ts` (new)
✅ `app/api/auth/[...nextauth]/route.ts`
✅ `middleware.ts`
✅ `components/providers/session-provider.tsx`
✅ `lib/types/next-auth.d.ts`
❌ `lib/auth.ts` (deleted)

## Next Steps

1. ✅ Restart dev server
2. ✅ Test `/test-auth` page
3. ✅ Test login flow
4. ✅ Test protected routes
5. ✅ Verify session persistence

## Troubleshooting

### Session không được lưu
- Kiểm tra cookies trong DevTools
- Đảm bảo NEXTAUTH_URL match với URL đang truy cập
- Clear cookies và thử lại

### Redirect loop
- Kiểm tra middleware config
- Đảm bảo `/login` và `/callback` không bị protect

### "Invalid credentials"
- Kiểm tra backend API response
- Xem console logs trong terminal

## Resources

- [NextAuth v5 Documentation](https://authjs.dev/)
- [Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Next.js 14 + Auth.js](https://authjs.dev/getting-started/installation?framework=next.js)
