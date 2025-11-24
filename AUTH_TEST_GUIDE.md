# Authentication Flow - Quick Test Guide

## 🧪 Hướng Dẫn Test Nhanh

### Bước 1: Kiểm Tra Servers Đang Chạy
```bash
# Backend should be running on port 8002
# Frontend should be running on port 3003
```

### Bước 2: Test Login Flow

1. **Mở browser** → `http://localhost:3003/login`

2. **Kiểm tra console** (F12):
   - Xem log "Casdoor Config" - tất cả values phải có (không empty)
   - Xem log "Casdoor Login URL" - phải là URL hợp lệ

3. **Click "Sign in with Casdoor"**:
   - Nếu config đúng: redirect đến Casdoor
   - Nếu config sai: hiển thị error message với setup instructions

4. **Login trên Casdoor**:
   - Nhập credentials
   - Sau khi login thành công, redirect về `/callback`

5. **Callback page**:
   - Hiển thị "Authenticating..."
   - Sau vài giây redirect đến `/dashboard`

6. **Dashboard**:
   - Check sidebar: User name và email phải hiển thị đúng (không còn "John Doe")
   - Check avatar: Hiển thị initial letter của tên user

### Bước 3: Test User Info Display

1. **Mở DevTools** → Application → Local Storage → `http://localhost:3003`

2. **Kiểm tra keys**:
   ```
   wataomi_token: "eyJ..." (JWT token)
   wataomi_user: {"name":"...","email":"...",...}
   ```

3. **Verify UI**:
   - Sidebar bottom: Tên và email user
   - Avatar: Initial letter

### Bước 4: Test Logout Flow

1. **Click "Sign Out"** button ở sidebar bottom

2. **Confirm dialog** xuất hiện:
   - Click "OK" để logout
   - Click "Cancel" để ở lại

3. **After logout**:
   - Redirect về `/login`
   - Check Local Storage: `wataomi_token` và `wataomi_user` đã bị xóa

4. **Check backend log**:
   ```
   INFO: 127.0.0.1:xxxxx - "POST /api/v1/auth/logout HTTP/1.1" 200 OK
   ```

### Bước 5: Test Route Protection

1. **Clear localStorage**:
   - F12 → Application → Local Storage → Clear All

2. **Try access dashboard**:
   ```
   http://localhost:3003/dashboard
   ```

3. **Expected behavior**:
   - Tự động redirect về `/login`
   - Không thể access dashboard khi chưa login

### Bước 6: Test Re-login

1. **Login lại** từ `/login`

2. **Verify**:
   - Token và user được lưu lại vào localStorage
   - Dashboard hiển thị đúng user info
   - Có thể navigate giữa các pages

## 📋 Checklist

### Login Flow
- [ ] Login page loads without errors
- [ ] Casdoor config validation works
- [ ] Error messages show when config missing
- [ ] Redirect to Casdoor works
- [ ] Callback receives code
- [ ] Backend exchanges code for token
- [ ] Token saved to localStorage
- [ ] User info saved to localStorage
- [ ] Redirect to dashboard works

### User Info Display
- [ ] Real user name displays (not "John Doe")
- [ ] Real email displays
- [ ] Avatar shows correct initial
- [ ] User info persists on page refresh

### Logout Flow
- [ ] Logout button is clickable
- [ ] Confirmation dialog appears
- [ ] Backend logout endpoint called
- [ ] localStorage cleared
- [ ] Redirect to login works

### Route Protection
- [ ] Cannot access dashboard without token
- [ ] Auto redirect to login when not authenticated
- [ ] Can access dashboard after login
- [ ] Token persists across page refreshes

## 🐛 Common Issues & Solutions

### Issue 1: "Configuration Error" on login page
**Solution**: 
1. Check `.env.local` exists in `apps/web/`
2. Restart frontend server: `npm run dev`

### Issue 2: Redirect loop
**Solution**:
1. Clear localStorage
2. Clear browser cache
3. Login again

### Issue 3: "401 Unauthorized" errors
**Solution**:
1. Check backend is running
2. Check CORS settings in backend
3. Verify token in localStorage is valid

### Issue 4: User info shows "Loading..."
**Solution**:
1. Check localStorage has `wataomi_user`
2. Check user object format
3. Check console for errors

### Issue 5: Logout doesn't work
**Solution**:
1. Check browser console for errors
2. Verify backend `/auth/logout` endpoint exists
3. Check network tab for API call

## 🔍 Debug Tips

### Check Token
```javascript
// In browser console
localStorage.getItem('wataomi_token')
```

### Check User
```javascript
// In browser console
JSON.parse(localStorage.getItem('wataomi_user'))
```

### Clear Auth Data
```javascript
// In browser console
localStorage.removeItem('wataomi_token')
localStorage.removeItem('wataomi_user')
```

### Monitor API Calls
1. Open DevTools → Network tab
2. Filter: XHR
3. Watch for:
   - `POST /api/v1/auth/casdoor/login`
   - `POST /api/v1/auth/logout`

## ✅ Expected Results

### After Successful Login:
```javascript
// localStorage
{
  wataomi_token: "eyJhbGciOiJSUzI1NiIs...",
  wataomi_user: {
    "name": "Your Name",
    "email": "your@email.com",
    "id": "user-id",
    ...
  }
}
```

### After Logout:
```javascript
// localStorage
{
  // Empty - all auth data cleared
}
```

### Backend Logs:
```
INFO: 127.0.0.1:xxxxx - "POST /api/v1/auth/casdoor/login HTTP/1.1" 200 OK
INFO: 127.0.0.1:xxxxx - "POST /api/v1/auth/logout HTTP/1.1" 200 OK
```

## 🎯 Success Criteria

✅ **Login works**: User can login và được redirect đến dashboard
✅ **User info displays**: Real user data hiển thị (không hardcoded)
✅ **Logout works**: User có thể logout và được redirect về login
✅ **Protection works**: Dashboard không access được khi chưa login
✅ **Persistence works**: User info persist sau khi refresh page

## 📞 Need Help?

Nếu gặp vấn đề:
1. Check `AUTHENTICATION_FLOW.md` cho detailed documentation
2. Check `CASDOOR_SETUP.md` cho Casdoor configuration
3. Check browser console và backend logs
4. Clear cache và localStorage, thử lại
