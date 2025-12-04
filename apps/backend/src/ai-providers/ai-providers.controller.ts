import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AiProvidersService } from './ai-providers.service';
import {
  CreateUserAiProviderDto,
  UpdateUserAiProviderDto,
  CreateWorkspaceAiProviderDto,
  UpdateWorkspaceAiProviderDto,
  VerifyApiKeyDto,
} from './dto/ai-provider.dto';
import {
  UserAiProvider,
  WorkspaceAiProvider,
  AiUsageLog,
} from './domain/ai-provider';

@ApiTags('AI Providers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'ai-providers', version: '1' })
export class AiProvidersController {
  constructor(private readonly aiProvidersService: AiProvidersService) {}

  @Post('user')
  @ApiOperation({ summary: 'Create user AI provider' })
  @ApiCreatedResponse({ type: UserAiProvider })
  @HttpCode(HttpStatus.CREATED)
  createUserProvider(@Body() dto: CreateUserAiProviderDto, @Request() req) {
    return this.aiProvidersService.createUserProvider(req.user.id, dto);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get user AI providers' })
  @ApiOkResponse({ type: [UserAiProvider] })
  getUserProviders(@Request() req) {
    return this.aiProvidersService.getUserProviders(req.user.id);
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Get user AI provider by ID' })
  @ApiOkResponse({ type: UserAiProvider })
  @ApiParam({ name: 'id', type: String })
  getUserProvider(@Param('id') id: string, @Request() req) {
    return this.aiProvidersService.getUserProvider(req.user.id, id);
  }

  @Patch('user/:id')
  @ApiOperation({ summary: 'Update user AI provider' })
  @ApiOkResponse({ type: UserAiProvider })
  @ApiParam({ name: 'id', type: String })
  updateUserProvider(
    @Param('id') id: string,
    @Body() dto: UpdateUserAiProviderDto,
    @Request() req,
  ) {
    return this.aiProvidersService.updateUserProvider(req.user.id, id, dto);
  }

  @Delete('user/:id')
  @ApiOperation({ summary: 'Delete user AI provider' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUserProvider(@Param('id') id: string, @Request() req) {
    return this.aiProvidersService.deleteUserProvider(req.user.id, id);
  }

  @Post('user/:id/verify')
  @ApiOperation({ summary: 'Verify user AI provider API key' })
  @ApiOkResponse({ type: UserAiProvider })
  @ApiParam({ name: 'id', type: String })
  verifyUserProvider(@Param('id') id: string, @Request() req) {
    return this.aiProvidersService.verifyUserProvider(req.user.id, id);
  }

  @Post('workspace/:workspaceId')
  @ApiOperation({ summary: 'Create workspace AI provider' })
  @ApiCreatedResponse({ type: WorkspaceAiProvider })
  @ApiParam({ name: 'workspaceId', type: String })
  @HttpCode(HttpStatus.CREATED)
  createWorkspaceProvider(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateWorkspaceAiProviderDto,
  ) {
    return this.aiProvidersService.createWorkspaceProvider(workspaceId, dto);
  }

  @Get('workspace/:workspaceId')
  @ApiOperation({ summary: 'Get workspace AI providers' })
  @ApiOkResponse({ type: [WorkspaceAiProvider] })
  @ApiParam({ name: 'workspaceId', type: String })
  getWorkspaceProviders(@Param('workspaceId') workspaceId: string) {
    return this.aiProvidersService.getWorkspaceProviders(workspaceId);
  }

  @Get('workspace/:workspaceId/:id')
  @ApiOperation({ summary: 'Get workspace AI provider by ID' })
  @ApiOkResponse({ type: WorkspaceAiProvider })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'id', type: String })
  getWorkspaceProvider(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.aiProvidersService.getWorkspaceProvider(workspaceId, id);
  }

  @Patch('workspace/:workspaceId/:id')
  @ApiOperation({ summary: 'Update workspace AI provider' })
  @ApiOkResponse({ type: WorkspaceAiProvider })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'id', type: String })
  updateWorkspaceProvider(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceAiProviderDto,
  ) {
    return this.aiProvidersService.updateWorkspaceProvider(
      workspaceId,
      id,
      dto,
    );
  }

  @Delete('workspace/:workspaceId/:id')
  @ApiOperation({ summary: 'Delete workspace AI provider' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteWorkspaceProvider(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.aiProvidersService.deleteWorkspaceProvider(workspaceId, id);
  }

  @Get('workspace/:workspaceId/usage')
  @ApiOperation({ summary: 'Get workspace AI usage logs' })
  @ApiOkResponse({ type: [AiUsageLog] })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'provider', required: false, type: String })
  getUsageLogs(
    @Param('workspaceId') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('provider') provider?: string,
  ) {
    return this.aiProvidersService.getUsageLogs(workspaceId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId,
      provider,
    });
  }

  @Get('workspace/:workspaceId/usage/stats')
  @ApiOperation({ summary: 'Get workspace AI usage statistics' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month'], required: false })
  getUsageStats(
    @Param('workspaceId') workspaceId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ) {
    return this.aiProvidersService.getUsageStats(workspaceId, period);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify an API key without saving' })
  async verifyApiKey(@Body() dto: VerifyApiKeyDto) {
    return { valid: true, message: 'API key verification endpoint' };
  }

  @Get('models')
  @ApiOperation({ summary: 'Get available AI models grouped by provider' })
  @ApiOkResponse({
    description: 'List of available AI models grouped by provider',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          models: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                provider: { type: 'string' },
                model_name: { type: 'string' },
                display_name: { type: 'string' },
                description: { type: 'string' },
                api_key_configured: { type: 'boolean' },
                is_available: { type: 'boolean' },
                capabilities: { type: 'array', items: { type: 'string' } },
                max_tokens: { type: 'number' },
                is_default: { type: 'boolean' },
                is_recommended: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  })
  getAvailableModels() {
    return [
      {
        provider: 'google',
        models: [
          {
            provider: 'google',
            model_name: 'gemini-2.0-flash',
            display_name: 'Gemini 2.0 Flash',
            description: 'Fast and efficient model for general tasks',
            api_key_configured: true,
            is_available: true,
            capabilities: ['chat', 'completion', 'embedding'],
            max_tokens: 8192,
            is_default: true,
            is_recommended: true,
          },
          {
            provider: 'google',
            model_name: 'gemini-2.5-flash',
            display_name: 'Gemini 2.5 Flash',
            description: 'Latest fast model with improved capabilities',
            api_key_configured: true,
            is_available: true,
            capabilities: ['chat', 'completion', 'embedding'],
            max_tokens: 8192,
            is_recommended: true,
          },
          {
            provider: 'google',
            model_name: 'gemini-pro',
            display_name: 'Gemini Pro',
            description: 'Advanced model for complex tasks',
            api_key_configured: true,
            is_available: true,
            capabilities: ['chat', 'completion'],
            max_tokens: 8192,
          },
          {
            provider: 'google',
            model_name: 'gemini-1.5-pro',
            display_name: 'Gemini 1.5 Pro',
            description: 'Long context model with 1M tokens',
            api_key_configured: true,
            is_available: true,
            capabilities: ['chat', 'completion'],
            max_tokens: 8192,
          },
        ],
      },
      {
        provider: 'openai',
        models: [
          {
            provider: 'openai',
            model_name: 'gpt-4',
            display_name: 'GPT-4',
            description: 'Most capable OpenAI model',
            api_key_configured: false,
            is_available: false,
            capabilities: ['chat', 'completion'],
            max_tokens: 4096,
          },
          {
            provider: 'openai',
            model_name: 'gpt-4-turbo',
            display_name: 'GPT-4 Turbo',
            description: 'Faster GPT-4 with lower cost',
            api_key_configured: false,
            is_available: false,
            capabilities: ['chat', 'completion'],
            max_tokens: 4096,
          },
          {
            provider: 'openai',
            model_name: 'gpt-4o',
            display_name: 'GPT-4o',
            description: 'Optimized GPT-4 model',
            api_key_configured: false,
            is_available: false,
            capabilities: ['chat', 'completion', 'vision'],
            max_tokens: 4096,
          },
          {
            provider: 'openai',
            model_name: 'gpt-3.5-turbo',
            display_name: 'GPT-3.5 Turbo',
            description: 'Fast and cost-effective model',
            api_key_configured: false,
            is_available: false,
            capabilities: ['chat', 'completion'],
            max_tokens: 4096,
          },
        ],
      },
      {
        provider: 'anthropic',
        models: [
          {
            provider: 'anthropic',
            model_name: 'claude-3-opus',
            display_name: 'Claude 3 Opus',
            description: 'Most capable Claude model',
            api_key_configured: false,
            is_available: false,
            capabilities: ['chat', 'completion'],
            max_tokens: 4096,
          },
          {
            provider: 'anthropic',
            model_name: 'claude-3-sonnet',
            display_name: 'Claude 3 Sonnet',
            description: 'Balanced performance and speed',
            api_key_configured: false,
            is_available: false,
            capabilities: ['chat', 'completion'],
            max_tokens: 4096,
          },
          {
            provider: 'anthropic',
            model_name: 'claude-3-haiku',
            display_name: 'Claude 3 Haiku',
            description: 'Fastest Claude model',
            api_key_configured: false,
            is_available: false,
            capabilities: ['chat', 'completion'],
            max_tokens: 4096,
          },
          {
            provider: 'anthropic',
            model_name: 'claude-3.5-sonnet',
            display_name: 'Claude 3.5 Sonnet',
            description: 'Latest Claude model with enhanced capabilities',
            api_key_configured: false,
            is_available: false,
            capabilities: ['chat', 'completion', 'vision'],
            max_tokens: 8192,
          },
        ],
      },
    ];
  }
}
