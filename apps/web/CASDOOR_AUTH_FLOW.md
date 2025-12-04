# Casdoor Authentication Flow

## Tổng quan

Flow authentication đã được cải thiện với các tính năng sau:

### 1. Tách biệt Loading State

- **Landing Page** (`/`): Loading state riêng cho trang chủ
- **Login Page** (`/login`): Loading state riêng với style "force-light"
- **Dashboard** (`/dashboard/*`): Loading state riêng cho dashboard

Mỗi phần có loading message và style riêng, không ảnh hưởng lẫn nhau.

### 2. Đóng Popup Casdoor Tự Động

Khi login thành công, popup Casdoor sẽ tự động đóng thông qua:

#### Flow hoạt động:

1. **Login Page** mở popup Casdoor
2. **Callback Page** (`/callback` hoặc `/auth/callback`) xử lý authentication
3. Callback page gửi message về parent window:
   - `CASDOOR_LOGIN_SUCCESS`: Login thành công
   - `CASDOOR_LOGIN_ERROR`: Login thất bại
4. **Login Page** nhận message và:
   - Đóng popup
   - Redirect đến dashboard (nếu thành công)
   - Hiển thị lỗi (nếu thất bại)

#### Security:

- Sử dụng `window.postMessage()` với origin verification
- Chỉ chấp nhận message từ cùng origin

### 3. Code Changes

#### Login Page (`apps/web/app/login/page.tsx`)

```typescript
// Listen for message from callback page
const handleMessage = (event: MessageEvent) => {
    // Verify origin for security
    if (event.origin !== window.location.origin) return
    
    if (event.data.type === 'CASDOOR_LOGIN_SUCCESS') {
        // Close popup and redirect
        if (popup && !popup.closed) {
            popup.close()
        }
        window.location.href = '/dashboard'
    }
    
    if (event.data.type === 'CASDOOR_LOGIN_ERROR') {
        // Close popup and show error
        if (popup && !popup.closed) {
            popup.close()
        }
        setConfigError(event.data.error || 'Login failed')
    }
}

window.addEventListener('message', handleMessage)
```

#### Callback Pages

Cả hai callback pages (`/callback` và `/auth/callback`) đều:

1. Xử lý authentication
2. Gửi message về parent window nếu đang trong popup
3. Tự động đóng popup sau khi gửi message
4. Fallback: redirect bình thường nếu không phải popup

```typescript
// Notify parent window if in popup
if (window.opener) {
    window.opener.postMessage(
        { type: 'CASDOOR_LOGIN_SUCCESS' },
        window.location.origin
    )
    // Close popup after a short delay
    setTimeout(() => {
        window.close()
    }, 500)
} else {
    // Redirect to dashboard if not in popup
    router.push('/dashboard')
}
```

## Testing

1. Mở trang login
2. Click "Sign in with Casdoor"
3. Popup Casdoor sẽ mở
4. Sau khi login thành công:
   - Popup tự động đóng
   - Redirect về dashboard
5. Nếu có lỗi:
   - Popup tự động đóng
   - Hiển thị thông báo lỗi

## Browser Compatibility

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Opera: ✅

Tất cả các trình duyệt hiện đại đều hỗ trợ `window.postMessage()` và `window.opener`.
