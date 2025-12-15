import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentRepository } from '../../../domain/repository/document.repository';
import { Document } from '../../../domain/document.entity';
import { KbDocumentEntity } from './entities/knowledge-base.entity';

/**
 * Relational implementation of DocumentRepository
 */
@Injectable()
export class RelationalDocumentRepository extends DocumentRepository {
  constructor(
    @InjectRepository(KbDocumentEntity)
    private readonly documentEntityRepository: Repository<KbDocumentEntity>,
  ) {
    super();
  }

  async create(data: {
    name: string;
    content: string;
    knowledgeBaseId: string;
    folderId?: string;
    fileType?: string;
    fileUrl?: string;
    mimeType?: string;
    metadata?: Record<string, any>;
    tags?: string[];
    createdBy: string;
  }): Promise<Document> {
    const entityData = {
      title: data.name, // Entity uses 'title' field
      content: data.content,
      knowledgeBaseId: data.knowledgeBaseId,
      folderId: data.folderId,
      fileType: data.fileType,
      fileUrl: data.fileUrl,
      mimeType: data.mimeType,
      metadata: data.metadata,
      tags: data.tags,
      createdBy: data.createdBy,
      type: 'file' as const,
      status: 'completed' as const,
    };

    const savedEntity = await this.documentEntityRepository.save(entityData);

    // Convert entity to domain object
    return new Document({
      id: savedEntity.id,
      name: savedEntity.title || (savedEntity as any).name || '',
      content: savedEntity.content || '',
      knowledgeBaseId: savedEntity.knowledgeBaseId,
      folderId: savedEntity.folderId || undefined,
      fileType: savedEntity.fileType || undefined,
      fileUrl:
        savedEntity.fileUrl || (savedEntity as any).sourceUrl || undefined,
      mimeType: savedEntity.mimeType || undefined,
      metadata: savedEntity.metadata || undefined,
      tags: savedEntity.tags || undefined,
      createdBy: savedEntity.createdBy,
      isActive: !savedEntity.deletedAt, // Documents are "active" if not soft-deleted
      createdAt: savedEntity.createdAt,
      updatedAt: savedEntity.updatedAt,
    });
  }

  async findById(id: string): Promise<Document | null> {
    const entity = await this.documentEntityRepository.findOne({
      where: { id },
    });

    if (!entity) return null;

    return new Document({
      id: entity.id,
      name: entity.name || entity.title || '',
      content: entity.content || '',
      knowledgeBaseId: entity.knowledgeBaseId,
      folderId: entity.folderId || undefined,
      fileType: entity.fileType || undefined,
      fileUrl: entity.fileUrl || entity.sourceUrl || undefined,
      mimeType: entity.mimeType || undefined,
      metadata: entity.metadata || undefined,
      tags: entity.tags || undefined,
      createdBy: entity.createdBy,
      isActive: !entity.deletedAt, // Use deletedAt to determine active status
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  async findByKnowledgeBase(
    knowledgeBaseId: string,
    options?: {
      folderId?: string;
      pagination?: any; // We'll ignore pagination for now
    },
  ): Promise<Document[]> {
    // Build where conditions
    const where: any = { knowledgeBaseId };

    if (options?.folderId !== undefined) {
      where.folderId = options.folderId;
    }

    const entities = await this.documentEntityRepository.find({
      where,
    });

    return entities.map(
      (entity) =>
        new Document({
          id: entity.id,
          name: entity.name || entity.title || '',
          content: entity.content || '',
          knowledgeBaseId: entity.knowledgeBaseId,
          folderId: entity.folderId || undefined,
          fileType: entity.fileType || undefined,
          fileUrl: entity.fileUrl || entity.sourceUrl || undefined,
          mimeType: entity.mimeType || undefined,
          metadata: entity.metadata || undefined,
          tags: entity.tags || undefined,
          createdBy: entity.createdBy,
          isActive: !entity.deletedAt, // Use deletedAt to determine active status
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        }),
    );
  }

  async findByIdAndUser(id: string, userId: string): Promise<Document | null> {
    const entity = await this.documentEntityRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!entity) return null;

    return new Document({
      id: entity.id,
      name: entity.name || entity.title || '',
      content: entity.content || '',
      knowledgeBaseId: entity.knowledgeBaseId,
      folderId: entity.folderId || undefined,
      fileType: entity.fileType || undefined,
      fileUrl: entity.fileUrl || entity.sourceUrl || undefined,
      mimeType: entity.mimeType || undefined,
      metadata: entity.metadata || undefined,
      tags: entity.tags || undefined,
      createdBy: entity.createdBy,
      isActive: !entity.deletedAt, // Use deletedAt to determine active status
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  async update(
    id: string,
    payload: Partial<Document>,
  ): Promise<Document | null> {
    await this.documentEntityRepository.update(id, payload);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.documentEntityRepository.delete(id);
  }

  async moveToFolder(
    id: string,
    folderId: string | null,
  ): Promise<Document | null> {
    await this.documentEntityRepository.update(id, {
      folderId,
      updatedAt: new Date(),
    });
    return this.findById(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.documentEntityRepository.count({
      where: { id },
    });
    return count > 0;
  }

  async countByKnowledgeBase(knowledgeBaseId: string): Promise<number> {
    return this.documentEntityRepository.count({
      where: { knowledgeBaseId },
    });
  }
}
