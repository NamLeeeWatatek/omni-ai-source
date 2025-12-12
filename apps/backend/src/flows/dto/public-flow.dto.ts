import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type, Transform } from 'class-transformer';

/**
 * DTO for Form Field Options
 * Used in select, radio, checkbox fields
 */
export class FormFieldOptionDto {
  @ApiProperty({ description: 'Option value' })
  @Expose()
  value: string;

  @ApiProperty({ description: 'Option display label' })
  @Expose()
  label: string;
}

/**
 * DTO for Form Field
 * Represents a single input field in the form
 */
export class FormFieldDto {
  @ApiProperty({ description: 'Unique field identifier' })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Field type',
    enum: [
      'text',
      'textarea',
      'number',
      'select',
      'checkbox',
      'radio',
      'file',
      'date',
      'email',
      'url',
      'slider',
      'color',
    ],
  })
  @Expose()
  type: string;

  @ApiProperty({ description: 'Field label' })
  @Expose()
  label: string;

  @ApiPropertyOptional({ description: 'Placeholder text' })
  @Expose()
  placeholder?: string;

  @ApiPropertyOptional({ description: 'Helper text below field' })
  @Expose()
  helperText?: string;

  @ApiProperty({ description: 'Whether field is required' })
  @Expose()
  required: boolean;

  @ApiPropertyOptional({ description: 'Default value' })
  @Expose()
  defaultValue?: any;

  @ApiPropertyOptional({
    type: [FormFieldOptionDto],
    description: 'Options for select/radio/checkbox',
  })
  @Expose()
  @Type(() => FormFieldOptionDto)
  options?: FormFieldOptionDto[];

  @ApiPropertyOptional({ description: 'Minimum value (for number/slider)' })
  @Expose()
  min?: number;

  @ApiPropertyOptional({ description: 'Maximum value (for number/slider)' })
  @Expose()
  max?: number;

  @ApiPropertyOptional({ description: 'Step value (for number/slider)' })
  @Expose()
  step?: number;

  @ApiPropertyOptional({ description: 'Number of rows (for textarea)' })
  @Expose()
  rows?: number;

  @ApiPropertyOptional({ description: 'Validation pattern (regex)' })
  @Expose()
  pattern?: string;

  @ApiPropertyOptional({ description: 'Validation error message' })
  @Expose()
  validationMessage?: string;
}

/**
 * DTO for Form Step
 * Represents a step in multi-step form
 */
export class FormStepDto {
  @ApiProperty({ description: 'Step identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Step label/title' })
  @Expose()
  label: string;

  @ApiPropertyOptional({ description: 'Step description' })
  @Expose()
  description?: string;

  @ApiProperty({ type: [FormFieldDto], description: 'Fields in this step' })
  @Expose()
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];
}

// FormSchemaDto removed - use NodeType.properties instead

/**
 * Public Flow DTO - For listing flows (minimal data)
 * Excludes: data, isPremium, userId, channelId, ownerId, teamId, visibility, templateId, version
 */
export class PublicFlowDto {
  @ApiProperty({ description: 'Flow ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Flow name' })
  @Expose()
  name: string;

  @ApiPropertyOptional({ description: 'Flow description' })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Flow status',
    enum: ['draft', 'published', 'archived'],
  })
  @Expose()
  status: string;

  // formSchema removed - use NodeType.properties instead

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  @Transform(({ value }) => value?.toISOString?.() || value)
  createdAt: Date | string;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  @Transform(({ value }) => value?.toISOString?.() || value)
  updatedAt: Date | string;

  @ApiPropertyOptional({ description: 'Category/tags' })
  @Expose()
  category?: string;

  @ApiPropertyOptional({ description: 'Icon or emoji' })
  @Expose()
  icon?: string;
}

/**
 * Detailed Flow DTO - For single flow view (includes nodes and edges)
 * Still excludes: isPremium, userId, channelId, ownerId, teamId, visibility
 */
export class DetailedFlowDto extends PublicFlowDto {
  @ApiPropertyOptional({
    description: 'Flow nodes array',
    type: 'array',
    example: [],
  })
  @Expose()
  nodes?: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, any>;
  }>;

  @ApiPropertyOptional({
    description: 'Flow edges array',
    type: 'array',
    example: [],
  })
  @Expose()
  edges?: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;

  @ApiPropertyOptional({ description: 'Flow version number' })
  @Expose()
  version?: number;

  @ApiPropertyOptional({ description: 'Template ID if created from template' })
  @Expose()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Tags array' })
  @Expose()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Legacy data field for backward compatibility',
    deprecated: true,
    example: {
      nodes: [],
      edges: [],
    },
  })
  @Expose()
  @Transform(({ obj }) => {
    // For backward compatibility, create data field from nodes/edges
    if (obj.nodes || obj.edges) {
      return {
        nodes: Array.isArray(obj.nodes) ? obj.nodes : [],
        edges: Array.isArray(obj.edges) ? obj.edges : [],
      };
    }
    return undefined;
  })
  data?: {
    nodes: any[];
    edges: any[];
  };
}

/**
 * UGC Template DTO - For UGC Factory marketplace
 * Minimal data for template listing
 */
export class UGCTemplateDto {
  @ApiProperty({ description: 'Template ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Template name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Template description' })
  @Expose()
  description: string;

  // formSchema removed - use NodeType.properties instead

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  @Transform(({ value }) => value?.toISOString?.() || value)
  createdAt: Date | string;

  @ApiPropertyOptional({ description: 'Category' })
  @Expose()
  category?: string;

  @ApiPropertyOptional({ description: 'Icon' })
  @Expose()
  icon?: string;

  @ApiPropertyOptional({ description: 'Preview image URL' })
  @Expose()
  previewImage?: string;

  @ApiPropertyOptional({ description: 'Usage count' })
  @Expose()
  usageCount?: number;
}
