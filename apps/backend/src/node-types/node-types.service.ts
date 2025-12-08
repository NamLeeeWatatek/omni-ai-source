import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NodeType, NodeCategory } from './domain/node-type';
import { NodeTypeEntity } from './infrastructure/persistence/relational/entities/node-type.entity';

@Injectable()
export class NodeTypesService {
  constructor(
    @InjectRepository(NodeTypeEntity)
    private readonly nodeTypeRepository: Repository<NodeTypeEntity>,
  ) { }

  private readonly fallbackNodeTypes: NodeType[] = [
    {
      id: 'webhook',
      label: 'Webhook',
      category: 'trigger',
      icon: 'Webhook',
      color: '#4CAF50',
      description: 'Trigger workflow from HTTP webhook',
      properties: [
        {
          name: 'method',
          label: 'HTTP Method',
          type: 'select',
          required: true,
          options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'POST',
        },
        {
          name: 'path',
          label: 'Webhook Path',
          type: 'text',
          required: true,
          placeholder: '/webhook/my-flow',
        },
      ],
    },
    {
      id: 'schedule',
      label: 'Schedule',
      category: 'trigger',
      icon: 'Clock',
      color: '#FF9800',
      description: 'Trigger workflow on schedule',
      properties: [
        {
          name: 'interval',
          label: 'Interval Type',
          type: 'select',
          required: true,
          options: ['cron', 'interval', 'once'],
          default: 'interval',
        },
        {
          name: 'cronExpression',
          label: 'Cron Expression',
          type: 'text',
          placeholder: '0 0 * * *',
          showWhen: { interval: 'cron' },
        },
        {
          name: 'intervalMinutes',
          label: 'Interval (minutes)',
          type: 'number',
          default: 60,
          showWhen: { interval: 'interval' },
        },
      ],
    },
    {
      id: 'manual',
      label: 'Manual Trigger',
      category: 'trigger',
      icon: 'Play',
      color: '#2196F3',
      description: 'Manually trigger workflow',
      properties: [],
    },

    {
      id: 'send-message',
      label: 'Send Message',
      category: 'messaging',
      icon: 'MessageSquare',
      color: '#9C27B0',
      description: 'Send message to channel',
      properties: [
        {
          name: 'channel',
          label: 'Channel',
          type: 'select',
          required: true,
          options: 'dynamic:channels',
          description: 'Select which connected channel to send through',
        },
        {
          name: 'to',
          label: 'Recipient',
          type: 'text',
          required: true,
          placeholder: 'User ID or phone number',
        },
        {
          name: 'message',
          label: 'Message',
          type: 'textarea',
          required: true,
          placeholder: 'Enter your message...',
        },
        {
          name: 'attachments',
          label: 'Attachments',
          type: 'file',
          multiple: true,
        },
      ],
    },
    {
      id: 'receive-message',
      label: 'Receive Message',
      category: 'messaging',
      icon: 'Inbox',
      color: '#E91E63',
      description: 'Receive message from channel',
      properties: [
        {
          name: 'channelId',
          label: 'Channel',
          type: 'select',
          required: true,
          options: [],
        },
      ],
    },

    {
      id: 'ai-chat',
      label: 'AI Chat',
      category: 'ai',
      icon: 'Bot',
      color: '#00BCD4',
      description: 'Chat with AI model',
      properties: [
        {
          name: 'model',
          label: 'AI Model',
          type: 'select',
          required: true,
          options: ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'gemini-pro'],
          default: 'gpt-3.5-turbo',
        },
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          required: true,
          placeholder: 'Enter your prompt...',
        },
        {
          name: 'temperature',
          label: 'Temperature',
          type: 'number',
          default: 0.7,
        },
        {
          name: 'maxTokens',
          label: 'Max Tokens',
          type: 'number',
          default: 1000,
        },
      ],
    },
    {
      id: 'ai-image',
      label: 'AI Image Generation',
      category: 'ai',
      icon: 'Image',
      color: '#FF5722',
      description: 'Generate images with AI',
      isPremium: true,
      properties: [
        {
          name: 'model',
          label: 'Model',
          type: 'select',
          options: ['dall-e-3', 'stable-diffusion', 'midjourney'],
          default: 'dall-e-3',
        },
        {
          name: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          required: true,
        },
        {
          name: 'size',
          label: 'Size',
          type: 'select',
          options: ['1024x1024', '1792x1024', '1024x1792'],
          default: '1024x1024',
        },
      ],
    },

    {
      id: 'http-request',
      label: 'HTTP Request',
      category: 'data',
      icon: 'Globe',
      color: '#607D8B',
      description: 'Make HTTP request',
      properties: [
        {
          name: 'method',
          label: 'Method',
          type: 'select',
          required: true,
          options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'GET',
        },
        {
          name: 'url',
          label: 'URL',
          type: 'url',
          required: true,
          placeholder: 'https://api.example.com/endpoint',
        },
        {
          name: 'headers',
          label: 'Headers',
          type: 'key-value',
        },
        {
          name: 'body',
          label: 'Body',
          type: 'json',
          showWhen: { method: ['POST', 'PUT', 'PATCH'] },
        },
      ],
    },

    // === NEW INTEGRATION NODES ===
    {
      id: 'webhook-trigger',
      label: 'Webhook Trigger',
      category: 'integration',
      icon: 'Webhook',
      color: '#00C853',
      description: 'Call external webhooks (n8n, Zapier, Make, custom)',
      properties: [
        {
          name: 'webhookUrl',
          label: 'Webhook URL',
          type: 'url',
          required: true,
          placeholder: 'https://n8n.example.com/webhook/xxx',
          description: 'URL of the external webhook to call',
        },
        {
          name: 'method',
          label: 'HTTP Method',
          type: 'select',
          required: true,
          options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'POST',
        },
        {
          name: 'payloadType',
          label: 'Payload Type',
          type: 'select',
          options: ['json', 'form-data', 'raw'],
          default: 'json',
        },
        {
          name: 'payload',
          label: 'Custom Payload',
          type: 'json',
          description: 'Leave empty to pass previous node output. Use {{variable}} for interpolation',
        },
        {
          name: 'headers',
          label: 'Custom Headers',
          type: 'key-value',
        },
        {
          name: 'authentication',
          label: 'Authentication',
          type: 'dynamic-form',
          properties: [
            {
              name: 'type',
              label: 'Auth Type',
              type: 'select',
              options: ['none', 'bearer', 'basic', 'api-key', 'custom'],
            },
            {
              name: 'token',
              label: 'Bearer Token',
              type: 'password',
              showWhen: { type: 'bearer' },
            },
            {
              name: 'username',
              label: 'Username',
              type: 'text',
              showWhen: { type: 'basic' },
            },
            {
              name: 'password',
              label: 'Password',
              type: 'password',
              showWhen: { type: 'basic' },
            },
            {
              name: 'key',
              label: 'API Key',
              type: 'password',
              showWhen: { type: 'api-key' },
            },
          ],
        },
        {
          name: 'responseMapping',
          label: 'Response Field Mapping',
          type: 'key-value',
          description: 'Map response fields to output: outputKey -> response.path',
        },
        {
          name: 'timeout',
          label: 'Timeout (ms)',
          type: 'number',
          default: 30000,
        },
        {
          name: 'retryCount',
          label: 'Retry on Failure',
          type: 'number',
          default: 0,
        },
      ],
    },
    {
      id: 'api-connector',
      label: 'API Connector',
      category: 'integration',
      icon: 'Plug',
      color: '#7C4DFF',
      description: 'Advanced API integration with pagination & auth',
      isPremium: false,
      properties: [
        {
          name: 'baseUrl',
          label: 'Base URL',
          type: 'url',
          required: true,
          placeholder: 'https://api.example.com',
        },
        {
          name: 'endpoint',
          label: 'Endpoint',
          type: 'text',
          required: true,
          placeholder: '/v1/users/:id',
          description: 'Use :paramName for path parameters',
        },
        {
          name: 'method',
          label: 'HTTP Method',
          type: 'select',
          required: true,
          options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'GET',
        },
        {
          name: 'pathParams',
          label: 'Path Parameters',
          type: 'key-value',
          description: 'Replace :paramName in endpoint',
        },
        {
          name: 'queryParams',
          label: 'Query Parameters',
          type: 'key-value',
        },
        {
          name: 'headers',
          label: 'Headers',
          type: 'key-value',
        },
        {
          name: 'bodyType',
          label: 'Body Type',
          type: 'select',
          options: ['json', 'form', 'graphql', 'raw'],
          default: 'json',
          showWhen: { method: ['POST', 'PUT', 'PATCH'] },
        },
        {
          name: 'body',
          label: 'Request Body',
          type: 'json',
          showWhen: { method: ['POST', 'PUT', 'PATCH'] },
        },
        {
          name: 'auth',
          label: 'Authentication',
          type: 'dynamic-form',
          properties: [
            {
              name: 'type',
              label: 'Auth Type',
              type: 'select',
              options: ['none', 'bearer', 'basic', 'api-key', 'oauth2', 'custom'],
            },
            {
              name: 'token',
              label: 'Bearer Token',
              type: 'password',
              showWhen: { type: 'bearer' },
            },
            {
              name: 'username',
              label: 'Username',
              type: 'text',
              showWhen: { type: 'basic' },
            },
            {
              name: 'password',
              label: 'Password',
              type: 'password',
              showWhen: { type: 'basic' },
            },
            {
              name: 'name',
              label: 'Key Name',
              type: 'text',
              showWhen: { type: 'api-key' },
            },
            {
              name: 'value',
              label: 'Key Value',
              type: 'password',
              showWhen: { type: 'api-key' },
            },
            {
              name: 'in',
              label: 'Key Location',
              type: 'select',
              options: ['header', 'query'],
              showWhen: { type: 'api-key' },
            },
          ],
        },
        {
          name: 'extractPath',
          label: 'Extract Data Path',
          type: 'text',
          placeholder: 'data.items',
          description: 'JSONPath to extract from response',
        },
        {
          name: 'pagination',
          label: 'Pagination',
          type: 'dynamic-form',
          properties: [
            {
              name: 'enabled',
              label: 'Enable Pagination',
              type: 'boolean',
              default: false,
            },
            {
              name: 'type',
              label: 'Pagination Type',
              type: 'select',
              options: ['page', 'offset', 'cursor'],
              showWhen: { enabled: true },
            },
            {
              name: 'pageParam',
              label: 'Page Parameter',
              type: 'text',
              default: 'page',
              showWhen: { enabled: true, type: 'page' },
            },
            {
              name: 'limitParam',
              label: 'Limit Parameter',
              type: 'text',
              default: 'limit',
              showWhen: { enabled: true },
            },
            {
              name: 'limit',
              label: 'Items per Page',
              type: 'number',
              default: 100,
              showWhen: { enabled: true },
            },
            {
              name: 'maxPages',
              label: 'Max Pages',
              type: 'number',
              default: 10,
              showWhen: { enabled: true },
            },
            {
              name: 'dataPath',
              label: 'Data Path in Response',
              type: 'text',
              placeholder: 'data.items',
              showWhen: { enabled: true },
            },
          ],
        },
        {
          name: 'timeout',
          label: 'Timeout (ms)',
          type: 'number',
          default: 30000,
        },
        {
          name: 'continueOnError',
          label: 'Continue on Error',
          type: 'boolean',
          default: false,
        },
      ],
    },
    {
      id: 'response-handler',
      label: 'Response Handler',
      category: 'transform',
      icon: 'Shuffle',
      color: '#FF6D00',
      description: 'Process and transform API/webhook responses',
      properties: [
        {
          name: 'extractPaths',
          label: 'Extract Fields',
          type: 'dynamic-form',
          description: 'Extract specific fields from response',
          properties: [
            {
              name: 'key',
              label: 'Output Key',
              type: 'text',
            },
            {
              name: 'path',
              label: 'Source Path',
              type: 'text',
              placeholder: 'data.user.name',
            },
            {
              name: 'defaultValue',
              label: 'Default Value',
              type: 'text',
            },
          ],
        },
        {
          name: 'transformations',
          label: 'Transformations',
          type: 'dynamic-form',
          properties: [
            {
              name: 'type',
              label: 'Transform Type',
              type: 'select',
              options: ['pick', 'omit', 'rename', 'flatten', 'group', 'sort', 'unique', 'format', 'calculate'],
            },
            {
              name: 'fields',
              label: 'Fields',
              type: 'text',
              placeholder: 'field1, field2',
            },
            {
              name: 'mapping',
              label: 'Field Mapping',
              type: 'key-value',
            },
          ],
        },
        {
          name: 'filters',
          label: 'Filter Conditions',
          type: 'dynamic-form',
          description: 'Filter array data',
          properties: [
            {
              name: 'field',
              label: 'Field',
              type: 'text',
            },
            {
              name: 'operator',
              label: 'Operator',
              type: 'select',
              options: ['equals', 'notEquals', 'contains', 'gt', 'gte', 'lt', 'lte', 'exists', 'in'],
            },
            {
              name: 'value',
              label: 'Value',
              type: 'text',
            },
          ],
        },
        {
          name: 'aggregate',
          label: 'Aggregation',
          type: 'dynamic-form',
          properties: [
            {
              name: 'operation',
              label: 'Operation',
              type: 'select',
              options: ['sum', 'avg', 'count', 'min', 'max', 'first', 'last'],
            },
            {
              name: 'field',
              label: 'Field',
              type: 'text',
            },
          ],
        },
        {
          name: 'conditions',
          label: 'Routing Conditions',
          type: 'dynamic-form',
          description: 'Define conditions for conditional routing',
          properties: [
            {
              name: 'name',
              label: 'Route Name',
              type: 'text',
            },
            {
              name: 'field',
              label: 'Field',
              type: 'text',
            },
            {
              name: 'operator',
              label: 'Operator',
              type: 'select',
              options: ['equals', 'notEquals', 'contains', 'gt', 'gte', 'lt', 'lte', 'exists'],
            },
            {
              name: 'value',
              label: 'Value',
              type: 'text',
            },
          ],
        },
        {
          name: 'outputFormat',
          label: 'Output Format',
          type: 'select',
          options: ['object', 'array', 'flatten'],
          default: 'object',
        },
        {
          name: 'debug',
          label: 'Debug Mode',
          type: 'boolean',
          default: false,
          description: 'Include original input in output for debugging',
        },
      ],
    },

    {
      id: 'database-query',
      label: 'Database Query',
      category: 'data',
      icon: 'Database',
      color: '#795548',
      description: 'Query database',
      properties: [
        {
          name: 'connection',
          label: 'Connection',
          type: 'select',
          required: true,
          options: [],
        },
        {
          name: 'query',
          label: 'SQL Query',
          type: 'textarea',
          required: true,
          placeholder: 'SELECT * FROM users WHERE id = ?',
        },
        {
          name: 'parameters',
          label: 'Parameters',
          type: 'dynamic-form',
        },
      ],
    },

    {
      id: 'condition',
      label: 'Condition',
      category: 'logic',
      icon: 'GitBranch',
      color: '#FFC107',
      description: 'Branch based on condition',
      properties: [
        {
          name: 'conditions',
          label: 'Conditions',
          type: 'dynamic-form',
          required: true,
        },
      ],
    },
    {
      id: 'loop',
      label: 'Loop',
      category: 'logic',
      icon: 'Repeat',
      color: '#CDDC39',
      description: 'Loop over items',
      properties: [
        {
          name: 'items',
          label: 'Items',
          type: 'json',
          required: true,
        },
        {
          name: 'maxIterations',
          label: 'Max Iterations',
          type: 'number',
          default: 100,
        },
      ],
    },
    {
      id: 'delay',
      label: 'Delay',
      category: 'logic',
      icon: 'Timer',
      color: '#009688',
      description: 'Wait for specified time',
      properties: [
        {
          name: 'duration',
          label: 'Duration (seconds)',
          type: 'number',
          required: true,
          default: 5,
        },
      ],
    },

    {
      id: 'code',
      label: 'Code',
      category: 'transform',
      icon: 'Code',
      color: '#3F51B5',
      description: 'Execute custom JavaScript code',
      properties: [
        {
          name: 'code',
          label: 'JavaScript Code',
          type: 'textarea',
          required: true,
          placeholder: 'return { result: input.value * 2 }',
        },
      ],
    },
    {
      id: 'json-transform',
      label: 'JSON Transform',
      category: 'transform',
      icon: 'FileJson',
      color: '#673AB7',
      description: 'Transform JSON data',
      properties: [
        {
          name: 'mapping',
          label: 'Field Mapping',
          type: 'key-value',
          required: true,
        },
      ],
    },
  ];

  private readonly categories: NodeCategory[] = [
    { id: 'trigger', label: 'Triggers', color: '#4CAF50' },
    { id: 'messaging', label: 'Messaging', color: '#9C27B0' },
    { id: 'ai', label: 'AI', color: '#00BCD4' },
    { id: 'integration', label: 'Integrations', color: '#7C4DFF' },
    { id: 'data', label: 'Data', color: '#607D8B' },
    { id: 'logic', label: 'Logic', color: '#FFC107' },
    { id: 'transform', label: 'Transform', color: '#3F51B5' },
  ];

  async findAll(category?: string): Promise<NodeType[]> {
    try {
      const query = this.nodeTypeRepository
        .createQueryBuilder('nodeType')
        .where('nodeType.isActive = :isActive', { isActive: true })
        .orderBy('nodeType.sortOrder', 'ASC')
        .addOrderBy('nodeType.label', 'ASC');

      if (category) {
        query.andWhere('nodeType.category = :category', { category });
      }

      const entities = await query.getMany();

      if (entities.length === 0) {
        return category
          ? this.fallbackNodeTypes.filter((node) => node.category === category)
          : this.fallbackNodeTypes;
      }

      return entities;
    } catch (error) {
      return category
        ? this.fallbackNodeTypes.filter((node) => node.category === category)
        : this.fallbackNodeTypes;
    }
  }

  async findOne(id: string): Promise<NodeType | null> {
    try {
      const entity = await this.nodeTypeRepository.findOne({
        where: { id, isActive: true },
      });

      if (!entity) {
        return this.fallbackNodeTypes.find((node) => node.id === id) || null;
      }

      return entity;
    } catch (error) {
      return this.fallbackNodeTypes.find((node) => node.id === id) || null;
    }
  }

  async getCategories(): Promise<NodeCategory[]> {
    try {
      const result = await this.nodeTypeRepository
        .createQueryBuilder('nodeType')
        .select('nodeType.category', 'id')
        .addSelect('nodeType.category', 'label')
        .where('nodeType.isActive = :isActive', { isActive: true })
        .groupBy('nodeType.category')
        .getRawMany();

      if (result.length === 0) {
        return this.categories;
      }

      return result.map((cat) => ({
        ...cat,
        color: this.categories.find((c) => c.id === cat.id)?.color || '#607D8B',
      }));
    } catch (error) {
      return this.categories;
    }
  }

  async create(data: Partial<NodeTypeEntity>): Promise<NodeTypeEntity> {
    const nodeType = this.nodeTypeRepository.create(data);
    return this.nodeTypeRepository.save(nodeType);
  }

  async update(
    id: string,
    data: Partial<NodeTypeEntity>,
  ): Promise<NodeTypeEntity> {
    await this.nodeTypeRepository.update(id, data);
    const updated = await this.nodeTypeRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error(`Node type ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.nodeTypeRepository.update(id, { isActive: false });
  }
}
