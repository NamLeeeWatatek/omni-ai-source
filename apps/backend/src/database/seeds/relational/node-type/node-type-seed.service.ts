import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NodeTypeEntity } from '../../../../node-types/infrastructure/persistence/relational/entities/node-type.entity';
import {
  CHAT_MODEL_OPTIONS,
  IMAGE_MODEL_OPTIONS,
} from '../../../../constants/ai-models';

@Injectable()
export class NodeTypeSeedService {
  constructor(
    @InjectRepository(NodeTypeEntity)
    private repository: Repository<NodeTypeEntity>,
  ) {}

  async run() {
    const nodeTypes = [
      {
        id: 'webhook',
        label: 'Webhook',
        category: 'trigger',
        icon: 'Webhook',
        color: '#4CAF50',
        description: 'Trigger workflow from HTTP webhook',
        sortOrder: 1,
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
        sortOrder: 2,
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
        ],
      },
      {
        id: 'manual',
        label: 'Manual Trigger',
        category: 'trigger',
        icon: 'Play',
        color: '#2196F3',
        description: 'Manually trigger workflow',
        sortOrder: 3,
        properties: [],
      },

      {
        id: 'send-message',
        label: 'Send Message',
        category: 'messaging',
        icon: 'MessageSquare',
        color: '#9C27B0',
        description: 'Send message to channel',
        sortOrder: 10,
        properties: [
          {
            name: 'channel',
            label: 'Channel',
            type: 'select',
            required: true,
            options: 'dynamic:channels',
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
        ],
      },
      {
        id: 'receive-message',
        label: 'Receive Message',
        category: 'messaging',
        icon: 'Inbox',
        color: '#E91E63',
        description: 'Receive message from channel',
        sortOrder: 11,
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
        sortOrder: 20,
        isPremium: true,
        properties: [
          {
            name: 'model',
            label: 'AI Model',
            type: 'select',
            required: true,
            options: CHAT_MODEL_OPTIONS,
            default: 'gemini-2.5-flash',
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
        ],
      },
      {
        id: 'ai-image',
        label: 'AI Image Generation',
        category: 'ai',
        icon: 'Image',
        color: '#FF5722',
        description: 'Generate images with AI',
        sortOrder: 21,
        isPremium: true,
        properties: [
          {
            name: 'model',
            label: 'Model',
            type: 'select',
            options: IMAGE_MODEL_OPTIONS,
            default: 'dall-e-3',
          },
          {
            name: 'prompt',
            label: 'Prompt',
            type: 'textarea',
            required: true,
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
        sortOrder: 30,
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
        ],
      },
      {
        id: 'database-query',
        label: 'Database Query',
        category: 'data',
        icon: 'Database',
        color: '#795548',
        description: 'Query database',
        sortOrder: 31,
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
        ],
      },

      {
        id: 'condition',
        label: 'Condition',
        category: 'logic',
        icon: 'GitBranch',
        color: '#FFC107',
        description: 'Branch based on condition',
        sortOrder: 40,
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
        sortOrder: 41,
        properties: [
          {
            name: 'items',
            label: 'Items',
            type: 'json',
            required: true,
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
        sortOrder: 42,
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
        sortOrder: 50,
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
        sortOrder: 51,
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

    for (const nodeType of nodeTypes) {
      const exists = await this.repository.findOne({
        where: { id: nodeType.id },
      });

      if (!exists) {
        await this.repository.save(
          this.repository.create(nodeType as any),
        );
      }
    }

  }
}
