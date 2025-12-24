import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Form field configuration interface for dynamic forms
 */
export interface FormField {
  name: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'number'
    | 'file'
    | 'slider'
    | 'color';
  label: string;
  placeholder?: string;
  description?: string;
  defaultValue?: any;

  // For select/radio/checkbox options
  options?: Array<{
    label: string;
    value: any;
    icon?: string;
  }>;

  // Validation rules
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customMessage?: string;
  };

  // Conditional rendering
  showIf?: {
    field: string;
    operator: 'equals' | 'not-equals' | 'contains';
    value: any;
  };
}

/**
 * Form configuration interface
 */
export interface FormConfig {
  fields: FormField[];
  layout?: 'single-column' | 'two-column' | 'wizard';
  submitLabel?: string;
}

/**
 * Execution flow configuration interface
 */
export interface ExecutionFlow {
  type: 'ai-generation' | 'bot-execution' | 'workflow';
  provider?: string; // e.g., 'openai', 'replicate', 'elevenlabs'
  model?: string;
  endpoint?: string;
  parameters?: Record<string, any>;
  outputType?: 'image' | 'video' | 'audio' | 'text' | 'json';
}

/**
 * CreationTool domain entity
 * Main entity that defines a creation tool with dynamic forms and execution logic
 */
export class CreationTool {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String, example: 'Create Image' })
  name: string;

  @ApiProperty({ type: String, example: 'create-image' })
  slug: string;

  @ApiPropertyOptional({ type: String })
  description?: string;

  @ApiPropertyOptional({ type: String })
  icon?: string;

  @ApiPropertyOptional({ type: String })
  coverImage?: string;

  @ApiPropertyOptional({ type: String })
  category?: string;

  @ApiProperty({ type: Object, description: 'Dynamic form configuration' })
  formConfig: FormConfig;

  @ApiProperty({
    type: Object,
    description: 'Execution workflow configuration',
  })
  executionFlow: ExecutionFlow;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiPropertyOptional({ type: String })
  workspaceId?: string;

  @ApiProperty({ type: Number, default: 0 })
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;
}
