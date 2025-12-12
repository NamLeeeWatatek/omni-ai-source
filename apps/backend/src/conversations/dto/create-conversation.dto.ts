import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConversationDto {
  @ApiProperty({ description: 'Bot ID' })
  @IsNotEmpty()
  @IsUUID()
  botId: string;

  @ApiPropertyOptional({
    enum: ['web', 'messenger', 'telegram', 'instagram', 'whatsapp', 'api'],
    default: 'web',
  })
  @IsOptional()
  @IsEnum(['web', 'messenger', 'telegram', 'instagram', 'whatsapp', 'api'])
  channelType?: string;

  @ApiPropertyOptional({ description: 'Channel ID' })
  @IsOptional()
  @IsUUID()
  channelId?: string | null;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  contactName?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  contactAvatar?: string | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  externalId?: string;
}

export class AttachmentDto {
  @ApiProperty({ example: 'image' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'image.jpg' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 1024 })
  @IsOptional()
  @IsNumber()
  size?: number;
}

export class CreateMessageDto {
  @ApiProperty({
    enum: ['user', 'assistant', 'system', 'tool'],
    default: 'user',
  })
  @IsNotEmpty()
  @IsEnum(['user', 'assistant', 'system', 'tool'])
  role: 'user' | 'assistant' | 'system' | 'tool';

  @ApiProperty({ example: 'Hello, how can I help you?' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [AttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[] | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  sources?: Array<{
    documentId: string;
    title: string;
    content: string;
    score: number;
  }> | null;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
    result?: any;
  }> | null;

  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  sender?: string;
}

export class UpdateConversationStatusDto {
  @ApiProperty({ enum: ['active', 'closed', 'handover', 'archived'] })
  @IsEnum(['active', 'closed', 'handover', 'archived'])
  status: 'active' | 'closed' | 'handover' | 'archived';
}

export class MessageFeedbackDto {
  @ApiPropertyOptional({ enum: ['positive', 'negative'] })
  @IsOptional()
  @IsEnum(['positive', 'negative'])
  feedback?: 'positive' | 'negative';

  @ApiPropertyOptional({ example: 'Very helpful response!' })
  @IsOptional()
  @IsString()
  feedbackComment?: string | null;
}

export class CreateMessageFeedbackDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Great response!' })
  @IsOptional()
  @IsString()
  comment?: string | null;
}
