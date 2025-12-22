import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Flow } from '../domain/flow';

export class FilterFlowDto {
  @ApiPropertyOptional({
    type: String,
    enum: ['draft', 'published', 'archived'],
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter by published status',
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by category',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Search by name or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by workspace ID',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by owner ID',
  })
  @IsOptional()
  @IsString()
  ownerId?: string;
}

export class SortFlowDto {
  @ApiProperty({ description: 'Field to sort by' })
  @Type(() => String)
  @IsString()
  orderBy: keyof Flow;

  @ApiProperty({ enum: ['ASC', 'DESC'], description: 'Sort order' })
  @IsString()
  order: 'ASC' | 'DESC';
}

export class QueryFlowDto {
  @ApiPropertyOptional({ default: 1 })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: 50 })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON string of FilterFlowDto',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(FilterFlowDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested()
  @Type(() => FilterFlowDto)
  filters?: FilterFlowDto | null;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON string of SortFlowDto[]',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(SortFlowDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortFlowDto)
  sort?: SortFlowDto[] | null;
}
