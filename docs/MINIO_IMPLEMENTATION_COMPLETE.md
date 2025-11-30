# ✅ MinIO Implementation Complete

## 📋 Tổng quan

MinIO đã được setup hoàn chỉnh cho WataOmi để lưu trữ hình ảnh và tài liệu. Hệ thống sử dụng S3-compatible API với presigned URLs để upload trực tiếp từ client.

## 🎯 Những gì đã hoàn thành

### 1. MinIO Docker Setup ✅
- `services/minio/docker-compose.yml` - Docker compose configuration
- `services/minio/start.sh` / `start.bat` - Scripts khởi động
- `services/minio/stop.sh` / `stop.bat` - Scripts dừng
- Auto-create 3 buckets: images, documents, avatars
- Public read access cho tất cả buckets

### 2. Backend Integration ✅

#### Configuration
- `apps/backend/src/files/config/file-config.type.ts` - Thêm minioEndpoint type
- `apps/backend/src/files/config/file.config.ts` - Thêm MINIO_ENDPOINT config
- `apps/backend/.env` - Cấu hình MinIO credentials

#### S3 Service Updates
- `apps/backend/src/files/infrastructure/uploader/s3-presigned/files.service.ts`
  - Hỗ trợ MinIO endpoint
  - Force path style cho MinIO
  - Hỗ trợ multiple file types (images + documents)
  - Hỗ trợ custom bucket selection

- `apps/backend/src/files/infrastructure/uploader/s3-presigned/files.module.ts`
  - Cấu hình S3 client với MinIO endpoint
  - Force path style configuration

- `apps/backend/src/files/infrastructure/uploader/s3-presigned/dto/file.dto.ts`
  - Thêm bucket parameter

#### API Endpoint
- `POST /api/v1/files/upload` - Upload endpoint với presigned URL
  - Input: fileName, fileSize, bucket (optional)
  - Output: file data + uploadSignedUrl

### 3. Frontend Integration ✅

#### Services
- `apps/web/lib/services/file-upload-service.ts`
  - uploadFile() - Upload single file
  - uploadMultipleFiles() - Upload multiple files
  - getFileUrl() - Get file URL from MinIO
  - validateFile() - Validate file before upload

#### Hooks
- `apps/web/lib/hooks/use-file-upload.ts`
  - Custom hook for file upload
  - Progress tracking
  - Error handling
  - Success/error callbacks

#### Components
- `apps/web/components/ui/file-upload.tsx`
  - FileUpload - Button upload với preview
  - FileDropzone - Drag & drop upload
  - Progress indicator
  - Image preview

- `apps/web/components/ui/progress.tsx`
  - Progress bar component

- `apps/web/components/features/file-manager/image-gallery.tsx`
  - Image gallery với preview
  - Download functionality
  - Delete functionality

- `apps/web/components/features/file-manager/file-list.tsx`
  - File list table
  - File icons based on type
  - Download/delete actions

#### Pages
- `apps/web/app/(dashboard)/files/page.tsx`
  - Demo page cho upload
  - Tabs: Images, Documents, Avatars
  - Upload với FileDropzone và FileUpload
  - Display uploaded files

#### Configuration
- `apps/web/.env.local` - Frontend environment variables

### 4. Documentation ✅
- `docs/MINIO_SETUP_GUIDE.md` - Hướng dẫn chi tiết
- `README_MINIO.md` - Quick start guide
- `services/minio/README.md` - MinIO service documentation

## 🚀 Cách sử dụng

### Khởi động MinIO

**Windows:**
```bash
cd services/minio
start.bat
```

**Linux/Mac:**
```bash
cd services/minio
./start.sh
```

### Truy cập

- MinIO Console: http://localhost:9001
- MinIO API: http://localhost:9000
- Demo Page: http://localhost:3000/files

### Upload trong Code

**Component:**
```tsx
import { FileUpload } from '@/components/ui/file-upload';

<FileUpload
  bucket="images"
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  onUploadComplete={(url, data) => {
    console.log('Uploaded:', url);
  }}
/>
```

**Hook:**
```tsx
import { useFileUpload } from '@/lib/hooks/use-file-upload';

const { uploadFile, uploading, progress } = useFileUpload({
  bucket: 'images',
  onSuccess: (url) => console.log('Success:', url)
});

await uploadFile(file);
```

**Service:**
```tsx
import { fileUploadService } from '@/lib/services/file-upload-service';

const result = await fileUploadService.uploadFile(file, {
  bucket: 'images',
  onProgress: (p) => console.log(`${p}%`)
});

const fileUrl = fileUploadService.getFileUrl(result.file.path, 'images');
```

## 📦 Buckets

| Bucket | Mục đích | File types | Max size |
|--------|----------|------------|----------|
| images | Hình ảnh | JPG, PNG, GIF, WebP, SVG | 5MB |
| documents | Tài liệu | PDF, DOC, DOCX, TXT, CSV, XLS, XLSX | 10MB |
| avatars | Avatar | JPG, PNG, GIF | 2MB |

## 🔧 Configuration

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

## 🏗️ Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Request presigned URL
       ▼
┌─────────────┐
│   Backend   │ ◄─── Generate presigned URL
│  (NestJS)   │
└──────┬──────┘
       │ 2. Return presigned URL
       ▼
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 3. Upload directly to MinIO
       ▼
┌─────────────┐
│    MinIO    │ ◄─── Store file
│  (Storage)  │
└─────────────┘
```

## 🎨 Components

### FileUpload
Button-based upload với preview cho images.

### FileDropzone
Drag & drop area cho upload files.

### ImageGallery
Gallery component để hiển thị images với preview modal.

### FileList
Table component để hiển thị danh sách files.

## 🔒 Security

### Development
- Default credentials: minioadmin/minioadmin123
- Public read access cho buckets
- Presigned URLs expire sau 1 giờ

### Production Recommendations
1. Thay đổi MINIO_ROOT_USER và MINIO_ROOT_PASSWORD
2. Setup SSL/TLS
3. Cấu hình IAM policies
4. Giới hạn CORS
5. Giảm presigned URL expiration time
6. Setup bucket policies chi tiết hơn

## 📊 File Upload Flow

1. User chọn file trong browser
2. Frontend validate file (size, type)
3. Frontend gọi backend API `/api/v1/files/upload`
4. Backend generate presigned URL từ MinIO
5. Backend trả về presigned URL + file metadata
6. Frontend upload trực tiếp lên MinIO qua presigned URL
7. Upload complete, frontend nhận file URL
8. File có thể truy cập qua: `http://localhost:9000/{bucket}/{path}`

## 🐛 Troubleshooting

### MinIO không khởi động
```bash
# Check ports
netstat -an | findstr "9000"
docker-compose logs minio
```

### Upload fails
- Verify MinIO is running: http://localhost:9001
- Check backend is running: http://localhost:8000
- Verify .env configuration
- Check browser console for errors

### File không hiển thị
- Check MINIO_ENDPOINT in .env.local
- Verify bucket exists and has public read access
- Check CORS settings if needed

## ✨ Features

- ✅ Multiple file type support (images, documents)
- ✅ Multiple bucket support
- ✅ Presigned URL upload (secure, direct to storage)
- ✅ Progress tracking
- ✅ File validation (size, type)
- ✅ Image preview
- ✅ Drag & drop upload
- ✅ Gallery view
- ✅ List view
- ✅ Download files
- ✅ Delete files (UI ready, backend needs implementation)

## 🎯 Next Steps (Optional)

1. Implement delete file API endpoint
2. Add file listing API endpoint
3. Add pagination for file lists
4. Add search/filter functionality
5. Add file metadata (tags, descriptions)
6. Add image optimization/resizing
7. Add thumbnail generation
8. Setup CDN for production
9. Add file versioning
10. Add access control per file

## 📚 References

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [AWS SDK v3 for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)

## 🎉 Summary

MinIO đã được setup hoàn chỉnh và sẵn sàng sử dụng! Backend và frontend đã được tích hợp với đầy đủ components, services, và hooks để upload và quản lý files. Demo page có sẵn tại `/files` để test functionality.
