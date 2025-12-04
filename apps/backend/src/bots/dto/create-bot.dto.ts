import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsObject,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateBotDto {
  @ApiProperty({ example: 'Customer Support Bot' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A bot for handling customer inquiries' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/bot-avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiPropertyOptional({ example: 'UTC', default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(['draft', 'active', 'paused', 'archived'])
  status?: 'draft' | 'active' | 'paused' | 'archived';

  @ApiPropertyOptional({
    description: 'Workspace ID (auto-detected if not provided)',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({ example: 'You are a helpful customer support agent.' })
  @IsOptional()
  @IsString()
  systemPrompt?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['document_access', 'ai_suggest'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  functions?: string[] | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  functionConfig?: Record<string, any> | null;

  @ApiPropertyOptional({ description: 'AI Provider ID' })
  @IsOptional()
  @IsUUID()
  aiProviderId?: string | null;

  @ApiPropertyOptional({ example: 'gpt-4' })
  @IsOptional()
  @IsString()
  aiModelName?: string | null;

  @ApiPropertyOptional({
    type: Object,
    example: { temperature: 0.7, max_tokens: 1000 },
  })
  @IsOptional()
  @IsObject()
  aiParameters?: Record<string, any> | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  knowledgeBaseIds?: string[] | null;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  enableAutoLearn?: boolean;

  @ApiPropertyOptional({
    example: '#667eea',
    description: 'Primary color in hex format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, {
    message: 'Invalid color format. Use hex format like #667eea',
  })
  primaryColor?: string | null;

  @ApiPropertyOptional({
    enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
    example: 'bottom-right',
  })
  @IsOptional()
  @IsEnum(['bottom-right', 'bottom-left', 'top-right', 'top-left'])
  widgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  @ApiPropertyOptional({
    enum: ['small', 'medium', 'large'],
    example: 'medium',
  })
  @IsOptional()
  @IsEnum(['small', 'medium', 'large'])
  widgetButtonSize?: 'small' | 'medium' | 'large';

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showAvatar?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showTimestamp?: boolean;

  @ApiPropertyOptional({ example: 'Xin chào! Tôi có thể giúp gì cho bạn?' })
  @IsOptional()
  @IsString()
  welcomeMessage?: string | null;

  @ApiPropertyOptional({ example: 'Nhập tin nhắn...' })
  @IsOptional()
  @IsString()
  placeholderText?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['*'],
    description: 'Allowed origins for CORS',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedOrigins?: string[] | null;

  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  icon?: string;
}
