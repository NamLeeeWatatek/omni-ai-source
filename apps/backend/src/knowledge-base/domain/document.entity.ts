import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Document {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  content: string;

  @ApiPropertyOptional({ type: String })
  folderId?: string;

  @ApiProperty({ type: String })
  knowledgeBaseId: string;

  @ApiPropertyOptional({ type: String })
  fileType?: string;

  @ApiPropertyOptional({ type: String })
  fileUrl?: string;

  @ApiPropertyOptional({ type: String })
  mimeType?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiProperty({ type: String })
  createdBy: string;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<Document>) {
    Object.assign(this, partial);
    this.isActive = this.isActive ?? true;
  }

  /**
   * Business rule: Document must have valid content
   */
  static validateContent(content: string): boolean {
    return content.trim().length > 0;
  }

  /**
   * Business rule: Document can only be modified by creator
   */
  canBeModifiedBy(userId: string): boolean {
    return this.createdBy === userId;
  }

  /**
   * Get document size in characters
   */
  getContentSize(): number {
    return this.content.length;
  }

  /**
   * Check if document has file attachment
   */
  hasFileAttachment(): boolean {
    return Boolean(this.fileUrl && this.mimeType);
  }

  /**
   * Update document content
   */
  updateContent(content: string): void {
    this.content = content;
    this.updatedAt = new Date();
  }

  /**
   * Move document to different folder
   */
  moveToFolder(folderId: string | null | undefined): void {
    this.folderId = folderId || undefined;
    this.updatedAt = new Date();
  }

  /**
   * Activate document (make visible)
   */
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Deactivate document (hide/mark for deletion)
   */
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }
}
