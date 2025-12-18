import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BotEntity,
  FlowVersionEntity,
  BotKnowledgeBaseEntity,
} from './infrastructure/persistence/relational/entities/bot.entity';
import { WorkspaceMemberEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import { WorkspaceHelperService } from '../workspaces/workspace-helper.service';
import { WidgetVersionService } from './services/widget-version.service';
import { CreateBotDto } from './dto/create-bot.dto';
import {
  UpdateBotDto,
  CreateFlowVersionDto,
  LinkKnowledgeBaseDto,
} from './dto/update-bot.dto';

@Injectable()
export class BotsService {
  constructor(
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
    @InjectRepository(FlowVersionEntity)
    private flowVersionRepository: Repository<FlowVersionEntity>,
    @InjectRepository(BotKnowledgeBaseEntity)
    private botKbRepository: Repository<BotKnowledgeBaseEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private workspaceMemberRepository: Repository<WorkspaceMemberEntity>,
    private workspaceHelper: WorkspaceHelperService,
    private widgetVersionService: WidgetVersionService,
  ) { }

  async getUserDefaultWorkspace(userId: string) {
    return this.workspaceHelper.getUserDefaultWorkspace(userId);
  }

  async ensureUserHasWorkspace(userId: string) {
    return this.workspaceHelper.ensureUserHasWorkspace(userId);
  }

  async create(createDto: CreateBotDto, userId: string) {
    if (!createDto.workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    const bot = this.botRepository.create({
      ...createDto,
      createdBy: userId,
      status: createDto.status ?? 'draft',
      defaultLanguage: createDto.defaultLanguage ?? 'en',
      timezone: createDto.timezone ?? 'UTC',
    });
    const savedBot = await this.botRepository.save(bot);

    try {
      const defaultVersion = await this.widgetVersionService.createVersion(
        savedBot.id,
        {
          version: '1.0.0',
          config: {
            theme: {
              primaryColor: createDto.primaryColor || '#667eea',
              position: createDto.widgetPosition || 'bottom-right',
              buttonSize: createDto.widgetButtonSize || 'medium',
              showAvatar: createDto.showAvatar ?? true,
              showTimestamp: createDto.showTimestamp ?? true,
            },
            messages: {
              welcome:
                createDto.welcomeMessage ||
                'Xin chÃ o! TÃ´i cÃ³ thá»ƒ giÃºp gÃ¬ cho báº¡n?',
              placeholder: createDto.placeholderText || 'Nháº­p tin nháº¯n...',
              offline: 'ChÃºng tÃ´i hiá»‡n khÃ´ng trá»±c tuyáº¿n',
              errorMessage: 'ÄÃ£ cÃ³ lá»—i xáº£y ra',
            },
            behavior: {
              autoOpen: false,
              autoOpenDelay: 3000,
              greetingDelay: 1000,
            },
            features: {
              fileUpload: true,
              voiceInput: false,
              markdown: true,
              quickReplies: true,
            },
            branding: {
              showPoweredBy: true,
            },
            security: {
              allowedOrigins: createDto.allowedOrigins || ['*'],
            },
          },
          changelog: 'Initial version',
        },
        userId,
      );

      await this.widgetVersionService.publishVersion(
        savedBot.id,
        defaultVersion.id,
        userId,
      );
    } catch (error) { }

    return savedBot;
  }

  async findAll(workspaceId: string, options?: { status?: string }) {
    const query = this.botRepository
      .createQueryBuilder('bot')
      .where('bot.workspaceId = :workspaceId', { workspaceId })
      .andWhere('bot.deletedAt IS NULL');

    if (options?.status) {
      query.andWhere('bot.status = :status', { status: options.status });
    }

    return query.orderBy('bot.createdAt', 'DESC').getMany();
  }

  async findOne(id: string) {
    const bot = await this.botRepository.findOne({
      where: { id },
      relations: ['workspace', 'flowVersions', 'knowledgeBases'],
    });

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }

    return bot;
  }

  async update(id: string, updateDto: UpdateBotDto) {
    const bot = await this.findOne(id);

    // Clean up invalid UUID strings
    if (updateDto.flowId === 'undefined' || updateDto.flowId === 'null') {
      updateDto.flowId = null;
    }
    if (
      updateDto.aiProviderId === 'undefined' ||
      updateDto.aiProviderId === 'null'
    ) {
      updateDto.aiProviderId = null;
    }

    Object.assign(bot, updateDto);
    return this.botRepository.save(bot);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.botRepository.softDelete(id);
  }

  async activate(id: string) {
    return this.update(id, { status: 'active' });
  }

  async pause(id: string) {
    return this.update(id, { status: 'paused' });
  }

  async archive(id: string) {
    return this.update(id, { status: 'archived' });
  }

  async createFlowVersion(
    botId: string,
    dto: CreateFlowVersionDto,
    userId: string,
  ) {
    await this.findOne(botId);

    const latestVersion = await this.flowVersionRepository
      .createQueryBuilder('version')
      .where('version.botId = :botId', { botId })
      .orderBy('version.version', 'DESC')
      .getOne();

    const version = this.flowVersionRepository.create({
      botId,
      version: latestVersion ? latestVersion.version + 1 : 1,
      name: dto.name,
      description: dto.description,
      flow: dto.flow ?? {},
      status: 'draft',
      createdBy: userId,
      isPublished: false,
    });

    return this.flowVersionRepository.save(version);
  }

  async getFlowVersions(botId: string) {
    return this.flowVersionRepository.find({
      where: { botId },
      order: { version: 'DESC' },
    });
  }

  async getFlowVersion(botId: string, versionId: string) {
    const version = await this.flowVersionRepository.findOne({
      where: { id: versionId, botId },
    });

    if (!version) {
      throw new NotFoundException('Flow version not found');
    }

    return version;
  }

  async updateFlowVersion(
    botId: string,
    versionId: string,
    dto: CreateFlowVersionDto,
  ) {
    const version = await this.getFlowVersion(botId, versionId);

    if (version.status === 'published') {
      throw new ForbiddenException('Cannot update published version');
    }

    if (dto.name !== undefined) version.name = dto.name;
    if (dto.description !== undefined) version.description = dto.description;
    if (dto.flow !== undefined) version.flow = dto.flow;

    return this.flowVersionRepository.save(version);
  }

  async publishFlowVersion(botId: string, versionId: string) {
    const version = await this.getFlowVersion(botId, versionId);

    await this.flowVersionRepository.update(
      { botId, status: 'published' },
      { status: 'archived', isPublished: false },
    );

    version.status = 'published';
    version.isPublished = true;
    version.publishedAt = new Date();

    return this.flowVersionRepository.save(version);
  }

  async getPublishedVersion(botId: string) {
    return this.flowVersionRepository.findOne({
      where: { botId, status: 'published' },
    });
  }

  async linkKnowledgeBase(botId: string, dto: LinkKnowledgeBaseDto) {
    await this.findOne(botId);

    const existing = await this.botKbRepository.findOne({
      where: { botId, knowledgeBaseId: dto.knowledgeBaseId },
    });

    if (existing) {
      existing.priority = dto.priority ?? existing.priority;
      existing.ragSettings = dto.ragSettings ?? existing.ragSettings;
      existing.isActive = true;
      return this.botKbRepository.save(existing);
    }

    const link = this.botKbRepository.create({
      botId,
      knowledgeBaseId: dto.knowledgeBaseId,
      priority: dto.priority ?? 1,
      ragSettings: dto.ragSettings,
      isActive: true,
    });

    return this.botKbRepository.save(link);
  }

  async unlinkKnowledgeBase(botId: string, knowledgeBaseId: string) {
    await this.botKbRepository.delete({ botId, knowledgeBaseId });
  }

  async getLinkedKnowledgeBases(botId: string) {
    // First get the linking records
    const linkedRecords = await this.botKbRepository.find({
      where: { botId },
      order: { priority: 'ASC' },
    });

    // If no linked records, return empty array
    if (!linkedRecords || linkedRecords.length === 0) {
      return [];
    }

    // Get all linked KB IDs
    const kbIds = linkedRecords.map(r => r.knowledgeBaseId);

    // Use query builder to get KBs with needed fields
    const kbEntities = await this.botKbRepository.manager
      .getRepository('knowledge_base')
      .createQueryBuilder('kb')
      .where('kb.id IN (:...ids)', { ids: kbIds })
      .andWhere('kb.deletedAt IS NULL')
      .select([
        'kb.id',
        'kb.name',
        'kb.description',
        'kb.embeddingModel',
        'kb.createdAt',
        'kb.updatedAt',
      ])
      .getMany();

    // Get actual document counts for each KB
    const docCounts = await Promise.all(
      kbIds.map(async (kbId) => {
        const count = await this.botKbRepository.manager
          .getRepository('kb_document')
          .createQueryBuilder('doc')
          .where('doc.knowledgeBaseId = :kbId', { kbId })
          .andWhere('doc.deletedAt IS NULL')
          .select('COUNT(doc.id)', 'count')
          .getRawOne();
        return { kbId, count: parseInt(count?.count || '0') };
      })
    );

    const docCountMap = new Map();
    docCounts.forEach(({ kbId, count }) => {
      docCountMap.set(kbId, count);
    });

    // Create a map for easy lookup
    const kbMap = new Map();
    kbEntities.forEach(kb => {
      kbMap.set(kb.id, {
        id: kb.id,
        name: kb.name,
        description: kb.description,
        totalDocuments: docCountMap.get(kb.id) || 0,
        embeddingModel: kb.embeddingModel,
        createdAt: kb.createdAt,
        updatedAt: kb.updatedAt,
      });
    });

    // Merge the data
    return linkedRecords.map(record => ({
      id: `${record.botId}-${record.knowledgeBaseId}`,
      botId: record.botId,
      knowledgeBaseId: record.knowledgeBaseId,
      priority: record.priority,
      ragSettings: record.ragSettings,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.createdAt, // No updatedAt in entity, use createdAt
      knowledgeBase: kbMap.get(record.knowledgeBaseId) || null,
    }));
  }

  async toggleKnowledgeBase(
    botId: string,
    knowledgeBaseId: string,
    isActive: boolean,
  ) {
    const link = await this.botKbRepository.findOne({
      where: { botId, knowledgeBaseId },
    });

    if (!link) {
      throw new NotFoundException('Knowledge base link not found');
    }

    link.isActive = isActive;
    return this.botKbRepository.save(link);
  }

  async duplicate(id: string, userId: string, newName?: string) {
    const bot = await this.findOne(id);

    const newBot = this.botRepository.create({
      ...bot,
      id: undefined,
      name: newName ?? `${bot.name} (Copy)`,
      status: 'draft',
      createdBy: userId,
      createdAt: undefined,
      updatedAt: undefined,
      deletedAt: undefined,
    });

    return this.botRepository.save(newBot);
  }

  async getBotChannels(botId: string) {
    await this.findOne(botId);
    const { ChannelEntity } = await import(
      '../channels/infrastructure/persistence/relational/entities/channel.entity'
    );
    const channelRepo = this.botRepository.manager.getRepository(ChannelEntity);
    return channelRepo.find({
      where: { botId },
      order: { createdAt: 'DESC' },
    });
  }

  async createBotChannel(
    botId: string,
    dto: { type: string; name: string; config?: Record<string, any> },
    userId: string,
  ) {
    await this.findOne(botId);
    const { ChannelEntity } = await import(
      '../channels/infrastructure/persistence/relational/entities/channel.entity'
    );
    const channelRepo = this.botRepository.manager.getRepository(ChannelEntity);

    const channel = channelRepo.create({
      botId,
      type: dto.type,
      name: dto.name,
      config: dto.config,
      isActive: true,
      createdBy: userId,
    });

    return channelRepo.save(channel);
  }

  async updateBotChannel(
    botId: string,
    channelId: string,
    dto: { name?: string; config?: Record<string, any>; isActive?: boolean },
  ) {
    const { ChannelEntity } = await import(
      '../channels/infrastructure/persistence/relational/entities/channel.entity'
    );
    const channelRepo = this.botRepository.manager.getRepository(ChannelEntity);

    const channel = await channelRepo.findOne({
      where: { id: channelId, botId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    Object.assign(channel, dto);
    return channelRepo.save(channel);
  }

  async deleteBotChannel(botId: string, channelId: string) {
    const { ChannelEntity } = await import(
      '../channels/infrastructure/persistence/relational/entities/channel.entity'
    );
    const channelRepo = this.botRepository.manager.getRepository(ChannelEntity);

    const channel = await channelRepo.findOne({
      where: { id: channelId, botId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await channelRepo.remove(channel);
  }

  async toggleBotChannel(botId: string, channelId: string, isActive: boolean) {
    return this.updateBotChannel(botId, channelId, { isActive });
  }

  async updateAppearance(
    botId: string,
    appearance: {
      primaryColor?: string;
      backgroundColor?: string;
      botMessageColor?: string;
      botMessageTextColor?: string;
      fontFamily?: string;
      position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
      buttonSize?: 'small' | 'medium' | 'large';
      showAvatar?: boolean;
      showTimestamp?: boolean;
      welcomeMessage?: string;
      placeholderText?: string;
    },
    userId: string,
  ) {
    await this.findOne(botId);

    const configUpdate: any = {};

    if (
      appearance.primaryColor ||
      appearance.backgroundColor ||
      appearance.botMessageColor ||
      appearance.botMessageTextColor ||
      appearance.fontFamily ||
      appearance.position ||
      appearance.buttonSize ||
      appearance.showAvatar !== undefined ||
      appearance.showTimestamp !== undefined
    ) {
      configUpdate.theme = {};
      if (appearance.primaryColor)
        configUpdate.theme.primaryColor = appearance.primaryColor;
      if (appearance.backgroundColor)
        configUpdate.theme.backgroundColor = appearance.backgroundColor;
      if (appearance.botMessageColor)
        configUpdate.theme.botMessageColor = appearance.botMessageColor;
      if (appearance.botMessageTextColor)
        configUpdate.theme.botMessageTextColor = appearance.botMessageTextColor;
      if (appearance.fontFamily)
        configUpdate.theme.fontFamily = appearance.fontFamily;
      if (appearance.position)
        configUpdate.theme.position = appearance.position;
      if (appearance.buttonSize)
        configUpdate.theme.buttonSize = appearance.buttonSize;
      if (appearance.showAvatar !== undefined)
        configUpdate.theme.showAvatar = appearance.showAvatar;
      if (appearance.showTimestamp !== undefined)
        configUpdate.theme.showTimestamp = appearance.showTimestamp;
    }

    if (appearance.welcomeMessage || appearance.placeholderText) {
      configUpdate.messages = {};
      if (appearance.welcomeMessage)
        configUpdate.messages.welcome = appearance.welcomeMessage;
      if (appearance.placeholderText)
        configUpdate.messages.placeholder = appearance.placeholderText;
    }

    const changelog = 'Updated appearance settings';

    return this.widgetVersionService.updateActiveVersionConfig(
      botId,
      configUpdate,
      userId,
      changelog,
    );
  }

  async getAppearance(botId: string) {
    await this.findOne(botId);

    const activeVersion =
      await this.widgetVersionService.getActiveVersion(botId);

    if (!activeVersion) {
      throw new NotFoundException('No active widget version found');
    }

    return {
      primaryColor: activeVersion.config.theme?.primaryColor || '#667eea',
      backgroundColor: activeVersion.config.theme?.backgroundColor || '#ffffff',
      botMessageColor: activeVersion.config.theme?.botMessageColor || '#f9fafb',
      botMessageTextColor:
        activeVersion.config.theme?.botMessageTextColor || '#1f2937',
      fontFamily:
        activeVersion.config.theme?.fontFamily ||
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
      position: activeVersion.config.theme?.position || 'bottom-right',
      buttonSize: activeVersion.config.theme?.buttonSize || 'medium',
      showAvatar: activeVersion.config.theme?.showAvatar ?? true,
      showTimestamp: activeVersion.config.theme?.showTimestamp ?? true,
      welcomeMessage:
        activeVersion.config.messages?.welcome ||
        'Xin chÃ o! TÃ´i cÃ³ thá»ƒ giÃºp gÃ¬ cho báº¡n?',
      placeholderText:
        activeVersion.config.messages?.placeholder || 'Nháº­p tin nháº¯n...',
    };
  }
}
