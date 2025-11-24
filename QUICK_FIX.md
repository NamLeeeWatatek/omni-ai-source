# 🚨 Quick Fix: Connection Refused Error

## Vấn Đề
```
POST http://localhost:8000/api/v1/auth/casdoor/login 
net::ERR_CONNECTION_REFUSED
```

## Nguyên Nhân
1. Frontend gọi sai port (8000 thay vì 8002)
2. Backend .env có lỗi syntax

## ⚡ Quick Fix (30 giây)

### Bước 1: Sửa Frontend API URL
Mở `apps/web/.env.local`, thêm/sửa dòng này:
```env
NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1
```

### Bước 2: Fix Backend .env
Mở `apps/backend/.env`, tìm dòng 51 (certificate).

Nếu certificate nhiều dòng, đổi thành 1 dòng với `\n`:
```env
CASDOOR_CERTIFICATE=-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----
```

Hoặc tạm thời dùng placeholder:
```env
CASDOOR_CERTIFICATE=placeholder
```

### Bước 3: Restart Servers
```bash
# Ctrl+C cả 2 terminals, rồi:
cd apps/backend && python run.py
cd apps/web && npm run dev
```

### Bước 4: Test
Go to `http://localhost:3003/login` và thử login lại.

## ✅ Verify
- Backend log: Không có "parse error"
- Network tab: POST đến `localhost:8002` (không phải 8000)
- Status: 200 OK

## 📚 Chi Tiết
Xem `FIX_CONNECTION_REFUSED.md` để biết thêm chi tiết.

## 🆘 Vẫn Lỗi?
1. Check backend đang chạy: `curl http://localhost:8002/health`
2. Check port: `netstat -ano | findstr :8002`
3. Clear browser cache và thử lại
