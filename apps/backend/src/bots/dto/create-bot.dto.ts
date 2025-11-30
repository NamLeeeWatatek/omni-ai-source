import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateBotDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Workspace ID (optional for global bots)',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiProperty({ example: 'Customer Support Bot' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Handles customer inquiries' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'FiMessageSquare' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  flowId?: string;
}
