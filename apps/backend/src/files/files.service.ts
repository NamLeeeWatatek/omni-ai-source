import { Injectable } from '@nestjs/common';
import { FileRepository } from './infrastructure/persistence/file.repository';
import { FileType } from './domain/file';
import { NullableType } from '../utils/types/nullable.type';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FilesService {
  private uploadService: any;

  constructor(
    private readonly fileRepository: FileRepository,
    private readonly auditService: AuditService,
  ) { }

  findById(id: FileType['id']): Promise<NullableType<FileType>> {
    return this.fileRepository.findById(id);
  }

  findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    return this.fileRepository.findByIds(ids);
  }

  delete(id: FileType['id']): Promise<void> {
    return this.fileRepository.delete(id);
  }

  // Setter to inject the appropriate upload service
  setUploadService(service: any) {
    this.uploadService = service;
  }

  // Delegate methods to the actual upload service
  async create(...args: any[]): Promise<any> {
    if (!this.uploadService) {
      throw new Error('Upload service not initialized');
    }
    const result = await this.uploadService.create(...args);

    // Optional: Log upload if user context is available in args (heuristic)
    // In many projects, args[1] might be the user object or request
    const user = args[1]?.user || args[0]?.user;
    if (user && user.workspaceId) {
      await this.auditService.log({
        userId: user.id,
        workspaceId: user.workspaceId,
        action: 'FILE_UPLOADED',
        resourceType: 'file',
        resourceId: result?.id || 'n/a',
        details: { fileName: result?.name || 'unknown' },
      });
    }

    return result;
  }

  async generateDownloadUrl(...args: any[]): Promise<string> {
    if (!this.uploadService) {
      throw new Error('Upload service not initialized');
    }
    return this.uploadService.generateDownloadUrl(...args);
  }
}
