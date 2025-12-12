import { Injectable, Inject } from '@nestjs/common';
import { Document } from '../domain/document.entity';
import { DocumentRepository } from '../domain/repository/document.repository';

/**
 * Application service for document operations
 * Handles business logic orchestration and domain object interactions
 */
@Injectable()
export class DocumentApplicationService {
  constructor(
    @Inject('DocumentRepository')
    private readonly documentRepository: DocumentRepository,
  ) {}

  /**
   * Create a new document
   */
  async createDocument(
    knowledgeBaseId: string,
    userId: string,
    data: {
      name: string;
      content: string;
      folderId?: string;
      fileType?: string;
      fileUrl?: string;
      mimeType?: string;
      metadata?: Record<string, any>;
      tags?: string[];
    },
  ): Promise<Document> {
    // Domain validation
    if (!Document.validateContent(data.content)) {
      throw new Error('Document content cannot be empty');
    }

    const document = await this.documentRepository.create({
      ...data,
      knowledgeBaseId,
      createdBy: userId,
    });

    return document;
  }

  /**
   * Update document content
   */
  async updateDocument(
    documentId: string,
    userId: string,
    content: string,
  ): Promise<Document | null> {
    // Find and validate ownership
    const document = await this.documentRepository.findByIdAndUser(documentId, userId);
    if (!document) {
      throw new Error('Document not found or access denied');
    }

    if (!document.canBeModifiedBy(userId)) {
      throw new Error('Unauthorized to modify document');
    }

    // Domain validation
    if (!Document.validateContent(content)) {
      throw new Error('Document content cannot be empty');
    }

    // Update through repository (domain logic handles timestamp updates)
    return this.documentRepository.update(documentId, { content });
  }

  /**
   * Move document to different folder
   */
  async moveDocument(
    documentId: string,
    userId: string,
    folderId: string | null,
  ): Promise<Document | null> {
    // Find and validate ownership
    const document = await this.documentRepository.findByIdAndUser(documentId, userId);
    if (!document) {
      throw new Error('Document not found or access denied');
    }

    if (!document.canBeModifiedBy(userId)) {
      throw new Error('Unauthorized to modify document');
    }

    return this.documentRepository.moveToFolder(documentId, folderId);
  }

  /**
   * Get documents in knowledge base
   */
  async getDocuments(
    knowledgeBaseId: string,
    userId: string,
    folderId?: string,
  ): Promise<Document[]> {
    const documents = await this.documentRepository.findByKnowledgeBase(knowledgeBaseId, {
      folderId,
    });

    // Filter only active documents at application level
    return documents.filter(doc => doc.isActive);
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string, userId: string): Promise<Document | null> {
    return this.documentRepository.findByIdAndUser(documentId, userId);
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    // Find and validate ownership
    const document = await this.documentRepository.findByIdAndUser(documentId, userId);
    if (!document) {
      throw new Error('Document not found or access denied');
    }

    if (!document.canBeModifiedBy(userId)) {
      throw new Error('Unauthorized to delete document');
    }

    await this.documentRepository.remove(documentId);
  }
}
