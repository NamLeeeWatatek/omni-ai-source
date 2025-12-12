import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { KnowledgeBase } from '../knowledge-base.entity';

/**
 * Repository interface for Knowledge Base domain operations
 */
export abstract class KnowledgeBaseRepository {
  /**
   * Create a new knowledge base
   */
  abstract create(
    data: {
      name: string;
      description?: string;
      aiProviderId?: string;
      createdBy: string;
      workspaceId?: string;
      isActive?: boolean;
    },
  ): Promise<KnowledgeBase>;

  /**
   * Find knowledge base by ID
   */
  abstract findById(id: KnowledgeBase['id']): Promise<NullableType<KnowledgeBase>>;

  /**
   * Find knowledge bases by user
   */
  abstract findByUser(
    userId: string,
    options?: {
      workspaceId?: string;
      pagination?: IPaginationOptions;
    },
  ): Promise<KnowledgeBase[]>;

  /**
   * Find knowledge bases by workspace
   */
  abstract findByWorkspace(
    workspaceId: string,
    options?: { pagination?: IPaginationOptions },
  ): Promise<KnowledgeBase[]>;

  /**
   * Update knowledge base
   */
  abstract update(
    id: KnowledgeBase['id'],
    payload: DeepPartial<KnowledgeBase>,
  ): Promise<KnowledgeBase | null>;

  /**
   * Delete knowledge base
   */
  abstract remove(id: KnowledgeBase['id']): Promise<void>;

  /**
   * Check if knowledge base exists
   */
  abstract exists(id: KnowledgeBase['id']): Promise<boolean>;
}
