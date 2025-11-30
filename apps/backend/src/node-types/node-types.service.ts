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
  ) {}

  // Keep hardcoded data as fallback for now
  private readonly fallbackNodeTypes: NodeType[] = [
    // Triggers
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

    // Messaging
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
          options: 'dynamic:channels', // Load from /channels/ API
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

    // AI
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

    // Data
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
          options: [], // Dynamic from connections
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

    // Logic
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

    // Transform
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

      // If no data in database, return fallback
      if (entities.length === 0) {
        console.warn('⚠️  No node types in database, using fallback data');
        return category
          ? this.fallbackNodeTypes.filter((node) => node.category === category)
          : this.fallbackNodeTypes;
      }

      return entities;
    } catch (error) {
      console.error('Error fetching node types:', error);
      // Return fallback on error
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
        // Try fallback
        return this.fallbackNodeTypes.find((node) => node.id === id) || null;
      }

      return entity;
    } catch (error) {
      console.error(`Error fetching node type ${id}:`, error);
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

      // Add colors from categories mapping
      return result.map((cat) => ({
        ...cat,
        color: this.categories.find((c) => c.id === cat.id)?.color || '#607D8B',
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return this.categories;
    }
  }

  // Admin methods for CRUD
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
    // Soft delete by setting isActive = false
    await this.nodeTypeRepository.update(id, { isActive: false });
  }
}
