import { Injectable } from '@nestjs/common';

import { FileRepository } from './infrastructure/persistence/file.repository';
import { FileType } from './domain/file';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class FilesService {
  private uploadService: any;

  constructor(private readonly fileRepository: FileRepository) {}

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
    return this.uploadService.create(...args);
  }

  async generateDownloadUrl(...args: any[]): Promise<string> {
    if (!this.uploadService) {
      throw new Error('Upload service not initialized');
    }
    return this.uploadService.generateDownloadUrl(...args);
  }
}
