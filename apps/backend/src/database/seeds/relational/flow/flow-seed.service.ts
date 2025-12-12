import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlowEntity } from '../../../../flows/infrastructure/persistence/relational/entities/flow.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

// React Icons mapping for consistency
const ICONS = {
  VideoAds: 'FiVideo',
  EditText: 'FiEdit3',
  Smartphone: 'FiSmartphone',
} as const;

@Injectable()
export class FlowSeedService {
  constructor(
    @InjectRepository(FlowEntity)
    private flowRepository: Repository<FlowEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run() {
    // Get admin user to assign as owner
    const adminUser = await this.userRepository.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!adminUser) {
      console.log('Admin user not found, skipping flow seeds');
      return;
    }

    const flows = [
      {
        name: 'Video Ads Generator',
        description:
          'Táº¡o video quáº£ng cÃ¡o 15 giÃ¢y tá»« hÃ¬nh áº£nh sáº£n pháº©m vÃ  tá»± Ä‘á»™ng Ä‘Äƒng lÃªn máº¡ng xÃ£ há»™i',
        status: 'published',
        published: true,
        visibility: 'public',
        ownerId: adminUser.id,
        tags: ['ugc-factory', 'video', 'ads', 'social-media', 'n8n'],
        category: 'ugc-factory',
        icon: ICONS.VideoAds,
        nodes: [
          {
            id: 'trigger-1',
            type: 'manual',
            position: { x: 100, y: 100 },
            data: {},
          },
          {
            id: 'ai-image-1',
            type: 'ai-image',
            position: { x: 350, y: 50 },
            data: {
              model: 'dall-e-3',
              prompt: 'Create AI video content based on user specifications',
            },
          },
          {
            id: 'multi-social-1',
            type: 'multi-social-post',
            position: { x: 600, y: 100 },
            data: {
              channels: ['facebook', 'instagram'],
              content: 'AI-generated video ad content',
              images: ['video_placeholder.jpg'],
            },
          },
          {
            id: 'http-1',
            type: 'http-request',
            position: { x: 850, y: 100 },
            data: {
              method: 'POST',
              url: 'https://n8n.srv1078465.hstgr.cloud/webhook/wh-generate-video-ugc-ads-autopost-social',
              headers: {
                'Content-Type': 'application/json',
              },
              body: {
                prompt: '{{prompt}}',
                images: '{{images}}',
                platforms: '{{platforms}}',
              },
            },
          },
        ],
        edges: [
          {
            id: 'e1-2',
            source: 'trigger-1',
            target: 'ai-image-1',
          },
          {
            id: 'e2-3',
            source: 'ai-image-1',
            target: 'multi-social-1',
          },
          {
            id: 'e3-4',
            source: 'multi-social-1',
            target: 'http-1',
          },
        ],
        properties: [
          {
            name: 'prompt',
            label: 'MÃ´ táº£ video quáº£ng cÃ¡o',
            type: 'textarea',
            placeholder:
              'VÃ­ dá»¥: Táº¡o video 15 giÃ¢y giá»›i thiá»‡u tÃºi xÃ¡ch ná»¯ sang trá»ng, Ã¡nh sÃ¡ng ban ngÃ y, phong cÃ¡ch tá»± nhiÃªn',
            description: 'MÃ´ táº£ chi tiáº¿t cÃ¡ch video cáº§n Ä‘Æ°á»£c táº¡o',
            required: true,
          },
          {
            name: 'images',
            label: 'HÃ¬nh áº£nh sáº£n pháº©m',
            type: 'files',
            accept: 'image/*',
            multiple: true,
            maxFiles: 5,
            description: 'Upload tá»‘i Ä‘a 5 hÃ¬nh áº£nh sáº£n pháº©m',
            required: true,
          },
          {
            name: 'platforms',
            label: 'Ná»n táº£ng máº¡ng xÃ£ há»™i',
            type: 'multi-select',
            options: [
              { value: 'facebook', label: 'Facebook' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'tiktok', label: 'TikTok' },
            ],
            default: ['facebook'],
            description: 'Chá»n ná»n táº£ng Ä‘á»ƒ Ä‘Äƒng video',
            required: true,
          },
        ],
      },
      {
        name: 'SEO Content Writer',
        description:
          'Tá»± Ä‘á»™ng viáº¿t bÃ i chuáº©n SEO vá»›i AI vÃ  Ä‘Äƒng lÃªn website/blog qua n8n',
        status: 'published',
        published: true,
        visibility: 'public',
        ownerId: adminUser.id,
        tags: ['ugc-factory', 'seo', 'content', 'ai', 'blogging', 'n8n'],
        category: 'ugc-factory',
        icon: ICONS.EditText,
        nodes: [
          {
            id: 'trigger-1',
            type: 'manual',
            position: { x: 100, y: 100 },
            data: {},
          },
          {
            id: 'ai-chat-1',
            type: 'ai-chat',
            position: { x: 350, y: 50 },
            data: {
              model: 'gemini-2.5-flash',
              prompt: 'Write SEO-optimized content based on topic and keywords',
            },
          },
          {
            id: 'code-1',
            type: 'code',
            position: { x: 600, y: 100 },
            data: {
              code: 'return { optimizedContent: input.content };',
            },
          },
          {
            id: 'http-1',
            type: 'http-request',
            position: { x: 850, y: 100 },
            data: {
              method: 'POST',
              url: 'https://n8n.srv1078465.hstgr.cloud/webhook/seo-content-writer',
              headers: {
                'Content-Type': 'application/json',
              },
              body: {
                topic: '{{topic}}',
                keywords: '{{keywords}}',
                tone: '{{tone}}',
              },
            },
          },
        ],
        edges: [
          {
            id: 'e1-2',
            source: 'trigger-1',
            target: 'ai-chat-1',
          },
          {
            id: 'e2-3',
            source: 'ai-chat-1',
            target: 'code-1',
          },
          {
            id: 'e3-4',
            source: 'code-1',
            target: 'http-1',
          },
        ],
        properties: [
          {
            name: 'topic',
            label: 'Chá»§ Ä‘á» bÃ i viáº¿t',
            type: 'text',
            placeholder:
              'VÃ­ dá»¥: CÃ¡ch chá»n tÃºi xÃ¡ch phÃ¹ há»£p vá»›i phong cÃ¡ch thá»i trang',
            description: 'Chá»§ Ä‘á» chÃ­nh cá»§a bÃ i viáº¿t SEO',
            required: true,
          },
          {
            name: 'keywords',
            label: 'Tá»« khÃ³a SEO',
            type: 'text',
            placeholder:
              'tÃºi xÃ¡ch ná»¯, tÃºi xÃ¡ch cÃ´ng sá»Ÿ, tÃºi xÃ¡ch da tháº­t, phong cÃ¡ch professional',
            description: 'CÃ¡c tá»« khÃ³a SEO cÃ¡ch nhau bá»Ÿi dáº¥u pháº©y',
            required: true,
          },
          {
            name: 'tone',
            label: 'Giá»ng Ä‘iá»‡u',
            type: 'select',
            options: [
              { value: 'professional', label: 'Professional' },
              { value: 'casual', label: 'Casual' },
              { value: 'friendly', label: 'Friendly' },
              { value: 'expert', label: 'Expert' },
            ],
            default: 'professional',
            description: 'Phong cÃ¡ch viáº¿t bÃ i',
            required: true,
          },
        ],
      },
      {
        name: 'OmniPost AI - Multi-Platform Publisher',
        description:
          'ÄÄƒng ná»™i dung Ä‘á»“ng thá»i lÃªn nhiá»u ná»n táº£ng máº¡ng xÃ£ há»™i qua n8n automation',
        status: 'published',
        published: true,
        visibility: 'public',
        ownerId: adminUser.id,
        tags: [
          'social-media',
          'multi-platform',
          'automation',
          'omnipost',
          'n8n',
        ],
        category: 'ugc-factory',
        icon: ICONS.Smartphone,
        nodes: [
          {
            id: 'trigger-1',
            type: 'manual',
            position: { x: 100, y: 100 },
            data: {},
          },
          {
            id: 'multi-social-1',
            type: 'multi-social-post',
            position: { x: 350, y: 50 },
            data: {
              channels: ['facebook', 'instagram', 'tiktok'],
              content: '{{content}}',
              images: '{{media}}',
            },
          },
          {
            id: 'delay-1',
            type: 'delay',
            position: { x: 600, y: 100 },
            data: {
              duration: 2,
            },
          },
          {
            id: 'social-facebook-1',
            type: 'social-facebook-post',
            position: { x: 850, y: 150 },
            data: {
              content: '{{content}}',
              images: '{{media}}',
            },
          },
          {
            id: 'http-1',
            type: 'http-request',
            position: { x: 1100, y: 100 },
            data: {
              method: 'POST',
              url: 'https://n8n.srv1078465.hstgr.cloud/webhook/omnipost-ai-publisher',
              headers: {
                'Content-Type': 'application/json',
              },
              body: {
                content: '{{content}}',
                platforms: '{{platforms}}',
                media: '{{media}}',
                schedule: '{{schedule}}',
              },
            },
          },
        ],
        edges: [
          {
            id: 'e1-2',
            source: 'trigger-1',
            target: 'multi-social-1',
          },
          {
            id: 'e2-3',
            source: 'multi-social-1',
            target: 'delay-1',
          },
          {
            id: 'e3-4',
            source: 'delay-1',
            target: 'social-facebook-1',
          },
          {
            id: 'e4-5',
            source: 'social-facebook-1',
            target: 'http-1',
          },
        ],
        properties: [
          {
            name: 'content',
            label: 'Ná»™i dung bÃ i Ä‘Äƒng',
            type: 'textarea',
            placeholder:
              'Nháº­p ná»™i dung bÃ i Ä‘Äƒng Ä‘á»ƒ Ä‘Äƒng lÃªn cÃ¡c ná»n táº£ng...',
            description:
              'Ná»™i dung sáº½ Ä‘Æ°á»£c Ä‘Äƒng lÃªn táº¥t cáº£ ná»n táº£ng Ä‘Ã£ chá»n',
            required: true,
          },
          {
            name: 'platforms',
            label: 'Ná»n táº£ng máº¡ng xÃ£ há»™i',
            type: 'multi-select',
            options: [
              { value: 'facebook', label: 'Facebook' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'tiktok', label: 'TikTok' },
              { value: 'twitter', label: 'Twitter/X' },
            ],
            default: ['facebook', 'instagram'],
            description: 'Chá»n cÃ¡c ná»n táº£ng Ä‘á»ƒ Ä‘Äƒng bÃ i',
            required: true,
          },
          {
            name: 'media',
            label: 'HÃ¬nh áº£nh/Video',
            type: 'files',
            accept: 'image/*,video/*',
            multiple: true,
            maxFiles: 10,
            description: 'Upload hÃ¬nh áº£nh hoáº·c video (tá»‘i Ä‘a 10 file)',
            required: false,
          },
          {
            name: 'schedule',
            label: 'LÃªn lá»‹ch Ä‘Äƒng bÃ i',
            type: 'boolean',
            default: false,
            description: 'LÃªn lá»‹ch Ä‘Äƒng bÃ i cho thá»i gian sau',
          },
        ],
      },
    ];

    for (const flowData of flows) {
      const existingFlow = await this.flowRepository.findOne({
        where: { name: flowData.name },
      });

      if (!existingFlow) {
        const flow = this.flowRepository.create(flowData);
        await this.flowRepository.save(flow);
        console.log(`âœ… Created flow: ${flowData.name}`);
      } else {
        console.log(`â­ï¸  Flow already exists: ${flowData.name}`);
      }
    }
  }
}
