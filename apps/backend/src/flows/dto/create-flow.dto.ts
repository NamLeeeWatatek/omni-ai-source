import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateFlowDto {
  @ApiProperty({ example: 'Welcome Flow' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Greets new users' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'draft' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  version?: number;

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  nodes?: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, any>;
  }>;

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  edges?: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({
    example: {},
    description: 'Legacy field - use nodes/edges instead',
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsString()
  channelId?: string;

  @ApiPropertyOptional({ example: 'private' })
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({
    example: {
      steps: [
        {
          id: 'step-1',
          label: 'Step 1',
          fields: [],
        },
      ],
    },
  })
  @IsOptional()
  formSchema?: any;

  @ApiPropertyOptional({ example: 'ugc-factory' })
  @IsOptional()
  @IsString()
  category?: string;
}
