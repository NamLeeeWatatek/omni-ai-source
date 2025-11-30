import { Injectable } from '@nestjs/common';
import { Template, TemplateCategory } from './domain/template';
import { TemplateRepository } from './infrastructure/persistence/relational/repositories/template.repository';

@Injectable()
export class TemplatesService {
  constructor(private readonly templateRepository: TemplateRepository) {}

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
