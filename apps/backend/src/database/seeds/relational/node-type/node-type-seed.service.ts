import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NodeTypeEntity } from '../../../../node-types/infrastructure/persistence/relational/entities/node-type.entity';

@Injectable()
export class NodeTypeSeedService {
  constructor(
    @InjectRepository(NodeTypeEntity)
    private repository: Repository<NodeTypeEntity>,
  ) {}

  async run() {
    const nodeTypes = [
      // Triggers
      {
        id: 'webhook',
        label: 'Webhook',
        category: 'trigger',
        icon: 'FiWebhook',
        color: '#4CAF50',
        bgColor: '#4CAF5020',
        description: 'Trigger workflow from HTTP webhook',
        isTrigger: true,
        sortOrder: 1,
        properties: [
          {
            name: 'method',
            label: 'HTTP Method',
            type: 'select',
            required: true,
            options: [
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'DELETE', label: 'DELETE' },
              { value: 'PATCH', label: 'PATCH' },
            ],
            default: 'POST',
          },
          {
            name: 'path',
            label: 'Webhook Path',
            type: 'string',
            required: true,
          },
        ],
      },
      {
        id: 'schedule',
        label: 'Schedule',
        category: 'trigger',
        icon: 'FiClock',
        color: '#FF9800',
        bgColor: '#FF980020',
        description: 'Trigger workflow on schedule',
        isTrigger: true,
        sortOrder: 2,
        properties: [
          {
            name: 'interval',
            label: 'Interval Type',
            type: 'select',
            required: true,
            options: [
              { value: 'cron', label: 'Cron Expression' },
              { value: 'interval', label: 'Time Interval' },
              { value: 'once', label: 'One Time' },
            ],
            default: 'interval',
          },
          {
            name: 'cronExpression',
            label: 'Cron Expression',
            type: 'string',
            showWhen: { interval: 'cron' },
          },
          {
            name: 'intervalValue',
            label: 'Interval (minutes)',
            type: 'number',
            default: 60,
            min: 1,
            showWhen: { interval: 'interval' },
          },
        ],
      },
      {
        id: 'manual',
        label: 'Manual Trigger',
        category: 'trigger',
        icon: 'FiPlay',
        color: '#2196F3',
        bgColor: '#2196F320',
        description: 'Manually trigger workflow',
        isTrigger: true,
        sortOrder: 3,
        properties: [],
      },

      // File/Image Upload Nodes
      {
        id: 'image-upload',
        label: 'Image Upload',
        category: 'action',
        icon: 'FiImage',
        color: '#4CAF50',
        bgColor: '#4CAF5020',
        description: 'Upload image files',
        sortOrder: 9,
        properties: [
          {
            name: 'images',
            label: 'Select Images',
            type: 'files',
            required: true,
            accept: 'image/*',
            multiple: true,
            maxFiles: 5,
          },
        ],
      },

      // Actions
      {
        id: 'send-message',
        label: 'Send Message',
        category: 'action',
        icon: 'FiMessageSquare',
        color: '#9C27B0',
        bgColor: '#9C27B020',
        description: 'Send message to channel',
        sortOrder: 10,
        properties: [
          {
            name: 'prompt',
            label: 'Prompt',
            type: 'text',
            required: true,
            placeholder: 'Enter your prompt...',
          },
          {
            name: 'to',
            label: 'Recipient',
            type: 'string',
            required: true,
            pattern: '^.*$',
          },
          {
            name: 'message',
            label: 'Message',
            type: 'text',
            required: true,
          },
        ],
      },
      {
        id: 'ai-chat',
        label: 'AI Chat',
        category: 'action',
        icon: 'FiBot',
        color: '#00BCD4',
        bgColor: '#00BCD420',
        description: 'Chat with AI model',
        sortOrder: 20,
        isPremium: true,
        properties: [
          {
            name: 'model',
            label: 'AI Model',
            type: 'ai-model-select',
            required: true,
            default: 'openai/gpt-4o-mini',
          },
          {
            name: 'prompt',
            label: 'Prompt',
            type: 'text',
            required: true,
            placeholder: 'Enter your prompt...',
          },
          {
            name: 'temperature',
            label: 'Temperature',
            type: 'number',
            default: 0.7,
            min: 0,
            max: 2,
            step: 0.1,
          },
        ],
      },
      {
        id: 'ai-image',
        label: 'AI Image Generation',
        category: 'action',
        icon: 'FiImage',
        color: '#FF5722',
        bgColor: '#FF572220',
        description: 'Generate images with AI',
        sortOrder: 21,
        isPremium: true,
        properties: [
          {
            name: 'model',
            label: 'Model',
            type: 'ai-model-select',
            required: true,
            default: 'openai/dall-e-3',
          },
          {
            name: 'prompt',
            label: 'Prompt',
            type: 'text',
            required: true,
            placeholder: 'Describe the image you want to generate...',
          },
        ],
      },
      {
        id: 'http-request',
        label: 'HTTP Request',
        category: 'action',
        icon: 'FiGlobe',
        color: '#607D8B',
        bgColor: '#607D8B20',
        description: 'Make HTTP request',
        sortOrder: 30,
        properties: [
          {
            name: 'method',
            label: 'Method',
            type: 'select',
            required: true,
            options: [
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'DELETE', label: 'DELETE' },
              { value: 'PATCH', label: 'PATCH' },
            ],
            default: 'GET',
          },
          {
            name: 'url',
            label: 'URL',
            type: 'string',
            required: true,
            placeholder: 'https://api.example.com/endpoint',
            pattern: '^https?://.+',
          },
          {
            name: 'headers',
            label: 'Headers',
            type: 'key-value',
          },
          {
            name: 'body',
            label: 'Request Body',
            type: 'json',
            showWhen: { method: ['POST', 'PUT', 'PATCH'] },
          },
        ],
      },
      {
        id: 'database-query',
        label: 'Database Query',
        category: 'action',
        icon: 'FiDatabase',
        color: '#795548',
        bgColor: '#79554820',
        description: 'Query database',
        sortOrder: 31,
        properties: [
          {
            name: 'connection',
            label: 'Connection String',
            type: 'text',
            required: true,
          },
          {
            name: 'query',
            label: 'SQL Query',
            type: 'text',
            required: true,
            placeholder: 'SELECT * FROM users WHERE id = ?',
          },
        ],
      },

      // Logic
      {
        id: 'condition',
        label: 'Condition',
        category: 'logic',
        icon: 'FiGitBranch',
        color: '#FFC107',
        bgColor: '#FFC10720',
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
        icon: 'FiRepeat',
        color: '#CDDC39',
        bgColor: '#CDDC3920',
        description: 'Loop over items',
        sortOrder: 41,
        properties: [
          {
            name: 'items',
            label: 'Items',
            type: 'json',
            required: true,
            placeholder: 'Array of items to iterate over',
          },
        ],
      },
      {
        id: 'delay',
        label: 'Delay',
        category: 'logic',
        icon: 'FiTimer',
        color: '#009688',
        bgColor: '#00968820',
        description: 'Wait for specified time',
        sortOrder: 42,
        properties: [
          {
            name: 'duration',
            label: 'Duration (seconds)',
            type: 'number',
            required: true,
            default: 5,
            min: 1,
            max: 3600,
          },
        ],
      },

      // Transform
      {
        id: 'code',
        label: 'Code',
        category: 'transform',
        icon: 'FiCode',
        color: '#3F51B5',
        bgColor: '#3F51B520',
        description: 'Execute custom JavaScript code',
        sortOrder: 50,
        properties: [
          {
            name: 'code',
            label: 'JavaScript Code',
            type: 'text',
            required: true,
            placeholder: 'return { result: input.value * 2 }',
          },
        ],
      },
      {
        id: 'json-transform',
        label: 'JSON Transform',
        category: 'transform',
        icon: 'FiFileJson',
        color: '#673AB7',
        bgColor: '#673AB720',
        description: 'Transform JSON data',
        sortOrder: 51,
        properties: [
          {
            name: 'mapping',
            label: 'Field Mapping',
            type: 'key-value',
            required: true,
            placeholder: { key: 'sourceField', value: 'targetField' },
          },
        ],
      },

      // Messaging
      {
        id: 'receive-message',
        label: 'Receive Message',
        category: 'messaging',
        icon: 'FiInbox',
        color: '#E91E63',
        bgColor: '#E91E6320',
        description: 'Receive message from channel',
        isTrigger: true,
        sortOrder: 60,
        properties: [
          {
            name: 'channelId',
            label: 'Channel',
            type: 'channel-select',
            required: true,
            multiple: true,
          },
        ],
      },

      // Multi-Channel Social Posting - Better UX than separate nodes
      {
        id: 'multi-social-post',
        label: 'Multi-Platform Social Post',
        category: 'action',
        icon: 'FiShare2',
        color: '#7C3AED',
        bgColor: '#7C3AED20',
        description: 'Post content to multiple social media platforms at once',
        sortOrder: 25,
        properties: [
          {
            name: 'content',
            label: 'Post Content',
            type: 'text',
            required: true,
            description: 'Content to post across all selected platforms',
          },
          {
            name: 'channels',
            label: 'Select Platforms',
            type: 'channel-select',
            required: true,
            multiple: true,
            description: 'Choose which social media platforms to post to',
          },
          {
            name: 'images',
            label: 'Images',
            type: 'files',
            description: 'Upload images to attach to your post',
          },
          {
            name: 'schedule',
            label: 'Schedule Post',
            type: 'boolean',
            default: false,
            description: 'Schedule this post for later',
          },
          {
            name: 'scheduleTime',
            label: 'Schedule Time',
            type: 'string',
            showWhen: { schedule: true },
            description: 'When to post this content (ISO datetime string)',
          },
        ],
      },

      // Social Media (action category)
      {
        id: 'social-facebook-post',
        label: 'Post to Facebook',
        category: 'action',
        icon: 'SiFacebook',
        color: '#1877F2',
        bgColor: '#1877F220',
        description: 'Post content to Facebook',
        sortOrder: 70,
        properties: [
          {
            name: 'content',
            label: 'Post Content',
            type: 'text',
            required: true,
            placeholder: 'Enter your post content...',
          },
          {
            name: 'images',
            label: 'Images',
            type: 'files',
            accept: 'image/*',
            multiple: true,
          },
        ],
      },
      {
        id: 'social-instagram-post',
        label: 'Post to Instagram',
        category: 'action',
        icon: 'SiInstagram',
        color: '#E4405F',
        bgColor: '#E4405F20',
        description: 'Post content to Instagram',
        sortOrder: 71,
        properties: [
          {
            name: 'caption',
            label: 'Caption',
            type: 'text',
            required: true,
            placeholder: 'Enter your caption...',
          },
          {
            name: 'images',
            label: 'Images',
            type: 'files',
            required: true,
            accept: 'image/*',
            multiple: true,
          },
        ],
      },
      {
        id: 'social-tiktok-post',
        label: 'Post to TikTok',
        category: 'action',
        icon: 'FiMusic',
        color: '#000000',
        bgColor: '#00000020',
        description: 'Post content to TikTok',
        sortOrder: 72,
        properties: [
          {
            name: 'caption',
            label: 'Caption',
            type: 'text',
            required: true,
            placeholder: 'Enter your caption...',
          },
          {
            name: 'video',
            label: 'Video',
            type: 'file',
            required: true,
            accept: 'video/*',
          },
        ],
      },
    ];

    for (const nodeType of nodeTypes) {
      const exists = await this.repository.findOne({
        where: { id: nodeType.id },
      });

      if (!exists) {
        await this.repository.save(this.repository.create(nodeType as any));
      }
    }
  }
}
