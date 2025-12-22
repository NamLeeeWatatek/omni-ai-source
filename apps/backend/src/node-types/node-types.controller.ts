import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { NodeTypesService } from './node-types.service';
import { NodeCategory } from './types';
import { NodeType } from './domain/node-type';
import { AiProvidersService } from '../ai-providers/ai-providers.service';
import { ChannelsService } from '../channels/channels.service';

@ApiTags('Node Types')
@Controller({ path: 'node-types', version: '1' })
export class NodeTypesController {
  constructor(
    private readonly nodeTypesService: NodeTypesService,
    private readonly aiProvidersService: AiProvidersService,
    private readonly channelsService: ChannelsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all node types' })
  async findAll(@Query('category') category?: string): Promise<NodeType[]> {
    return this.nodeTypesService.findAll(category as any);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all node categories' })
  async getCategories(): Promise<NodeCategory[]> {
    return this.nodeTypesService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get node type by ID' })
  async findOne(@Param('id') id: string): Promise<NodeType | null> {
    return this.nodeTypesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new node type (Admin)' })
  @ApiBody({ type: NodeType })
  async create(
    @Body() data: Omit<NodeType, 'createdAt' | 'updatedAt'>,
  ): Promise<NodeType> {
    return this.nodeTypesService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update node type (Admin)' })
  @ApiBody({ type: NodeType })
  async update(
    @Param('id') id: string,
    @Body() data: Partial<NodeType>,
  ): Promise<NodeType> {
    return this.nodeTypesService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete node type (Admin)' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.nodeTypesService.remove(id);
  }

  @Get('dynamic-options/:source')
  @ApiOperation({ summary: 'Get dynamic options for node types' })
  @ApiQuery({ name: 'type', required: false })
  async getDynamicOptions(
    @Param('source') source: string,
    @Query('type') type?: string,
    @Request() req?: any,
  ): Promise<{ value: string; label: string }[]> {
    try {
      const userId = req?.user?.id;
      const workspaceId = req?.user?.workspaceId || userId;

      switch (source) {
        case 'ai-models':
        case 'getModels': {
          const typeFilter = type || 'chat';
          let models: string[] = [];

          if (workspaceId) {
            try {
              const workspaceConfigs =
                await this.aiProvidersService.getWorkspaceConfigs(workspaceId);
              const activeConfigs = workspaceConfigs.filter(
                (config) => config.isActive,
              );

              for (const config of activeConfigs) {
                try {
                  const configModels =
                    await this.aiProvidersService.fetchProviderModels(
                      config.id,
                      'workspace',
                      workspaceId,
                    );
                  models.push(
                    ...configModels.map(
                      (model) => `${config.provider?.key}/${model}`,
                    ),
                  );
                } catch (error) {
                  console.warn(
                    `Failed to fetch models for workspace config ${config.id}:`,
                    error.message,
                  );
                }
              }
            } catch (error) {
              console.warn(
                'Failed to get workspace AI configs:',
                error.message,
              );
            }
          }

          if (models.length === 0) {
            if (typeFilter === 'chat') {
              models = [
                'openai/gpt-4o-mini',
                'openai/gpt-4o',
                'anthropic/claude-3-haiku-20240307',
                'google/gemini-1.5-flash',
              ];
            } else {
              models = ['openai/dall-e-3', 'openai/dall-e-2'];
            }
          }

          return models.map((model) => ({
            value: model,
            label: model.split('/')[1] || model,
          }));
        }

        case 'channels':
        case 'getChannels': {
          const channels = await this.channelsService.findAll(workspaceId);
          return channels.map((channel) => ({
            value: channel.id,
            label:
              channel.name || `${channel.type} (${channel.id.slice(0, 8)})`,
          }));
        }

        default:
          throw new BadRequestException(`Unknown dynamic source: ${source}`);
      }
    } catch (error) {
      console.error(
        `Error fetching dynamic options for ${source}:`,
        error.message,
      );
      return [];
    }
  }
}
