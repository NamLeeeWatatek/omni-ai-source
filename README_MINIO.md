# 🚀 MinIO Setup - Quick Start

MinIO đã được setup hoàn chỉnh cho WataOmi để lưu trữ hình ảnh và tài liệu.

## ⚡ Khởi động nhanh

### Windows
```bash
cd services/minio
start.bat
```

### Linux/Mac
```bash
cd services/minio
./start.sh
```

### Hoặc dùng Docker Compose
```bash
cd services/minio
docker-compose up -d
```

## 🌐 Truy cập

- **MinIO Console**: http://localhost:9001
- **MinIO API**: http://localhost:9000
- **Username**: minioadmin
- **Password**: minioadmin123

## 📦 Buckets

3 buckets được tạo tự động:
- `images` - Hình ảnh (JPG, PNG, GIF, WebP, SVG)
- `documents` - Tài liệu (PDF, DOC, DOCX, TXT, CSV, XLS, XLSX)
- `avatars` - Avatar người dùng

## 🎯 Demo Upload

Sau khi khởi động backend và frontend, truy cập:

**http://localhost:3000/files**

## 📚 Tài liệu đầy đủ

Xem file `docs/MINIO_SETUP_GUIDE.md` để biết thêm chi tiết về:
- Cấu hình backend/frontend
- Sử dụng API upload
- Components upload
- Troubleshooting

## ✅ Checklist

- [x] MinIO Docker setup
- [x] Backend S3 integration
- [x] Frontend upload service
- [x] Upload components (FileUpload, FileDropzone)
- [x] Image gallery component
- [x] File list component
- [x] Demo page
- [x] Documentation

## 🔧 Cấu hình

### Backend (.env)
```env
FILE_DRIVER=s3-presigned
ACCESS_KEY_ID=minioadmin
SECRET_ACCESS_KEY=minioadmin123
AWS_S3_REGION=us-east-1
AWS_DEFAULT_S3_BUCKET=images
MINIO_ENDPOINT=http://localhost:9000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MINIO_ENDPOINT=http://localhost:9000
```

## 🛠️ Sử dụng trong Code

### Upload Component
```tsx
import { FileUpload } from '@/components/ui/file-upload';

<FileUpload
  bucket="images"
  accept="image/*"
  onUploadComplete={(url) => console.log('Uploaded:', url)}
/>
```

### Upload Hook
```tsx
import { useFileUpload } from '@/lib/hooks/use-file-upload';

const { uploadFile, uploading, progress } = useFileUpload({
  bucket: 'images',
  onSuccess: (url) => console.log('Success:', url)
});
```

### Upload Service
```tsx
import { fileUploadService } from '@/lib/services/file-upload-service';

const result = await fileUploadService.uploadFile(file, {
  bucket: 'images',
  onProgress: (p) => console.log(`${p}%`)
});
```

## 🎨 Components có sẵn

1. **FileUpload** - Button upload với preview
2. **FileDropzone** - Drag & drop upload
3. **ImageGallery** - Hiển thị gallery hình ảnh
4. **FileList** - Danh sách file dạng table

## 🐛 Troubleshooting

### MinIO không khởi động
```bash
# Kiểm tra port
netstat -an | findstr "9000"
netstat -an | findstr "9001"

# Xem logs
docker-compose logs minio
```

### Upload lỗi
- Kiểm tra MinIO đã chạy: http://localhost:9001
- Kiểm tra backend đã chạy: http://localhost:8000
- Kiểm tra .env và .env.local đã cấu hình đúng

## 📞 Support

Xem thêm tài liệu chi tiết tại `docs/MINIO_SETUP_GUIDE.md`
