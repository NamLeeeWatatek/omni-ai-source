# Hướng dẫn chạy WataOmi với Port mới

## Cấu hình Port
- **Backend**: Port 8002
- **Frontend**: Port 3003

## Cách chạy

### 1. Chạy Backend (Port 8002)

```bash
cd apps/backend
python run.py
```

Hoặc nếu dùng uvicorn trực tiếp:
```bash
cd apps/backend
uvicorn app.main:app --reload --port 8002
```

Backend sẽ chạy tại: http://localhost:8002
- API Docs: http://localhost:8002/docs
- Health Check: http://localhost:8002/health

### 2. Chạy Frontend (Port 3003)

```bash
cd apps/web
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3003

## Cấu hình Environment Variables

### Backend (.env)
```env
# Casdoor
CASDOOR_ENDPOINT=https://your-casdoor-instance.com
CASDOOR_CLIENT_ID=your_client_id
CASDOOR_CLIENT_SECRET=your_client_secret
CASDOOR_CERTIFICATE=your_certificate
CASDOOR_ORG_NAME=your_org
CASDOOR_APP_NAME=your_app

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Other services
GOOGLE_API_KEY=your_google_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env.local)
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3003

# Casdoor
NEXT_PUBLIC_CASDOOR_ENDPOINT=https://your-casdoor-instance.com
NEXT_PUBLIC_CASDOOR_CLIENT_ID=your_client_id
NEXT_PUBLIC_CASDOOR_ORG_NAME=your_org
NEXT_PUBLIC_CASDOOR_APP_NAME=your_app
```

## CORS Configuration

Backend đã được cấu hình để chấp nhận requests từ:
- http://localhost:3000
- http://localhost:3001
- http://localhost:3003
- https://wataomi.com

## Kiểm tra

1. **Backend**: Truy cập http://localhost:8002/docs để xem API documentation
2. **Frontend**: Truy cập http://localhost:3003 để xem ứng dụng
3. **Login**: Truy cập http://localhost:3003/login để test Casdoor login flow

## Troubleshooting

### Port đã được sử dụng
Nếu port 8002 hoặc 3003 đã được sử dụng:
- Kiểm tra process đang chạy: `netstat -ano | findstr :8002`
- Kill process: `taskkill /PID <PID> /F`

### CORS Error
Nếu gặp lỗi CORS, kiểm tra:
1. Backend đang chạy đúng port 8002
2. Frontend đang gọi đúng URL http://localhost:8002/api/v1
3. CORS middleware trong backend đã include port 3003

### Casdoor Login không hoạt động
1. Kiểm tra console log khi click "Sign in with Casdoor"
2. Verify các biến môi trường Casdoor đã được cấu hình
3. Đảm bảo callback URL trong Casdoor là http://localhost:3003/callback
