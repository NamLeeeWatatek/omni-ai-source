import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotEntity } from './infrastructure/persistence/relational/entities/bot.entity';
import { ConversationEntity } from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { FlowsService } from '../flows/flows.service';
import { ExecutionService } from '../flows/execution.service';
import { MessengerService } from '../channels/providers/messenger.service';
import { InstagramService } from '../channels/providers/instagram.service';
import { TelegramService } from '../channels/providers/telegram.service';
import { KnowledgeBaseService } from '../ai/knowledge-base.service';

export interface IncomingMessage {
  channel: string;
  senderId: string;
  message: string;
  conversationId: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class BotExecutionService {
  private readonly logger = new Logger(BotExecutionService.name);

  constructor(
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    private flowsService: FlowsService,
    private executionService: ExecutionService,
    private messengerService: MessengerService,
    private instagramService: InstagramService,
    private telegramService: TelegramService,
    private knowledgeBaseService: KnowledgeBaseService,
  ) {}

  /**
   * Process incoming message and trigger bot execution
   */
  async processMessage(incomingMessage: IncomingMessage): Promise<void> {
    try {
      this.logger.log(
        `Processing message from ${incomingMessage.channel}: ${incomingMessage.senderId}`,
      );

      // Find active bot for this channel
      const bot = await this.findActiveBotForChannel(incomingMessage.channel);

      if (!bot) {
        this.logger.warn(
          `No active bot found for channel: ${incomingMessage.channel}`,
        );
        return;
      }

      // If bot has a flow, execute it
      if (bot.flowId && bot.flowId !== null) {
        await this.executeBotFlow(bot, incomingMessage);
      } else {
        // Try to answer using knowledge base
        await this.answerWithKnowledgeBase(bot, incomingMessage);
      }
    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`, error.stack);
    }
  }

  /**
   * Find active bot for a specific channel
   */
  private async findActiveBotForChannel(
    channel: string,
  ): Promise<BotEntity | null> {
    // TODO: Add channel relationship to bot
    // For now, find any active bot
    return this.botRepository.findOne({
      where: { isActive: true },
      relations: ['flow'],
    });
  }

  /**
   * Execute bot's flow with incoming message as input
   */
  private async executeBotFlow(
    bot: BotEntity,
    incomingMessage: IncomingMessage,
  ): Promise<void> {
    try {
      if (!bot.flowId) {
        this.logger.error('Bot flowId is null');
        return;
      }

      this.logger.log(`Executing flow ${bot.flowId} for bot ${bot.name}`);

      // Get flow data
      const flow = await this.flowsService.findOne(bot.flowId.toString());

      if (!flow) {
        this.logger.error(`Flow ${bot.flowId} not found`);
        return;
      }

      // Prepare input for flow execution
      const flowInput = {
        trigger: 'message',
        channel: incomingMessage.channel,
        senderId: incomingMessage.senderId,
        message: incomingMessage.message,
        conversationId: incomingMessage.conversationId,
        metadata: incomingMessage.metadata,
        timestamp: new Date().toISOString(),
      };

      // Execute flow
      const executionId = await this.executionService.executeFlow(
        bot.flowId.toString(),
        flow.data,
        flowInput,
      );

      this.logger.log(
        `Flow execution started: ${executionId} for bot ${bot.name}`,
      );

      // TODO: Listen for execution completion and send response back to channel
      // This would involve:
      // 1. Wait for execution to complete
      // 2. Extract response from execution result
      // 3. Send response via channel API
    } catch (error) {
      this.logger.error(
        `Error executing bot flow: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Send response back to channel
   */
  async sendResponse(
    channel: string,
    recipientId: string,
    message: string,
  ): Promise<void> {
    try {
      this.logger.log(`Sending response to ${channel}: ${recipientId}`);

      // TODO: Implement channel-specific sending logic
      // This would use the channel providers (Facebook, Instagram, Telegram, etc.)
      // to send the actual message

      switch (channel) {
        case 'facebook':
          await this.sendFacebookMessage(recipientId, message);
          break;
        case 'instagram':
          await this.sendInstagramMessage(recipientId, message);
          break;
        case 'telegram':
          await this.sendTelegramMessage(recipientId, message);
          break;
        default:
          this.logger.warn(`Unsupported channel: ${channel}`);
      }
    } catch (error) {
      this.logger.error(`Error sending response: ${error.message}`, error.stack);
    }
  }

  private async sendFacebookMessage(
    recipientId: string,
    message: string,
  ): Promise<void> {
    const result = await this.messengerService.sendMessage({
      recipientId,
      message,
    });

    if (result.success) {
      this.logger.log(
        `✅ Facebook message sent to ${recipientId}: ${result.messageId}`,
      );
    } else {
      this.logger.error(
        `❌ Failed to send Facebook message: ${result.error}`,
      );
    }
  }

  private async sendInstagramMessage(
    recipientId: string,
    message: string,
  ): Promise<void> {
    const result = await this.instagramService.sendMessage({
      recipientId,
      message,
    });

    if (result.success) {
      this.logger.log(
        `✅ Instagram message sent to ${recipientId}: ${result.messageId}`,
      );
    } else {
      this.logger.error(
        `❌ Failed to send Instagram message: ${result.error}`,
      );
    }
  }

  private async sendTelegramMessage(
    recipientId: string,
    message: string,
  ): Promise<void> {
    const result = await this.telegramService.sendMessage({
      recipientId,
      message,
    });

    if (result.success) {
      this.logger.log(
        `✅ Telegram message sent to ${recipientId}: ${result.messageId}`,
      );
    } else {
      this.logger.error(
        `❌ Failed to send Telegram message: ${result.error}`,
      );
    }
  }

  /**
   * Answer using knowledge base (RAG)
   */
  private async answerWithKnowledgeBase(
    bot: BotEntity,
    incomingMessage: IncomingMessage,
  ): Promise<void> {
    try {
      this.logger.log(
        `Querying knowledge base for bot ${bot.name}: "${incomingMessage.message}"`,
      );

      // Generate answer using RAG
      const answer = await this.knowledgeBaseService.generateAnswer(
        incomingMessage.message,
        bot.id.toString(),
      );

      // Send response back to channel
      await this.sendResponse(
        incomingMessage.channel,
        incomingMessage.senderId,
        answer,
      );

      this.logger.log(`✅ Knowledge base answer sent to ${incomingMessage.senderId}`);
    } catch (error) {
      this.logger.error(
        `Error answering with knowledge base: ${error.message}`,
      );

      // Send fallback message
      await this.sendResponse(
        incomingMessage.channel,
        incomingMessage.senderId,
        'Sorry, I encountered an error processing your message. Please try again.',
      );
    }
  }
}
