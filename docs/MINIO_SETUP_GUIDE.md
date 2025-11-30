# MinIO Setup Guide - WataOmi

Hướng dẫn cài đặt và sử dụng MinIO để lưu trữ hình ảnh và tài liệu trong WataOmi.

## 📋 Tổng quan

MinIO là một object storage service tương thích với S3, được sử dụng để lưu trữ:
- 🖼️ Hình ảnh (images)
- 📄 Tài liệu (documents)
- 👤 Avatar người dùng (avatars)

## 🚀 Cài đặt

### 1. Khởi động MinIO

```bash
cd services/minio
docker-compose up -d
```

Hoặc sử dụng script:

```bash
cd services/minio
./start.sh  # Linux/Mac
```

### 2. Kiểm tra MinIO đã chạy

Truy cập MinIO Console: http://localhost:9001

- **Username**: minioadmin
- **Password**: minioadmin123

### 3. Cấu hình Backend

File `.env` trong `apps/backend` đã được cấu hình:

```env
FILE_DRIVER=s3-presigned
ACCESS_KEY_ID=minioadmin
SECRET_ACCESS_KEY=minioadmin123
AWS_S3_REGION=us-east-1
AWS_DEFAULT_S3_BUCKET=images
MINIO_ENDPOINT=http://localhost:9000
```

### 4. Cấu hình Frontend

File `.env.local` trong `apps/web`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MINIO_ENDPOINT=http://localhost:9000
```

## 📦 Buckets mặc định

MinIO tự động tạo 3 buckets:

1. **images** - Lưu trữ hình ảnh
   - Định dạng: JPG, PNG, GIF, WebP, SVG
   - Kích thước tối đa: 5MB

2. **documents** - Lưu trữ tài liệu
   - Định dạng: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX
   - Kích thước tối đa: 10MB

3. **avatars** - Lưu trữ avatar
   - Định dạng: JPG, PNG, GIF
   - Kích thước tối đa: 2MB

## 💻 Sử dụng trong Code

### Backend - Upload API

```typescript
// POST /api/v1/files/upload
{
  "fileName": "image.jpg",
  "fileSize": 138723,
  "bucket": "images"  // optional: images, documents, avatars
}

// Response
{
  "file": {
    "id": "uuid",
    "path": "random-string.jpg"
  },
  "uploadSignedUrl": "http://localhost:9000/images/..."
}
```

### Frontend - Upload Component

```tsx
import { FileUpload, FileDropzone } from '@/components/ui/file-upload';

// Button upload
<FileUpload
  bucket="images"
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  onUploadComplete={(url, data) => {
    console.log('File uploaded:', url);
  }}
  onUploadError={(error) => {
    console.error('Upload failed:', error);
  }}
/>

// Drag & drop upload
<FileDropzone
  bucket="documents"
  accept=".pdf,.doc,.docx"
  maxSize={10 * 1024 * 1024}
  onUploadComplete={(url, data) => {
    console.log('File uploaded:', url);
  }}
/>
```

### Frontend - Upload Service

```typescript
import { fileUploadService } from '@/lib/services/file-upload-service';

// Upload file
const result = await fileUploadService.uploadFile(file, {
  bucket: 'images',
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
});

// Get file URL
const fileUrl = fileUploadService.getFileUrl(result.file.path, 'images');
// => http://localhost:9000/images/random-string.jpg

// Upload multiple files
const results = await fileUploadService.uploadMultipleFiles([file1, file2], {
  bucket: 'documents'
});

// Validate file
const validation = fileUploadService.validateFile(file, {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png']
});
```

## 🔧 Quản lý MinIO

### Xem logs

```bash
cd services/minio
docker-compose logs -f minio
```

### Dừng MinIO

```bash
cd services/minio
docker-compose down
```

### Xóa dữ liệu và khởi động lại

```bash
cd services/minio
docker-compose down -v  # Xóa volumes
docker-compose up -d
```

### Tạo bucket mới

Truy cập MinIO Console (http://localhost:9001) hoặc dùng MinIO Client:

```bash
docker exec -it wataomi-minio mc alias set myminio http://localhost:9000 minioadmin minioadmin123
docker exec -it wataomi-minio mc mb myminio/new-bucket
docker exec -it wataomi-minio mc anonymous set download myminio/new-bucket
```

## 🌐 Truy cập File

Sau khi upload, file có thể truy cập qua URL:

```
http://localhost:9000/{bucket}/{file-path}
```

Ví dụ:
- `http://localhost:9000/images/abc123.jpg`
- `http://localhost:9000/documents/report.pdf`
- `http://localhost:9000/avatars/user-avatar.png`

## 🔒 Bảo mật

### Development
- Sử dụng credentials mặc định (minioadmin/minioadmin123)
- Buckets có public read access

### Production
1. Thay đổi MINIO_ROOT_USER và MINIO_ROOT_PASSWORD
2. Cấu hình SSL/TLS
3. Sử dụng IAM policies cho buckets
4. Giới hạn CORS nếu cần
5. Cấu hình presigned URL với thời gian hết hạn ngắn

## 🐛 Troubleshooting

### MinIO không khởi động được

```bash
# Kiểm tra port đã được sử dụng chưa
netstat -an | grep 9000
netstat -an | grep 9001

# Xem logs
docker-compose logs minio
```

### Upload lỗi 403 Forbidden

- Kiểm tra bucket đã được tạo chưa
- Kiểm tra bucket policy (phải có public read access)
- Kiểm tra credentials trong .env

### File không hiển thị

- Kiểm tra MINIO_ENDPOINT trong .env.local
- Kiểm tra CORS settings nếu cần
- Mở browser console để xem lỗi

## 📚 Tài liệu tham khảo

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [MinIO Client Guide](https://min.io/docs/minio/linux/reference/minio-mc.html)

## 🎯 Demo Page

Truy cập trang demo upload: http://localhost:3000/files

Trang này cho phép:
- Upload hình ảnh
- Upload tài liệu
- Upload avatar
- Xem danh sách file đã upload
