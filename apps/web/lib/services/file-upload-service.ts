import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UploadResponse {
  file: {
    id: string;
    path: string;
  };
  uploadSignedUrl?: string;
}

export interface FileUploadOptions {
  onProgress?: (progress: number) => void;
  bucket?: 'images' | 'documents' | 'avatars';
}

class FileUploadService {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  /**
   * Upload file to MinIO via backend
   */
  async uploadFile(
    file: File,
    options: FileUploadOptions = {}
  ): Promise<UploadResponse> {
    const { onProgress, bucket = 'images' } = options;

    // Step 1: Get presigned URL from backend
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const presignedResponse = await axios.post<UploadResponse>(
      `${API_URL}/api/v1/files/upload`,
      {
        fileName: file.name,
        fileSize: file.size,
        bucket,
      },
      { headers }
    );

    const { uploadSignedUrl, file: fileData } = presignedResponse.data;

    // Step 2: Upload directly to MinIO using presigned URL
    if (uploadSignedUrl) {
      await axios.put(uploadSignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      });
    }

    return presignedResponse.data;
  }

  /**
   * Get file URL from MinIO
   */
  getFileUrl(path: string, bucket: string = 'images'): string {
    const minioEndpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || 'http://localhost:9000';
    return `${minioEndpoint}/${bucket}/${path}`;
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    options: FileUploadOptions = {}
  ): Promise<UploadResponse[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
    } = {}
  ): { valid: boolean; error?: string } {
    const { maxSize = 5 * 1024 * 1024, allowedTypes } = options; // Default 5MB

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxSize / 1024 / 1024}MB`,
      };
    }

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    return { valid: true };
  }
}

export const fileUploadService = new FileUploadService();
