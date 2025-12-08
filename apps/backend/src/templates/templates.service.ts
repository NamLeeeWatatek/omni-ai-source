import { Injectable } from '@nestjs/common';
import { Template, TemplateCategory } from './domain/template';
import { TemplateRepository } from './infrastructure/persistence/relational/repositories/template.repository';

@Injectable()
export class TemplatesService {
  constructor(private readonly templateRepository: TemplateRepository) { }

  private readonly templates: Template[] = [
    {
      id: 'welcome-message',
      name: 'Welcome Message Automation',
      description: 'Automatically send welcome message to new users',
      category: 'messaging',
      tags: ['messaging', 'automation', 'onboarding'],
      isPremium: false,
      usageCount: 1250,
      nodes: [
        {
          id: 'trigger-1',
          type: 'webhook',
          position: { x: 100, y: 100 },
          data: {
            label: 'New User Webhook',
            method: 'POST',
            path: '/webhook/new-user',
          },
        },
        {
          id: 'message-1',
          type: 'send-message',
          position: { x: 400, y: 100 },
          data: {
            label: 'Send Welcome Message',
            message: 'Welcome to our platform! 👋',
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'trigger-1',
          target: 'message-1',
        },
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'ai-customer-support',
      name: 'AI Customer Support Bot',
      description: 'AI-powered customer support with automatic responses',
      category: 'ai',
      tags: ['ai', 'customer-support', 'chatbot'],
      isPremium: true,
      usageCount: 850,
      nodes: [
        {
          id: 'trigger-1',
          type: 'receive-message',
          position: { x: 100, y: 100 },
          data: {
            label: 'Receive Customer Message',
          },
        },
        {
          id: 'ai-1',
          type: 'ai-chat',
          position: { x: 400, y: 100 },
          data: {
            label: 'AI Response',
            model: 'gpt-4',
            prompt:
              'You are a helpful customer support agent. Answer the following question: {{input.message}}',
          },
        },
        {
          id: 'message-1',
          type: 'send-message',
          position: { x: 700, y: 100 },
          data: {
            label: 'Send AI Response',
            message: '{{ai.response}}',
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'trigger-1',
          target: 'ai-1',
        },
        {
          id: 'e2',
          source: 'ai-1',
          target: 'message-1',
        },
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'daily-report',
      name: 'Daily Analytics Report',
      description: 'Generate and send daily analytics report',
      category: 'analytics',
      tags: ['analytics', 'reporting', 'automation'],
      isPremium: false,
      usageCount: 620,
      nodes: [
        {
          id: 'trigger-1',
          type: 'schedule',
          position: { x: 100, y: 100 },
          data: {
            label: 'Daily at 9 AM',
            interval: 'cron',
            cronExpression: '0 9 * * *',
          },
        },
        {
          id: 'data-1',
          type: 'database-query',
          position: { x: 400, y: 100 },
          data: {
            label: 'Fetch Analytics',
            query: 'SELECT * FROM analytics WHERE date = CURRENT_DATE',
          },
        },
        {
          id: 'transform-1',
          type: 'json-transform',
          position: { x: 700, y: 100 },
          data: {
            label: 'Format Report',
          },
        },
        {
          id: 'message-1',
          type: 'send-message',
          position: { x: 1000, y: 100 },
          data: {
            label: 'Send Report',
            message: 'Daily Report:\n{{report}}',
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'trigger-1',
          target: 'data-1',
        },
        {
          id: 'e2',
          source: 'data-1',
          target: 'transform-1',
        },
        {
          id: 'e3',
          source: 'transform-1',
          target: 'message-1',
        },
      ],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
    },
    {
      id: 'content-moderation',
      name: 'AI Content Moderation',
      description: 'Automatically moderate user-generated content with AI',
      category: 'ai',
      tags: ['ai', 'moderation', 'safety'],
      isPremium: true,
      usageCount: 450,
      nodes: [
        {
          id: 'trigger-1',
          type: 'receive-message',
          position: { x: 100, y: 100 },
          data: {
            label: 'New Content',
          },
        },
        {
          id: 'ai-1',
          type: 'ai-chat',
          position: { x: 400, y: 100 },
          data: {
            label: 'Check Content',
            model: 'gpt-4',
            prompt:
              'Analyze if this content is appropriate: {{input.content}}. Return JSON with {safe: boolean, reason: string}',
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 700, y: 100 },
          data: {
            label: 'Is Safe?',
            conditions: [{ field: 'ai.safe', operator: 'equals', value: true }],
          },
        },
        {
          id: 'message-1',
          type: 'send-message',
          position: { x: 1000, y: 50 },
          data: {
            label: 'Approve Content',
            message: 'Content approved ✅',
          },
        },
        {
          id: 'message-2',
          type: 'send-message',
          position: { x: 1000, y: 200 },
          data: {
            label: 'Reject Content',
            message: 'Content rejected: {{ai.reason}}',
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'trigger-1',
          target: 'ai-1',
        },
        {
          id: 'e2',
          source: 'ai-1',
          target: 'condition-1',
        },
        {
          id: 'e3',
          source: 'condition-1',
          target: 'message-1',
          sourceHandle: 'true',
        },
        {
          id: 'e4',
          source: 'condition-1',
          target: 'message-2',
          sourceHandle: 'false',
        },
      ],
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10'),
    },
    {
      id: 'lead-enrichment',
      name: 'Lead Enrichment Pipeline',
      description: 'Enrich lead data from multiple sources',
      category: 'data',
      tags: ['data', 'crm', 'automation'],
      isPremium: false,
      usageCount: 380,
      nodes: [
        {
          id: 'trigger-1',
          type: 'webhook',
          position: { x: 100, y: 100 },
          data: {
            label: 'New Lead',
            method: 'POST',
            path: '/webhook/new-lead',
          },
        },
        {
          id: 'http-1',
          type: 'http-request',
          position: { x: 400, y: 100 },
          data: {
            label: 'Fetch Company Data',
            method: 'GET',
            url: 'https://api.clearbit.com/v2/companies/find?domain={{input.email}}',
          },
        },
        {
          id: 'http-2',
          type: 'http-request',
          position: { x: 700, y: 100 },
          data: {
            label: 'Fetch Social Data',
            method: 'GET',
            url: 'https://api.fullcontact.com/v3/person.enrich',
          },
        },
        {
          id: 'transform-1',
          type: 'json-transform',
          position: { x: 1000, y: 100 },
          data: {
            label: 'Merge Data',
          },
        },
        {
          id: 'db-1',
          type: 'database-query',
          position: { x: 1300, y: 100 },
          data: {
            label: 'Save to CRM',
            query:
              'INSERT INTO leads (email, company, social) VALUES (?, ?, ?)',
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'trigger-1',
          target: 'http-1',
        },
        {
          id: 'e2',
          source: 'http-1',
          target: 'http-2',
        },
        {
          id: 'e3',
          source: 'http-2',
          target: 'transform-1',
        },
        {
          id: 'e4',
          source: 'transform-1',
          target: 'db-1',
        },
      ],
      createdAt: new Date('2024-02-20'),
      updatedAt: new Date('2024-02-20'),
    },
    {
      id: 'social-media-scheduler',
      name: 'Social Media Post Scheduler',
      description: 'Schedule and post content across multiple platforms',
      category: 'social',
      tags: ['social-media', 'scheduling', 'marketing'],
      isPremium: false,
      usageCount: 720,
      nodes: [
        {
          id: 'trigger-1',
          type: 'schedule',
          position: { x: 100, y: 100 },
          data: {
            label: 'Daily at 10 AM',
            interval: 'cron',
            cronExpression: '0 10 * * *',
          },
        },
        {
          id: 'db-1',
          type: 'database-query',
          position: { x: 400, y: 100 },
          data: {
            label: 'Get Scheduled Posts',
            query:
              'SELECT * FROM scheduled_posts WHERE post_date = CURRENT_DATE',
          },
        },
        {
          id: 'loop-1',
          type: 'loop',
          position: { x: 700, y: 100 },
          data: {
            label: 'For Each Post',
          },
        },
        {
          id: 'http-1',
          type: 'http-request',
          position: { x: 1000, y: 100 },
          data: {
            label: 'Post to Platform',
            method: 'POST',
            url: '{{item.platform_api_url}}',
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'trigger-1',
          target: 'db-1',
        },
        {
          id: 'e2',
          source: 'db-1',
          target: 'loop-1',
        },
        {
          id: 'e3',
          source: 'loop-1',
          target: 'http-1',
        },
      ],
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
    },

    // === NEW INTEGRATION TEMPLATES ===
    {
      id: 'n8n-integration',
      name: 'n8n Workflow Integration',
      description: 'Connect to n8n workflows and process returned data',
      category: 'integration',
      tags: ['n8n', 'webhook', 'automation', 'integration'],
      isPremium: false,
      usageCount: 520,
      nodes: [
        {
          id: 'trigger-1',
          type: 'manual',
          position: { x: 100, y: 200 },
          data: {
            label: 'Start Trigger',
          },
        },
        {
          id: 'webhook-1',
          type: 'webhook-trigger',
          position: { x: 400, y: 200 },
          data: {
            label: 'Call n8n Webhook',
            webhookUrl: 'https://your-n8n.example.com/webhook/xxx',
            method: 'POST',
            payloadType: 'json',
            payload: {
              action: '{{action}}',
              data: '{{$input}}',
            },
            authentication: {
              type: 'bearer',
              token: '{{n8n_token}}',
            },
            timeout: 30000,
            retryCount: 2,
          },
        },
        {
          id: 'handler-1',
          type: 'response-handler',
          position: { x: 700, y: 200 },
          data: {
            label: 'Process Response',
            extractPaths: [
              { key: 'status', path: 'data.status' },
              { key: 'result', path: 'data.result' },
            ],
            conditions: [
              { name: 'success', field: 'status', operator: 'equals', value: 'success' },
              { name: 'error', field: 'status', operator: 'equals', value: 'error' },
            ],
          },
        },
        {
          id: 'message-1',
          type: 'send-message',
          position: { x: 1000, y: 150 },
          data: {
            label: 'Send Success Notification',
            message: '✅ n8n workflow completed: {{result}}',
          },
        },
        {
          id: 'message-2',
          type: 'send-message',
          position: { x: 1000, y: 300 },
          data: {
            label: 'Send Error Notification',
            message: '❌ n8n workflow failed: {{error}}',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'webhook-1' },
        { id: 'e2', source: 'webhook-1', target: 'handler-1' },
        { id: 'e3', source: 'handler-1', target: 'message-1', sourceHandle: 'success' },
        { id: 'e4', source: 'handler-1', target: 'message-2', sourceHandle: 'error' },
      ],
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2024-03-15'),
    },
    {
      id: 'multi-api-sync',
      name: 'Multi-API Data Sync Pipeline',
      description: 'Fetch data from multiple APIs, transform and sync to destination',
      category: 'integration',
      tags: ['api', 'sync', 'etl', 'data-pipeline'],
      isPremium: true,
      usageCount: 380,
      nodes: [
        {
          id: 'trigger-1',
          type: 'schedule',
          position: { x: 100, y: 200 },
          data: {
            label: 'Daily Sync at 2 AM',
            interval: 'cron',
            cronExpression: '0 2 * * *',
          },
        },
        {
          id: 'api-1',
          type: 'api-connector',
          position: { x: 400, y: 100 },
          data: {
            label: 'Fetch from Source API',
            baseUrl: 'https://api.source.com',
            endpoint: '/v1/data',
            method: 'GET',
            auth: {
              type: 'api-key',
              name: 'X-API-Key',
              value: '{{SOURCE_API_KEY}}',
              in: 'header',
            },
            pagination: {
              enabled: true,
              type: 'page',
              pageParam: 'page',
              limitParam: 'per_page',
              limit: 100,
              maxPages: 10,
              dataPath: 'data.items',
            },
            extractPath: 'data.items',
          },
        },
        {
          id: 'api-2',
          type: 'api-connector',
          position: { x: 400, y: 300 },
          data: {
            label: 'Fetch from CRM API',
            baseUrl: 'https://api.crm.com',
            endpoint: '/contacts',
            method: 'GET',
            auth: {
              type: 'bearer',
              token: '{{CRM_TOKEN}}',
            },
            extractPath: 'contacts',
          },
        },
        {
          id: 'handler-1',
          type: 'response-handler',
          position: { x: 700, y: 200 },
          data: {
            label: 'Merge & Transform Data',
            transformations: [
              { type: 'pick', fields: 'id, name, email, status' },
              { type: 'rename', mapping: { 'status': 'sync_status' } },
            ],
            filters: [
              { field: 'status', operator: 'notEquals', value: 'deleted' },
            ],
          },
        },
        {
          id: 'webhook-1',
          type: 'webhook-trigger',
          position: { x: 1000, y: 200 },
          data: {
            label: 'Sync to Destination',
            webhookUrl: 'https://api.destination.com/sync',
            method: 'POST',
            payload: {
              records: '{{data}}',
              syncedAt: '{{$now}}',
            },
            authentication: {
              type: 'bearer',
              token: '{{DEST_TOKEN}}',
            },
          },
        },
        {
          id: 'message-1',
          type: 'send-message',
          position: { x: 1300, y: 200 },
          data: {
            label: 'Send Sync Report',
            message: '📊 Data sync completed! Synced {{itemCount}} records.',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'api-1' },
        { id: 'e2', source: 'trigger-1', target: 'api-2' },
        { id: 'e3', source: 'api-1', target: 'handler-1' },
        { id: 'e4', source: 'api-2', target: 'handler-1' },
        { id: 'e5', source: 'handler-1', target: 'webhook-1' },
        { id: 'e6', source: 'webhook-1', target: 'message-1' },
      ],
      createdAt: new Date('2024-03-20'),
      updatedAt: new Date('2024-03-20'),
    },
    {
      id: 'zapier-make-connector',
      name: 'Zapier/Make Universal Connector',
      description: 'Connect to Zapier Webhooks or Make (Integromat) scenarios',
      category: 'integration',
      tags: ['zapier', 'make', 'integromat', 'webhook'],
      isPremium: false,
      usageCount: 690,
      nodes: [
        {
          id: 'trigger-1',
          type: 'webhook',
          position: { x: 100, y: 200 },
          data: {
            label: 'Incoming Webhook',
            method: 'POST',
            path: '/webhook/integration-trigger',
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 400, y: 200 },
          data: {
            label: 'Route by Platform',
            conditions: [
              { field: 'platform', operator: 'equals', value: 'zapier' },
              { field: 'platform', operator: 'equals', value: 'make' },
            ],
          },
        },
        {
          id: 'webhook-zapier',
          type: 'webhook-trigger',
          position: { x: 700, y: 100 },
          data: {
            label: 'Call Zapier Webhook',
            webhookUrl: '{{zapier_webhook_url}}',
            method: 'POST',
            payloadType: 'json',
          },
        },
        {
          id: 'webhook-make',
          type: 'webhook-trigger',
          position: { x: 700, y: 300 },
          data: {
            label: 'Call Make Scenario',
            webhookUrl: '{{make_webhook_url}}',
            method: 'POST',
            payloadType: 'json',
          },
        },
        {
          id: 'handler-1',
          type: 'response-handler',
          position: { x: 1000, y: 200 },
          data: {
            label: 'Process Response',
            extractPaths: [
              { key: 'status', path: '_meta.statusCode' },
              { key: 'result', path: 'data' },
            ],
            outputFormat: 'object',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'condition-1' },
        { id: 'e2', source: 'condition-1', target: 'webhook-zapier', sourceHandle: 'zapier' },
        { id: 'e3', source: 'condition-1', target: 'webhook-make', sourceHandle: 'make' },
        { id: 'e4', source: 'webhook-zapier', target: 'handler-1' },
        { id: 'e5', source: 'webhook-make', target: 'handler-1' },
      ],
      createdAt: new Date('2024-04-01'),
      updatedAt: new Date('2024-04-01'),
    },
  ];

  private readonly categories: TemplateCategory[] = [
    {
      id: 'messaging',
      name: 'Messaging',
      description: 'Message automation and communication workflows',
      icon: 'MessageSquare',
    },
    {
      id: 'ai',
      name: 'AI & ML',
      description: 'AI-powered workflows and machine learning',
      icon: 'Bot',
    },
    {
      id: 'integration',
      name: 'Integrations',
      description: 'Connect with third-party services, APIs and webhooks',
      icon: 'Plug',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Data analytics and reporting workflows',
      icon: 'BarChart',
    },
    {
      id: 'data',
      name: 'Data Processing',
      description: 'Data transformation and integration',
      icon: 'Database',
    },
    {
      id: 'social',
      name: 'Social Media',
      description: 'Social media management and automation',
      icon: 'Share2',
    },
  ];

  async findAll(category?: string): Promise<Template[]> {
    return this.templateRepository.findAll(category);
  }

  async findOne(id: string): Promise<Template | null> {
    return this.templateRepository.findOne(id);
  }

  getCategories(): TemplateCategory[] {
    return this.categories;
  }

  async search(query: string): Promise<Template[]> {
    return this.templateRepository.search(query);
  }

  async useTemplate(id: string): Promise<void> {
    await this.templateRepository.incrementUsage(id);
  }
}
