import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Template {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String, example: 'Image Generation Template' })
  name: string;

  @ApiPropertyOptional({ type: String, description: 'Template description' })
  description?: string | null;

  @ApiPropertyOptional({ type: String, description: 'Prompt text for AI generation' })
  prompt?: string | null;

  @ApiPropertyOptional({ type: [String], description: 'Array of file IDs for multimedia content (images, videos)' })
  mediaFiles?: string[] | null;

  @ApiPropertyOptional({ type: Object, description: 'Style/shape configuration data' })
  styleConfig?: Record<string, any> | null;

  @ApiPropertyOptional({ type: String, description: 'Template category' })
  category?: string | null;

  @ApiPropertyOptional({ type: Boolean, default: true })
  isActive: boolean;

  @ApiPropertyOptional({ type: String, description: 'User ID who created the template' })
  createdBy?: string | null;

  @ApiPropertyOptional({ type: String, description: 'Workspace ID' })
  workspaceId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;
}
