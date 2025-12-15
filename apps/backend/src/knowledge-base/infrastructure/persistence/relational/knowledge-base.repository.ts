import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeBaseRepository } from '../../../domain/repository/knowledge-base.repository';
import { KnowledgeBase } from '../../../domain/knowledge-base.entity';
import { KnowledgeBaseEntity } from './entities/knowledge-base.entity';

/**
 * Relational implementation of KnowledgeBaseRepository
 */
@Injectable()
export class RelationalKnowledgeBaseRepository extends KnowledgeBaseRepository {
  constructor(
    @InjectRepository(KnowledgeBaseEntity)
    private readonly knowledgeBaseEntityRepository: Repository<KnowledgeBaseEntity>,
  ) {
    super();
  }

  async create(data: {
    name: string;
    description?: string;
    aiProviderId?: string;
    createdBy: string;
    workspaceId?: string;
    isActive?: boolean;
  }): Promise<KnowledgeBase> {
    const entity = await this.knowledgeBaseEntityRepository.save({
      ...data,
      isActive: data.isActive ?? true,
    });

    // Convert entity to domain object
    return new KnowledgeBase({
      id: entity.id,
      name: entity.name,
      description: entity.description || undefined,
      aiProviderId: entity.aiProviderId || undefined,
      createdBy: entity.createdBy,
      workspaceId: entity.workspaceId || undefined,
      isActive: entity.isPublic, // Map to isActive - assuming isPublic means active
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  async findById(id: string): Promise<KnowledgeBase | null> {
    const entity = await this.knowledgeBaseEntityRepository.findOne({
      where: { id },
    });

    if (!entity) return null;

    return new KnowledgeBase({
      id: entity.id,
      name: entity.name,
      description: entity.description || undefined,
      aiProviderId: entity.aiProviderId || undefined,
      createdBy: entity.createdBy,
      workspaceId: entity.workspaceId || undefined,
      isActive: entity.isPublic, // Map to isActive
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  async findByUser(
    userId: string,
    options?: {
      workspaceId?: string;
      pagination?: any;
    },
  ): Promise<KnowledgeBase[]> {
    const where: any = { createdBy: userId };

    if (options?.workspaceId !== undefined) {
      where.workspaceId = options.workspaceId;
    }

    const entities = await this.knowledgeBaseEntityRepository.find({
      where,
    });

    return entities.map(
      (entity) =>
        new KnowledgeBase({
          id: entity.id,
          name: entity.name,
          description: entity.description || undefined,
          aiProviderId: entity.aiProviderId || undefined,
          createdBy: entity.createdBy,
          workspaceId: entity.workspaceId || undefined,
          isActive: entity.isPublic, // Map to isActive
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        }),
    );
  }

  async findByWorkspace(
    workspaceId: string,
    options?: { pagination?: any },
  ): Promise<KnowledgeBase[]> {
    const entities = await this.knowledgeBaseEntityRepository.find({
      where: { workspaceId },
    });

    return entities.map(
      (entity) =>
        new KnowledgeBase({
          id: entity.id,
          name: entity.name,
          description: entity.description || undefined,
          aiProviderId: entity.aiProviderId || undefined,
          createdBy: entity.createdBy,
          workspaceId: entity.workspaceId || undefined,
          isActive: entity.isPublic, // Map to isActive
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        }),
    );
  }

  async update(
    id: string,
    payload: Partial<KnowledgeBase>,
  ): Promise<KnowledgeBase | null> {
    // Map domain properties to entity properties
    const entityPayload: any = {};

    if (payload.name !== undefined) entityPayload.name = payload.name;
    if (payload.description !== undefined)
      entityPayload.description = payload.description;
    if (payload.aiProviderId !== undefined)
      entityPayload.aiProviderId = payload.aiProviderId;
    if (payload.workspaceId !== undefined)
      entityPayload.workspaceId = payload.workspaceId;
    if (payload.isActive !== undefined)
      entityPayload.isPublic = payload.isActive; // Map back

    await this.knowledgeBaseEntityRepository.update(id, entityPayload);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.knowledgeBaseEntityRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.knowledgeBaseEntityRepository.count({
      where: { id },
    });
    return count > 0;
  }
}
