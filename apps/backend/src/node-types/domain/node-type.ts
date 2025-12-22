import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NodeCategoryId,
  NodeProperty as NodePropertyModel,
  NodePropertyType,
  NodeType as NodeTypeModel,
} from '../types';

export class NodeProperty implements NodePropertyModel {
  @ApiProperty()
  name: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  type: NodePropertyType;

  @ApiPropertyOptional()
  required?: boolean;

  @ApiPropertyOptional()
  placeholder?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ type: [Object] })
  options?: Array<{ value: string; label: string } | string> | string;

  @ApiPropertyOptional()
  default?: any;

  @ApiPropertyOptional({ type: Object })
  showWhen?: Record<string, any>;

  @ApiPropertyOptional()
  min?: number;

  @ApiPropertyOptional()
  max?: number;

  @ApiPropertyOptional()
  step?: number;

  @ApiPropertyOptional()
  pattern?: string;

  @ApiPropertyOptional()
  maxLength?: number;

  @ApiPropertyOptional()
  rows?: number;

  @ApiPropertyOptional()
  helpText?: string;

  @ApiPropertyOptional()
  accept?: string;

  @ApiPropertyOptional()
  multiple?: boolean;

  @ApiPropertyOptional({ type: () => [NodeProperty] })
  properties?: NodeProperty[];
}

export class NodeType implements NodeTypeModel {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty({
    enum: [
      'trigger',
      'action',
      'logic',
      'transform',
      'data',
      'ai',
      'messaging',
      'integration',
    ],
  })
  category: NodeCategoryId;

  @ApiProperty()
  color: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  isPremium?: boolean;

  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  isTrigger?: boolean;

  @ApiPropertyOptional({ type: [NodeProperty] })
  properties?: NodeProperty[];

  @ApiPropertyOptional({ type: Object })
  outputSchema?: Record<string, any>;

  @ApiPropertyOptional()
  executor?: string;

  @ApiPropertyOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiPropertyOptional()
  workspaceId?: string;

  @ApiPropertyOptional()
  createdBy?: string;

  @ApiPropertyOptional()
  updatedBy?: string;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}

export type { NodePropertyType, NodeCategoryId };
