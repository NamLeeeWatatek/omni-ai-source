import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NodeProperty {
  @ApiProperty()
  name: string;

  @ApiProperty()
  label: string;

  @ApiProperty({
    enum: [
      'text',
      'url',
      'textarea',
      'json',
      'select',
      'boolean',
      'number',
      'file',
      'image',
      'key-value',
      'multi-select',
      'dynamic-form',
    ],
  })
  type: string;

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
  accept?: string;

  @ApiPropertyOptional()
  multiple?: boolean;

  @ApiPropertyOptional({ type: () => [NodeProperty] })
  properties?: NodeProperty[];
}

export class NodeType {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  icon: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  isPremium?: boolean;

  @ApiPropertyOptional({ type: [NodeProperty] })
  properties?: NodeProperty[];
}

export class NodeCategory {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  color: string;
}
