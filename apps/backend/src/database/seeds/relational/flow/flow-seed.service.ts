import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlowEntity } from '../../../../flows/infrastructure/persistence/relational/entities/flow.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { WorkspaceEntity } from '../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

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
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
  ) { }

  async run() {
    // Get admin user to assign as owner
    const adminUser = await this.userRepository.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!adminUser) {
      console.log('Admin user not found, skipping flow seeds');
      return;
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { ownerId: adminUser.id },
    });

    if (!workspace) {
      console.log('Admin workspace not found, skipping flow seeds');
      return;
    }

    const flows = [
      {
        name: 'Video Ads Generator',
        description:
          'Tạo video quảng cáo 15 giây từ hình ảnh sản phẩm và tự động đăng lên mạng xã hội',
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
            properties: [
              {
                name: 'prompt',
                label: 'Mô tả video quảng cáo',
                type: 'text',
                placeholder:
                  'Ví dụ: Tạo video 15 giây giới thiệu túi xách nữ sang trọng, ánh sáng ban ngày, phong cách tự nhiên',
                description: 'Mô tả chi tiết cách video cần được tạo',
                required: true,
              },
              {
                name: 'images',
                label: 'Hình ảnh sản phẩm',
                type: 'files',
                accept: 'image/*',
                multiple: true,
                maxFiles: 5,
                description: 'Upload tối đa 5 hình ảnh sản phẩm',
                required: true,
              },
              {
                name: 'platforms',
                label: 'Nền tảng mạng xã hội',
                type: 'channel-select',
                multiple: true,
                default: ['facebook'],
                description: 'Chọn nền tảng để đăng video',
                required: true,
              },
            ],
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
            id: 'code-1',
            type: 'code',
            position: { x: 850, y: 100 },
            data: {
              code: 'return { success: true, message: "Video generation completed", prompt: input.prompt, images: input.images, platforms: input.platforms };',
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
            target: 'code-1',
          },
        ],
      },
      {
        name: 'SEO Content Writer',
        description:
          'Tự động viết bài chuẩn SEO với AI và đăng lên website/blog qua n8n',
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
            properties: [
              {
                name: 'topic',
                label: 'Chủ đề bài viết',
                type: 'text',
                placeholder:
                  'Ví dụ: Cách chọn túi xách phù hợp với phong cách thời trang',
                description: 'Chủ đề chính của bài viết SEO',
                required: true,
              },
              {
                name: 'keywords',
                label: 'Từ khóa SEO',
                type: 'text',
                placeholder:
                  'túi xách nữ, túi xách công sở, túi xách da thật, phong cách professional',
                description: 'Các từ khóa SEO cách nhau bởi dấu phẩy',
                required: true,
              },
              {
                name: 'tone',
                label: 'Giọng điệu',
                type: 'select',
                options: [
                  { value: 'professional', label: 'Professional' },
                  { value: 'casual', label: 'Casual' },
                  { value: 'friendly', label: 'Friendly' },
                  { value: 'expert', label: 'Expert' },
                ],
                default: 'professional',
                description: 'Phong cách viết bài',
                required: true,
              },
            ],
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
            id: 'json-1',
            type: 'json-transform',
            position: { x: 850, y: 100 },
            data: {
              mapping: {
                topic: '{{topic}}',
                keywords: '{{keywords}}',
                tone: '{{tone}}',
                content: '{{optimizedContent}}',
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
            target: 'json-1',
          },
        ],
      },
      {
        name: 'OmniPost AI - Multi-Platform Publisher',
        description:
          'Đăng nội dung đồng thời lên nhiều nền tảng mạng xã hội qua n8n automation',
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
            properties: [
              {
                name: 'content',
                label: 'Nội dung bài đăng',
                type: 'text',
                placeholder:
                  'Nhập nội dung bài đăng để đăng lên các nền tảng...',
                description:
                  'Nội dung sẽ được đăng lên tất cả nền tảng đã chọn',
                required: true,
              },
              {
                name: 'platforms',
                label: 'Nền tảng mạng xã hội',
                type: 'channel-select',
                multiple: true,
                default: ['facebook'],
                description: 'Chọn các nền tảng để đăng bài',
                required: true,
              },
              {
                name: 'media',
                label: 'Hình ảnh/Video',
                type: 'files',
                accept: 'image/*,video/*',
                multiple: true,
                maxFiles: 10,
                description: 'Upload hình ảnh hoặc video (tối đa 10 file)',
                required: false,
              },
              {
                name: 'schedule',
                label: 'Lên lịch đăng bài',
                type: 'boolean',
                default: false,
                description: 'Lên lịch đăng bài cho thời gian sau',
              },
            ],
          },
          {
            id: 'multi-social-1',
            type: 'multi-social-post',
            position: { x: 350, y: 50 },
            data: {
              channels: ['facebook'],
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
            id: 'code-2',
            type: 'code',
            position: { x: 1100, y: 100 },
            data: {
              code: 'return { success: true, message: "Multi-platform publishing completed", content: input.content, platforms: input.platforms, media: input.media, schedule: input.schedule };',
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
            target: 'code-2',
          },
        ],
      },
    ];

    for (const flowData of flows) {
      const existingFlow = await this.flowRepository.findOne({
        where: { name: flowData.name },
      });

      if (!existingFlow) {
        const flow = this.flowRepository.create({
          ...flowData,
          workspaceId: workspace.id,
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        } as any);
        await this.flowRepository.save(flow);
        console.log(`✅ Created flow: ${flowData.name}`);
      } else {
        console.log(`⭐️  Flow already exists: ${flowData.name}`);
      }
    }
  }
}
