import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// Form Schema DTOs
export class FormFieldOptionDto {
  @ApiProperty()
  @Expose()
  value: string;

  @ApiProperty()
  @Expose()
  label: string;
}

export class FormFieldDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({
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
    ],
  })
  @Expose()
  type: string;

  @ApiProperty()
  @Expose()
  label: string;

  @ApiPropertyOptional()
  @Expose()
  placeholder?: string;

  @ApiPropertyOptional()
  @Expose()
  helperText?: string;

  @ApiProperty()
  @Expose()
  required: boolean;

  @ApiPropertyOptional()
  @Expose()
  defaultValue?: any;

  @ApiPropertyOptional({ type: [FormFieldOptionDto] })
  @Expose()
  @Type(() => FormFieldOptionDto)
  options?: FormFieldOptionDto[];

  @ApiPropertyOptional()
  @Expose()
  min?: number;

  @ApiPropertyOptional()
  @Expose()
  max?: number;

  @ApiPropertyOptional()
  @Expose()
  rows?: number;
}

export class FormStepDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  label: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @ApiProperty({ type: [FormFieldDto] })
  @Expose()
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];
}

export class FormSchemaDto {
  @ApiProperty({ type: [FormStepDto] })
  @Expose()
  @Type(() => FormStepDto)
  steps: FormStepDto[];
}

// Flow Response DTO
export class FlowResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @ApiProperty({ enum: ['draft', 'published', 'archived'] })
  @Expose()
  status: string;

  @ApiPropertyOptional({ type: FormSchemaDto })
  @Expose()
  @Type(() => FormSchemaDto)
  formSchema?: FormSchemaDto;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  // Only include data for detailed view, not in list
  @ApiPropertyOptional()
  @Expose()
  data?: {
    nodes: any[];
    edges: any[];
  };
}

// Minimal DTO for UGC Factory listing
export class UGCTemplateDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty({ type: FormSchemaDto })
  @Expose()
  @Type(() => FormSchemaDto)
  formSchema: FormSchemaDto;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
