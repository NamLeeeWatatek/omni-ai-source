import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Document } from '../document.entity';

/**
 * Repository interface for Document domain operations
 */
export abstract class DocumentRepository {
  /**
   * Create a new document
   */
  abstract create(data: {
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
    isActive?: boolean;
  }): Promise<Document>;

  /**
   * Find document by ID
   */
  abstract findById(id: Document['id']): Promise<NullableType<Document>>;

  /**
   * Find documents by knowledge base
   */
  abstract findByKnowledgeBase(
    knowledgeBaseId: string,
    options?: {
      folderId?: string;
      pagination?: IPaginationOptions;
    },
  ): Promise<Document[]>;

  /**
   * Find document by user and ID
   */
  abstract findByIdAndUser(
    id: Document['id'],
    userId: string,
  ): Promise<NullableType<Document>>;

  /**
   * Update document
   */
  abstract update(
    id: Document['id'],
    payload: DeepPartial<Document>,
  ): Promise<Document | null>;

  /**
   * Delete document
   */
  abstract remove(id: Document['id']): Promise<void>;

  /**
   * Move document to folder
   */
  abstract moveToFolder(
    id: Document['id'],
    folderId: string | null,
  ): Promise<Document | null>;

  /**
   * Check if document exists
   */
  abstract exists(id: Document['id']): Promise<boolean>;

  /**
   * Count documents in knowledge base
   */
  abstract countByKnowledgeBase(knowledgeBaseId: string): Promise<number>;
}
