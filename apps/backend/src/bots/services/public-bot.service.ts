import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotEntity } from '../infrastructure/persistence/relational/entities/bot.entity';
import { WidgetVersionEntity } from '../infrastructure/persistence/relational/entities/widget-version.entity';
import {
  ConversationEntity,
  MessageEntity,
} from '../../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import {
  CreatePublicConversationDto,
  AddPublicMessageDto,
  BotConfigResponseDto,
  CreateConversationResponseDto,
  MessageResponseDto,
  ConversationMessagesResponseDto,
} from '../dto/public-bot.dto';
import { KBRagService } from '../../knowledge-base/services/kb-rag.service';
import {
  AiProvidersService,
  ChatMessage,
} from '../../ai-providers/ai-providers.service';
import { WidgetVersionService } from './widget-version.service';

@Injectable()
export class PublicBotService {
  private readonly logger = new Logger(PublicBotService.name);

  constructor(
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    @InjectRepository(WidgetVersionEntity)
    private readonly widgetVersionRepository: Repository<WidgetVersionEntity>,
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    private readonly kbRagService: KBRagService,
    private readonly aiProvidersService: AiProvidersService,
    private readonly widgetVersionService: WidgetVersionService,
  ) {}

  async getBotConfig(
    botId: string,
    origin?: string,
    version?: string,
    versionId?: string,
  ): Promise<BotConfigResponseDto> {
    const bot = await this.botRepository.findOne({
      where: { id: botId, status: 'active', widgetEnabled: true },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found or widget is disabled');
    }

    let widgetVersion;

    if (versionId) {
      widgetVersion = await this.widgetVersionRepository.findOne({
        where: { id: versionId, botId },
      });
      if (!widgetVersion) {
        throw new NotFoundException('Widget version not found');
      }
    } else if (version) {
      widgetVersion = await this.widgetVersionRepository.findOne({
        where: { botId, version },
      });
      if (!widgetVersion) {
        throw new NotFoundException(`Widget version ${version} not found`);
      }
    } else {
      widgetVersion = await this.widgetVersionService.getActiveVersion(botId);
      if (!widgetVersion) {
        throw new NotFoundException('No active widget version found');
      }
    }

    const allowedOrigins = widgetVersion.config.security?.allowedOrigins || [
      '*',
    ];
    if (origin) {
      const allowed = this.isOriginAllowed(allowedOrigins, origin);
      if (!allowed) {
        this.logger.warn(
          `Origin ${origin} not allowed for bot ${botId}. Allowed origins: ${allowedOrigins.join(', ')}`,
        );
        throw new ForbiddenException('Origin not allowed');
      }
    }

    return {
      botId: bot.id,
      version: widgetVersion.version,
      versionId: widgetVersion.id,
      name: bot.name,
      description: bot.description,
      avatarUrl: bot.avatarUrl,
      defaultLanguage: bot.defaultLanguage,
      timezone: bot.timezone,
      welcomeMessage:
        widgetVersion.config.messages?.welcome ||
        'Xin chÃ o! TÃ´i cÃ³ thá»ƒ giÃºp gÃ¬ cho báº¡n?',
      placeholderText:
        widgetVersion.config.messages?.placeholder || 'Nháº­p tin nháº¯n...',
      theme: {
        primaryColor: widgetVersion.config.theme?.primaryColor || '#667eea',
        position: widgetVersion.config.theme?.position || 'bottom-right',
        buttonSize: widgetVersion.config.theme?.buttonSize || 'medium',
        showAvatar: widgetVersion.config.theme?.showAvatar ?? true,
        showTimestamp: widgetVersion.config.theme?.showTimestamp ?? true,
      },
    };
  }

  async createConversation(
    botId: string,
    dto: CreatePublicConversationDto,
    origin?: string,
  ): Promise<CreateConversationResponseDto> {
    const bot = await this.botRepository.findOne({
      where: { id: botId, status: 'active', widgetEnabled: true },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found or widget is disabled');
    }

    if (bot.allowedOrigins && origin) {
      const allowed = this.isOriginAllowed(bot.allowedOrigins, origin);
      if (!allowed) {
        throw new ForbiddenException('Origin not allowed');
      }
    }

    const conversation = this.conversationRepository.create({
      botId,
      channelType: 'web',
      channelId: null,
      contactName: dto.metadata?.name || null,
      contactAvatar: dto.metadata?.avatar || null,
      metadata: {
        ...dto.metadata,
        userId: dto.userId,
        origin,
        userAgent: dto.userAgent,
        ipAddress: dto.ipAddress,
        source: 'widget',
      },
      status: 'active',
    });

    await this.conversationRepository.save(conversation);

    this.logger.log(
      `Created public conversation ${conversation.id} for bot ${botId} from origin ${origin}`,
    );

    return {
      conversationId: conversation.id,
      botId: bot.id,
      createdAt: conversation.createdAt,
    };
  }

  async sendMessage(
    conversationId: string,
    dto: AddPublicMessageDto,
  ): Promise<MessageResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['bot'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const bot = conversation.bot;

    if (!bot || bot.status !== 'active' || !bot.widgetEnabled) {
      throw new ForbiddenException('Bot is not available');
    }

    const userMessage = this.messageRepository.create({
      conversationId,
      role: 'user',
      content: dto.message,
      metadata: dto.metadata || {},
    });
    await this.messageRepository.save(userMessage);

    this.logger.log(
      `User message saved: ${userMessage.id} in conversation ${conversationId}`,
    );

    const history = await this.messageRepository.find({
      where: { conversationId },
      order: { sentAt: 'ASC' },
      take: 10,
    });

    let context = '';
    let sources: any[] = [];

    if (bot.knowledgeBaseIds && bot.knowledgeBaseIds.length > 0) {
      try {
        const kbResults = await this.kbRagService.query(
          dto.message,
          bot.knowledgeBaseIds[0],
          3,
          0.7,
        );

        if (kbResults && kbResults.length > 0) {
          context = kbResults.map((r) => r.content).join('\n\n');
          sources = kbResults.map((r) => ({
            documentId: r.documentId,
            title: r.metadata?.title || 'Document',
            content: r.content.substring(0, 200),
            score: r.score,
          }));
        }
      } catch (error) {
        this.logger.warn(`Failed to query knowledge base: ${error.message}`);
      }
    }

    const systemPrompt =
      bot.systemPrompt ||
      'You are a helpful AI assistant. Answer questions based on the provided context when available.';

    const messages = [{ role: 'system', content: systemPrompt }];

    if (context) {
      messages.push({
        role: 'system',
        content: `Context from knowledge base:\n${context}\n\nPlease use this context to answer the user's question when relevant.`,
      });
    }

    messages.push(
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    );

    let aiContent = '';
    try {
      // Log bot configuration for debugging
      this.logger.log(
        `Bot ${bot.id} config - aiProviderId: ${bot.aiProviderId}, model: ${bot.aiModelName}, workspace: ${bot.workspaceId}, creator: ${bot.createdBy}`,
      );

      // Use configured AI provider or find workspace/user provider configs
      if (bot.aiProviderId) {
        // Bot is configured with a specific provider config
        const [scope, scopeId] = await this.resolveProviderScope(bot);
        this.logger.log(
          `Resolved scope for bot ${bot.id}: ${scope}, ${scopeId}`,
        );

        if (scope && scopeId) {
          aiContent =
            await this.aiProvidersService.chatWithHistoryUsingProvider(
              messages as any,
              bot.aiModelName || 'gemini-2.0-flash',
              bot.aiProviderId,
              scope as 'user' | 'workspace',
              scopeId,
            );
        } else {
          throw new Error(
            `No valid provider configuration found for bot ${bot.id} with aiProviderId ${bot.aiProviderId}`,
          );
        }
      } else {
        // Fallback: try workspace providers, then user providers
        const workspaceConfigs =
          await this.aiProvidersService.getWorkspaceConfigs(bot.workspaceId);
        const activeWorkspaceConfig = workspaceConfigs.find((c) => c.isActive);
        this.logger.log(
          `Workspace ${bot.workspaceId} has ${workspaceConfigs.length} configs, active: ${activeWorkspaceConfig?.id}`,
        );

        if (activeWorkspaceConfig) {
          aiContent =
            await this.aiProvidersService.chatWithHistoryUsingProvider(
              messages as any,
              bot.aiModelName || 'gemini-2.0-flash',
              activeWorkspaceConfig.id,
              'workspace',
              bot.workspaceId,
            );
        } else {
          // Final fallback: use hardcoded development providers for common models
          aiContent = await this.fallbackToGenericProvider(
            messages as any,
            bot.aiModelName || 'gemini-2.0-flash',
          );
        }
      }
    } catch (error) {
      this.logger.error(`AI generation failed: ${error.message}`);
      aiContent =
        "I apologize, but I'm experiencing technical difficulties. Please try again later or contact support if the issue persists.";
    }

    const botMessage = this.messageRepository.create({
      conversationId,
      role: 'assistant',
      content: aiContent,
      sources: sources.length > 0 ? sources : null,
      metadata: {
        model: bot.aiModelName,
        hasContext: !!context,
        sourcesCount: sources.length,
      },
    });
    await this.messageRepository.save(botMessage);

    await this.conversationRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });

    this.logger.log(
      `Bot response saved: ${botMessage.id} in conversation ${conversationId}`,
    );

    return {
      messageId: botMessage.id,
      content: botMessage.content,
      role: 'assistant',
      timestamp: botMessage.sentAt,
      metadata: {
        ...botMessage.metadata,
        sources: sources.length > 0 ? sources : undefined,
      },
    };
  }

  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string },
  ): Promise<ConversationMessagesResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const limit = options?.limit || 50;
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.sentAt', 'DESC')
      .take(limit);

    if (options?.before) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: options.before },
      });

      if (beforeMessage) {
        queryBuilder.andWhere('message.sentAt < :beforeTime', {
          beforeTime: beforeMessage.sentAt,
        });
      }
    }

    const messages = await queryBuilder.getMany();

    return {
      conversationId,
      messages: messages.reverse().map((m) => ({
        messageId: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.sentAt,
        metadata: m.metadata,
      })),
    };
  }

  private async resolveProviderScope(
    bot: BotEntity,
  ): Promise<[string, string] | [null, null]> {
    if (!bot.aiProviderId) {
      return [null, null];
    }

    // First check if it's a workspace-level config (where aiProviderId is the config ID)
    if (
      await this.aiProvidersService.configExists(
        bot.aiProviderId,
        'workspace',
        bot.workspaceId,
      )
    ) {
      return ['workspace', bot.workspaceId];
    }

    // Then check if it's a user-level config (bot creator)
    if (
      await this.aiProvidersService.configExists(
        bot.aiProviderId,
        'user',
        bot.createdBy,
      )
    ) {
      return ['user', bot.createdBy];
    }

    return [null, null];
  }

  private async fallbackToGenericProvider(
    messages: ChatMessage[],
    model: string,
  ): Promise<string> {
    // Final fallback for development: use hardcoded API keys for common models
    this.logger.warn(`Using fallback provider for model ${model}`);

    // Route to appropriate generic provider based on model name
    if (
      model.includes('ollama') ||
      model.includes('deepseek') ||
      model.includes('llama')
    ) {
      // For Ollama/DeepSeek models, assume local Ollama instance
      return this.aiProvidersService.chatWithHistory(
        messages as any,
        model,
        undefined, // no api key for ollama
        'http://localhost:11434' as any, // baseUrl for ollama
      );
    } else if (model.includes('gemini') || model.includes('palm')) {
      // For Google models - would need a default API key
      throw new Error(
        `Fallback not available for Google models. Please configure AI provider in workspace settings.`,
      );
    } else if (model.includes('gpt') || model.includes('openai')) {
      // For OpenAI models - would need a default API key
      throw new Error(
        `Fallback not available for OpenAI models. Please configure AI provider in workspace settings.`,
      );
    } else {
      throw new Error(
        `No fallback provider available for model ${model}. Please configure AI provider in workspace settings.`,
      );
    }
  }

  private isOriginAllowed(allowedOrigins: string[], origin: string): boolean {
    if (allowedOrigins.includes('*')) {
      return true;
    }

    return allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin === origin) {
        return true;
      }

      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.slice(2);
        return origin.endsWith(domain);
      }

      return false;
    });
  }
}
