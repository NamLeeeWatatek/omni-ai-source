import { Injectable, Inject } from '@nestjs/common';
import { KnowledgeBase } from '../domain/knowledge-base.entity';
import { KnowledgeBaseRepository } from '../domain/repository/knowledge-base.repository';

/**
 * Application service for knowledge base operations
 * Handles business logic orchestration and domain object interactions
 */
@Injectable()
export class KnowledgeBaseApplicationService {
  constructor(
    @Inject('KnowledgeBaseRepository')
    private readonly knowledgeBaseRepository: KnowledgeBaseRepository,
  ) {}

  /**
   * Create a new knowledge base
   */
  async createKnowledgeBase(
    data: {
      name: string;
      description?: string;
      aiProviderId?: string;
    },
    userId: string,
    workspaceId?: string,
  ): Promise<KnowledgeBase> {
    // Domain validation
    if (!KnowledgeBase.validateName(data.name)) {
      throw new Error('Invalid knowledge base name');
    }

    const knowledgeBase = await this.knowledgeBaseRepository.create({
      ...data,
      createdBy: userId,
      workspaceId,
      isActive: true,
    });

    return knowledgeBase;
  }

  /**
   * Get knowledge base by ID
   */
  async getKnowledgeBase(id: string): Promise<KnowledgeBase | null> {
    return this.knowledgeBaseRepository.findById(id);
  }

  /**
   * Get user's knowledge bases
   */
  async getUserKnowledgeBases(userId: string, workspaceId?: string): Promise<KnowledgeBase[]> {
    return this.knowledgeBaseRepository.findByUser(userId, { workspaceId });
  }

  /**
   * Update knowledge base
   */
  async updateKnowledgeBase(
    id: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      aiProviderId?: string;
    },
    isWorkspaceAdmin: boolean = false,
  ): Promise<KnowledgeBase | null> {
    // Get existing KB to validate permissions
    const existingKb = await this.knowledgeBaseRepository.findById(id);
    if (!existingKb) {
      throw new Error('Knowledge base not found');
    }

    if (!existingKb.canBeModifiedBy(userId, isWorkspaceAdmin)) {
      throw new Error('Unauthorized to modify knowledge base');
    }

    // Validate new name if provided
    if (data.name && !KnowledgeBase.validateName(data.name)) {
      throw new Error('Invalid knowledge base name');
    }

    return this.knowledgeBaseRepository.update(id, data);
  }

  /**
   * Activate/Deactivate knowledge base
   */
  async toggleKnowledgeBaseActive(
    id: string,
    userId: string,
    isWorkspaceAdmin: boolean = false,
  ): Promise<KnowledgeBase | null> {
    const existingKb = await this.knowledgeBaseRepository.findById(id);
    if (!existingKb) {
      throw new Error('Knowledge base not found');
    }

    if (!existingKb.canBeModifiedBy(userId, isWorkspaceAdmin)) {
      throw new Error('Unauthorized to modify knowledge base');
    }

    const updateData = existingKb.isActive
      ? { isActive: false } // deactivate
      : { isActive: true }; // activate

    return this.knowledgeBaseRepository.update(id, updateData);
  }

  /**
   * Delete knowledge base
   */
  async deleteKnowledgeBase(id: string, userId: string, isWorkspaceAdmin: boolean = false): Promise<void> {
    const existingKb = await this.knowledgeBaseRepository.findById(id);
    if (!existingKb) {
      throw new Error('Knowledge base not found');
    }

    if (!existingKb.canBeModifiedBy(userId, isWorkspaceAdmin)) {
      throw new Error('Unauthorized to delete knowledge base');
    }

    await this.knowledgeBaseRepository.remove(id);
  }
}
