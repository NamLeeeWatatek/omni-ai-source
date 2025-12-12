import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import {
  ConversationEntity,
  MessageEntity,
  MessageFeedbackEntity,
} from './infrastructure/persistence/relational/entities/conversation.entity';
import {
  CreateConversationDto,
  CreateMessageDto,
  UpdateConversationStatusDto,
  MessageFeedbackDto,
  CreateMessageFeedbackDto,
} from './dto/create-conversation.dto';
import { ConversationsGateway } from './conversations.gateway';
import { ChannelStrategy } from '../channels/channel.strategy';
import { ChannelsService } from '../channels/channels.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(MessageFeedbackEntity)
    private feedbackRepository: Repository<MessageFeedbackEntity>,
    @Inject(forwardRef(() => ConversationsGateway))
    private conversationsGateway: ConversationsGateway,
    @Inject(forwardRef(() => ChannelStrategy))
    private channelStrategy: ChannelStrategy,
    @Inject(forwardRef(() => ChannelsService))
    private channelsService: ChannelsService,
  ) {}

  async create(createDto: CreateConversationDto) {
    // âœ… FIX: Validate channel exists if channelId is provided
    if (createDto.channelId) {
      const channel = await this.channelsService.findOne(createDto.channelId);
      if (!channel) {
        this.logger.error(
          `âŒ Cannot create conversation: Channel ${createDto.channelId} not found`,
        );
        throw new Error(
          `Channel ${createDto.channelId} not found. Please reconnect the channel.`,
        );
      }
      this.logger.log(
        `âœ… Channel ${createDto.channelId} validated for new conversation`,
      );
    }

    const conversation = this.conversationRepository.create({
      ...createDto,
      channelType: createDto.channelType ?? 'web',
      status: 'active',
      metadata: createDto.metadata || {},
    });
    return this.conversationRepository.save(conversation);
  }

  async findAll(options: {
    botId?: string;
    channelType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    workspaceId?: string;
    onlyChannelConversations?: boolean;
  }) {
    // ðŸ” DEBUG: Log filter options
    this.logger.log('========== FIND ALL CHANNEL CONVERSATIONS ==========');
    this.logger.log('Options:', JSON.stringify(options, null, 2));

    // âœ… PROFESSIONAL: This service ONLY handles CHANNEL conversations
    // AI chat conversations are handled by AiConversationsService
    const query = this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.deletedAt IS NULL')
      .andWhere('conversation.channelId IS NOT NULL'); // âœ… ALWAYS filter for channel conversations

    // If filtering by workspace, use INNER JOIN to ensure bot exists and belongs to workspace
    // Otherwise use LEFT JOIN to include conversations without bots
    if (options.workspaceId) {
      this.logger.log(`âœ… Filter: workspaceId = ${options.workspaceId}`);
      query.innerJoinAndSelect(
        'conversation.bot',
        'bot',
        'bot.workspaceId = :workspaceId',
        {
          workspaceId: options.workspaceId,
        },
      );
    } else {
      this.logger.warn(
        'âš ï¸ NO workspaceId filter - will return all workspaces!',
      );
      query.leftJoinAndSelect('conversation.bot', 'bot');
    }

    if (options.botId) {
      this.logger.log(`âœ… Filter: botId = ${options.botId}`);
      query.andWhere('conversation.botId = :botId', { botId: options.botId });
    }

    if (options.channelType) {
      this.logger.log(`âœ… Filter: channelType = ${options.channelType}`);
      query.andWhere('conversation.channelType = :channelType', {
        channelType: options.channelType,
      });
    }

    if (options.status) {
      query.andWhere('conversation.status = :status', {
        status: options.status,
      });
    }

    if (options.startDate) {
      query.andWhere('conversation.createdAt >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options.endDate) {
      query.andWhere('conversation.createdAt <= :endDate', {
        endDate: options.endDate,
      });
    }

    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);

    query
      .orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST')
      .skip((page - 1) * limit)
      .take(limit);

    // ðŸ” DEBUG: Log SQL query
    const sql = query.getSql();
    this.logger.log('ðŸ“ Generated SQL:', sql);
    this.logger.log('ðŸ“ Parameters:', JSON.stringify(query.getParameters()));

    const [items, total] = await query.getManyAndCount();

    this.logger.log(`ðŸ“Š Query result: ${items.length} items, ${total} total`);
    if (items.length > 0) {
      this.logger.log('Sample result:', {
        id: items[0].id,
        botId: items[0].botId,
        channelId: items[0].channelId,
        channelType: items[0].channelType,
      });
    } else {
      this.logger.warn('âŒ NO RESULTS! Check filters above.');
    }

    const formattedItems = await Promise.all(
      items.map(async (item) => {
        let channelName = item.channelType || 'Unknown';
        let channelMetadata = {};

        if (item.channelId) {
          try {
            const channel = await this.channelsService.findOne(item.channelId);
            if (channel) {
              channelName = channel.name || channelName;
              channelMetadata = channel.metadata || {};
            }
          } catch (error) {
            this.logger.warn(
              `Failed to fetch channel info for ${item.channelId}: ${error.message}`,
            );
          }
        }

        let lastMessage = 'No messages yet';
        try {
          const lastMsg = await this.messageRepository.findOne({
            where: { conversationId: item.id },
            order: { sentAt: 'DESC' },
          });
          if (lastMsg) {
            lastMessage = lastMsg.content;
          }
        } catch (error) {}

        return {
          ...item,
          channelName,
          channelMetadata,
          lastMessage,
        };
      }),
    );

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['bot'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async updateStatus(id: string, dto: UpdateConversationStatusDto) {
    const conversation = await this.findOne(id);
    conversation.status = dto.status;
    return this.conversationRepository.save(conversation);
  }

  async close(id: string) {
    return this.updateStatus(id, { status: 'closed' });
  }

  async archive(id: string) {
    return this.updateStatus(id, { status: 'archived' });
  }

  /**
   * Human Takeover - Agent takes over conversation from bot
   */
  async takeover(id: string, agentId: string) {
    const conversation = await this.findOne(id);

    // Update metadata to mark human takeover
    conversation.metadata = {
      ...conversation.metadata,
      humanTakeover: true,
      takenOverBy: agentId,
      takenOverAt: new Date().toISOString(),
    };

    // Save conversation
    const updated = await this.conversationRepository.save(conversation);

    // Emit event for real-time updates
    this.conversationsGateway.server
      .to(id)
      .emit('conversation:updated', updated);

    this.logger.log(`ðŸ‘¤ Agent ${agentId} took over conversation ${id}`);

    return updated;
  }

  /**
   * Hand Back - Agent returns conversation to bot
   */
  async handback(id: string) {
    const conversation = await this.findOne(id);

    // Update metadata to remove human takeover
    conversation.metadata = {
      ...conversation.metadata,
      humanTakeover: false,
      handedBackAt: new Date().toISOString(),
    };

    const updated = await this.conversationRepository.save(conversation);

    // Emit event for real-time updates
    this.conversationsGateway.server
      .to(id)
      .emit('conversation:updated', updated);

    this.logger.log(`ðŸ¤– Conversation ${id} handed back to bot`);

    return updated;
  }

  async delete(id: string) {
    await this.conversationRepository.softDelete(id);
  }

  async addMessage(conversationId: string, createDto: CreateMessageDto) {
    // Load conversation with bot relation to get workspaceId
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['bot'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    const message = this.messageRepository.create({
      conversationId,
      role: createDto.role,
      content: createDto.content,
      attachments: createDto.attachments,
      metadata: createDto.metadata || {},
      sources: createDto.sources,
      toolCalls: createDto.toolCalls,
      sender: createDto.sender ?? createDto.role,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Emit real-time event to WebSocket clients
    this.conversationsGateway.emitNewMessage(conversationId, savedMessage);

    conversation.lastMessageAt = new Date();
    await this.conversationRepository.save(conversation);

    // Try to send to external channel if it's an assistant message
    if (
      createDto.role === 'assistant' &&
      conversation.externalId &&
      conversation.channelType
    ) {
      try {
        await this.sendMessageToExternalChannel(
          conversation,
          createDto.content,
        );
      } catch (error) {
        // Log error but don't fail the request - message is already saved
        this.logger.error(
          `Failed to send message to external channel: ${error.message}`,
        );
        this.logger.warn(
          `ðŸ’¡ Message saved to database but not sent to ${conversation.channelType}`,
        );
      }
    }

    return savedMessage;
  }

  private async sendMessageToExternalChannel(
    conversation: ConversationEntity,
    message: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `ðŸ”„ Sending message to ${conversation.channelType} channel for conversation ${conversation.id}`,
      );

      // Debug: Log conversation details
      this.logger.debug(`Conversation details:`, {
        id: conversation.id,
        channelId: conversation.channelId,
        channelType: conversation.channelType,
        externalId: conversation.externalId,
        botId: conversation.botId,
        hasBot: !!conversation.bot,
        botWorkspaceId: conversation.bot?.workspaceId,
      });

      // Get channel connection to get access token
      if (!conversation.channelId) {
        this.logger.warn(
          `âš ï¸  No channelId for conversation ${conversation.id}. Channel may have been disconnected. Skipping external message send.`,
        );
        return; // Gracefully skip if channel was disconnected
      }

      // Get channel by ID (don't filter by workspace since bot and channel may be in different workspaces)
      this.logger.debug(`Looking for channel ${conversation.channelId}`);

      const channel = await this.channelsService.findOne(
        conversation.channelId,
        undefined, // Don't filter by workspace
      );

      if (!channel) {
        this.logger.warn(
          `âš ï¸ Channel ${conversation.channelId} not found - conversation may be orphaned`,
        );
        this.logger.warn(
          `ðŸ’¡ Message saved to database but not sent to external channel`,
        );
        // Don't throw error - message is already saved, just can't send to external channel
        return;
      }

      this.logger.log(
        `âœ… Found channel: ${channel.name} (${channel.id}, workspace: ${channel.workspaceId})`,
      );

      // Get provider for this channel type
      const provider = this.channelStrategy.getProvider(
        conversation.channelType,
      );

      if (!provider) {
        this.logger.warn(
          `No provider found for channel type: ${conversation.channelType}`,
        );
        return;
      }

      // Set credentials if provider supports it (for Facebook, Instagram, etc.)
      if ('setCredentials' in provider && channel.accessToken) {
        (provider as any).setCredentials(
          channel.accessToken,
          channel.credential?.clientSecret || '',
        );
      }

      // Send message to external channel
      const result = await provider.sendMessage({
        to: conversation.externalId || '',
        content: message,
      });

      if (result.success) {
        this.logger.log(
          `âœ… Message sent successfully to ${conversation.channelType} (messageId: ${result.messageId})`,
        );
      } else {
        this.logger.error(
          `âŒ Failed to send message to ${conversation.channelType}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error sending message to external channel: ${error.message}`,
        error.stack,
      );
    }
  }

  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string; after?: string },
  ) {
    const query = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId });

    // Load older messages (for scroll up / load more)
    if (options?.before) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: options.before },
      });
      if (beforeMessage) {
        query.andWhere('message.sentAt < :beforeDate', {
          beforeDate: beforeMessage.sentAt,
        });
      }
    }

    // Load newer messages (for polling / real-time)
    if (options?.after) {
      const afterMessage = await this.messageRepository.findOne({
        where: { id: options.after },
      });
      if (afterMessage) {
        query.andWhere('message.sentAt > :afterDate', {
          afterDate: afterMessage.sentAt,
        });
      }
    }

    const limit = Math.min(options?.limit ?? 50, 100);

    // âœ… Order by DESC (newest first) for standard chat app behavior
    // Frontend will display in order received (oldest at top, newest at bottom)
    const messages = await query
      .orderBy('message.sentAt', 'DESC')
      .take(limit)
      .getMany();

    // âœ… Reverse to get chronological order (oldest first, newest last)
    // This makes it easier for frontend to append new messages
    const chronologicalMessages = messages.reverse();

    return {
      messages: chronologicalMessages,
      hasMore: messages.length === limit,
      count: messages.length,
    };
  }

  async getMessage(conversationId: string, messageId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, conversationId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async updateMessageFeedback(
    conversationId: string,
    messageId: string,
    dto: MessageFeedbackDto,
  ) {
    const message = await this.getMessage(conversationId, messageId);

    if (dto.feedback !== undefined) message.feedback = dto.feedback;
    if (dto.feedbackComment !== undefined)
      message.feedbackComment = dto.feedbackComment;

    return this.messageRepository.save(message);
  }

  async createMessageFeedback(
    messageId: string,
    dto: CreateMessageFeedbackDto,
  ) {
    const existing = await this.feedbackRepository.findOne({
      where: { messageId },
    });

    if (existing) {
      existing.rating = dto.rating;
      existing.comment = dto.comment;
      return this.feedbackRepository.save(existing);
    }

    const feedback = this.feedbackRepository.create({
      messageId,
      rating: dto.rating,
      comment: dto.comment,
    });

    return this.feedbackRepository.save(feedback);
  }

  async getMessageFeedback(messageId: string) {
    return this.feedbackRepository.findOne({
      where: { messageId },
    });
  }

  async getConversationStats(botId: string, period: 'day' | 'week' | 'month') {
    const startDate = new Date();
    if (period === 'day') startDate.setDate(startDate.getDate() - 1);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else startDate.setMonth(startDate.getMonth() - 1);

    const [totalConversations, activeConversations, totalMessages] =
      await Promise.all([
        this.conversationRepository.count({
          where: {
            botId,
            createdAt: MoreThanOrEqual(startDate),
          },
        }),
        this.conversationRepository.count({
          where: {
            botId,
            status: 'active',
          },
        }),
        this.messageRepository
          .createQueryBuilder('message')
          .innerJoin('message.conversation', 'conversation')
          .where('conversation.botId = :botId', { botId })
          .andWhere('message.sentAt >= :startDate', { startDate })
          .getCount(),
      ]);

    return {
      totalConversations,
      activeConversations,
      totalMessages,
      period,
      startDate,
    };
  }

  async findOrCreateByExternalId(
    botId: string,
    externalId: string,
    channelType: string,
    contactInfo?: { name?: string; avatar?: string },
  ) {
    let conversation = await this.conversationRepository.findOne({
      where: { botId, externalId, channelType },
    });

    if (!conversation) {
      conversation = await this.create({
        botId,
        externalId,
        channelType,
        contactName: contactInfo?.name,
        contactAvatar: contactInfo?.avatar,
      });
    }

    return conversation;
  }

  async findOrCreateFromWebhook(params: {
    botId: string;
    channelId: string;
    channelType: string;
    externalId: string;
    contactName?: string;
    contactAvatar?: string;
    metadata?: Record<string, any>;
  }): Promise<ConversationEntity> {
    // Find by externalId + botId + channelType to avoid duplicates when channel changes
    let conversation = await this.conversationRepository.findOne({
      where: {
        externalId: params.externalId,
        botId: params.botId,
        channelType: params.channelType,
      },
      order: {
        createdAt: 'DESC', // Get the most recent one
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = this.conversationRepository.create({
        botId: params.botId,
        channelId: params.channelId,
        channelType: params.channelType,
        externalId: params.externalId,
        contactName: params.contactName,
        contactAvatar: params.contactAvatar,
        status: 'active',
        lastMessageAt: new Date(),
        metadata: params.metadata || {},
      });

      this.logger.log(
        `Creating new conversation for ${params.contactName} (${params.externalId})`,
      );
    } else {
      // Update existing conversation
      conversation.contactName = params.contactName || conversation.contactName;
      conversation.contactAvatar =
        params.contactAvatar || conversation.contactAvatar;
      conversation.lastMessageAt = new Date();
      conversation.status = 'active';

      // Update channelId if it changed (reconnected channel)
      if (conversation.channelId !== params.channelId) {
        this.logger.log(
          `Updating channelId for conversation ${conversation.id}: ${conversation.channelId} -> ${params.channelId}`,
        );
        conversation.channelId = params.channelId;
      }

      if (params.metadata) {
        conversation.metadata = {
          ...conversation.metadata,
          ...params.metadata,
        };
      }
    }

    return this.conversationRepository.save(conversation);
  }

  async addMessageFromWebhook(params: {
    conversationId: string;
    content: string;
    role: 'user' | 'assistant';
    metadata?: Record<string, any>;
  }): Promise<MessageEntity> {
    const message = this.messageRepository.create({
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      metadata: params.metadata || {},
    });

    return this.messageRepository.save(message);
  }
}
