import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTemplateDto } from './create-template.dto';
import {
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  IsBoolean,
} from 'class-validator';

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {
  @ApiPropertyOptional({ example: 'Updated Template Name', type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'Updated prompt text' })
  @IsOptional()
  @IsString()
  prompt?: string | null;

  @ApiPropertyOptional({ type: [String], example: ['file-id-1', 'file-id-3'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaFiles?: string[] | null;

  @ApiPropertyOptional({ type: Object, example: { style: 'abstract', colors: ['red', 'yellow'] } })
  @IsOptional()
  @IsObject()
  styleConfig?: Record<string, any> | null;

  @ApiPropertyOptional({ example: 'video-generation' })
  @IsOptional()
  @IsString()
  category?: string | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'workspace-id-456' })
  @IsOptional()
  @IsString()
  workspaceId?: string | null;
}
