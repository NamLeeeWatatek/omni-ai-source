import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  IsBoolean,
} from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Image Generation Template', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Template for generating images with AI' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'Generate a beautiful landscape image with mountains and lakes' })
  @IsOptional()
  @IsString()
  prompt?: string | null;

  @ApiPropertyOptional({ type: [String], example: ['file-id-1', 'file-id-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaFiles?: string[] | null;

  @ApiPropertyOptional({ type: Object, example: { style: 'realistic', colors: ['blue', 'green'] } })
  @IsOptional()
  @IsObject()
  styleConfig?: Record<string, any> | null;

  @ApiPropertyOptional({ example: 'image-generation' })
  @IsOptional()
  @IsString()
  category?: string | null;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'workspace-id-123' })
  @IsOptional()
  @IsString()
  workspaceId?: string | null;
}
