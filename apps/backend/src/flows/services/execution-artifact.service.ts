import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExecutionArtifactEntity } from '../infrastructure/persistence/relational/entities/execution-artifact.entity';
import { FilesService } from '../../files/files.service';

export interface CreateArtifactDto {
  executionId: string;
  fileId: string;
  artifactType: 'image' | 'video' | 'audio' | 'document' | 'text' | 'other';
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  size?: number;
  mimeType?: string;
}

@Injectable()
export class ExecutionArtifactService {
  constructor(
    @InjectRepository(ExecutionArtifactEntity)
    private readonly artifactRepository: Repository<ExecutionArtifactEntity>,
    private readonly filesService: FilesService,
  ) {}

  async createArtifact(dto: CreateArtifactDto): Promise<ExecutionArtifactEntity> {
    const artifact = this.artifactRepository.create({
      executionId: dto.executionId,
      fileId: dto.fileId,
      artifactType: dto.artifactType,
      name: dto.name,
      description: dto.description,
      metadata: dto.metadata,
      size: dto.size,
      mimeType: dto.mimeType,
    });

    return this.artifactRepository.save(artifact);
  }

  async findByExecutionId(executionId: string): Promise<ExecutionArtifactEntity[]> {
    return this.artifactRepository.find({
      where: { executionId },
      order: { createdAt: 'ASC' },
    });
  }

  async findByExecutionIds(executionIds: string[]): Promise<ExecutionArtifactEntity[]> {
    return this.artifactRepository.find({
      where: executionIds.map(id => ({ executionId: id })),
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ExecutionArtifactEntity | null> {
    return this.artifactRepository.findOne({
      where: { id },
    });
  }

  async deleteArtifact(id: string): Promise<void> {
    const artifact = await this.findOne(id);
    if (artifact) {
      // Delete file from storage
      await this.filesService.delete(artifact.fileId);
      // Delete artifact record
      await this.artifactRepository.delete(id);
    }
  }

  async getArtifactDownloadUrl(artifactId: string): Promise<string | null> {
    const artifact = await this.findOne(artifactId);
    if (artifact) {
      return this.filesService.generateDownloadUrl(artifact.fileId);
    }
    return null;
  }

  async getArtifactsWithUrls(executionId: string): Promise<any[]> {
    const artifacts = await this.findByExecutionId(executionId);
    const artifactsWithUrls = await Promise.all(
      artifacts.map(async (artifact) => {
        const url = await this.filesService.generateDownloadUrl(artifact.fileId);
        return {
          ...artifact,
          downloadUrl: url,
        };
      })
    );
    return artifactsWithUrls;
  }
}
