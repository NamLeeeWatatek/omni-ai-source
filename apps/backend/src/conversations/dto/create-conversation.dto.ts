import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  botId: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @ApiProperty({ example: 'user-123' })
  @IsNotEmpty()
  @IsString()
  externalId: string;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateMessageDto {
  @ApiProperty({ example: 'Hello!' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: 'user' })
  @IsNotEmpty()
  @IsString()
  sender: string;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
