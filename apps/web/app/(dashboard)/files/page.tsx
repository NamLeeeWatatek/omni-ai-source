'use client';

import { useState } from 'react';
import { FileUpload, FileDropzone } from '@/components/ui/file-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function FilesPage() {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([]);

  const handleUploadComplete = (fileUrl: string, fileData: any) => {
    toast.success('File uploaded successfully!');
    setUploadedFiles((prev) => [...prev, { url: fileUrl, name: fileData.path }]);
  };

  const handleUploadError = (error: Error) => {
    toast.error(`Upload failed: ${error.message}`);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">File Management</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage your images and documents
        </p>
      </div>

      <Tabs defaultValue="images" className="w-full">
        <TabsList>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="avatars">Avatars</TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Images</CardTitle>
              <CardDescription>
                Upload images to MinIO storage (JPG, PNG, GIF, WebP, SVG)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileDropzone
                bucket="images"
                accept="image/*"
                maxSize={5 * 1024 * 1024}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Or use button upload:</h3>
                <FileUpload
                  bucket="images"
                  accept="image/*"
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload documents to MinIO storage (PDF, DOC, DOCX, TXT, CSV, XLS, XLSX)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileDropzone
                bucket="documents"
                accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                maxSize={10 * 1024 * 1024}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avatars" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Avatar</CardTitle>
              <CardDescription>
                Upload user avatar images (JPG, PNG, GIF)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                bucket="avatars"
                accept="image/jpeg,image/png,image/gif"
                maxSize={2 * 1024 * 1024}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>Recently uploaded files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="border rounded-lg p-2">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded"
                  />
                  <p className="text-xs text-muted-foreground mt-2 truncate">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
