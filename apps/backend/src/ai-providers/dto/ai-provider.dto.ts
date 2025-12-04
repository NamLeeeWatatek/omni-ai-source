import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class CreateUserAiProviderDto {
  @ApiProperty({ enum: ['openai', 'anthropic', 'google', 'azure', 'custom'] })
  @IsNotEmpty()
  @IsEnum(['openai', 'anthropic', 'google', 'azure', 'custom'])
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';

  @ApiProperty({ example: 'My OpenAI Key' })
  @IsNotEmpty()
  @IsString()
  displayName: string;

  @ApiProperty({ description: 'API key (will be encrypted)' })
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ 
    type: [String], 
    example: ['gpt-4', 'gpt-3.5-turbo', 'gemini-2.5-flash'],
    description: 'List of model names supported by this provider'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modelList?: string[];
}

export class UpdateUserAiProviderDto {
  @ApiPropertyOptional({ example: 'My OpenAI Key' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'New API key (will be encrypted)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modelList?: string[];

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateWorkspaceAiProviderDto {
  @ApiProperty({ enum: ['openai', 'anthropic', 'google', 'azure', 'custom'] })
  @IsNotEmpty()
  @IsEnum(['openai', 'anthropic', 'google', 'azure', 'custom'])
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';

  @ApiProperty({ example: 'Team OpenAI Key' })
  @IsNotEmpty()
  @IsString()
  displayName: string;

  @ApiProperty({ description: 'API key (will be encrypted)' })
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modelList?: string[];
}

export class UpdateWorkspaceAiProviderDto {
  @ApiPropertyOptional({ example: 'Team OpenAI Key' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'New API key (will be encrypted)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modelList?: string[];

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VerifyApiKeyDto {
  @ApiProperty({ description: 'API key to verify' })
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @ApiProperty({ enum: ['openai', 'anthropic', 'google', 'azure', 'custom'] })
  @IsNotEmpty()
  @IsEnum(['openai', 'anthropic', 'google', 'azure', 'custom'])
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
}
