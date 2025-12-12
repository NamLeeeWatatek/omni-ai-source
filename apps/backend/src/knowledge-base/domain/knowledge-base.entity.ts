import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KnowledgeBase {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiPropertyOptional({ type: String })
  description?: string;

  @ApiPropertyOptional({ type: String })
  aiProviderId?: string;

  @ApiProperty({ type: String })
  createdBy: string;

  @ApiPropertyOptional({ type: String })
  workspaceId?: string;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<KnowledgeBase>) {
    Object.assign(this, partial);
  }

  /**
   * Business rule: Knowledge base must have a valid name
   */
  static validateName(name: string): boolean {
    return name.trim().length > 0 && name.length <= 100;
  }

  /**
   * Business rule: Knowledge base can only be modified by creator or workspace admin
   */
  canBeModifiedBy(userId: string, isWorkspaceAdmin: boolean = false): boolean {
    return this.createdBy === userId || (isWorkspaceAdmin && Boolean(this.workspaceId));
  }

  /**
   * Activate knowledge base
   */
  activate(): void {
    this.isActive = true;
  }

  /**
   * Deactivate knowledge base
   */
  deactivate(): void {
    this.isActive = false;
  }
}
