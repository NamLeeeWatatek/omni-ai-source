import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotEntity } from './infrastructure/persistence/relational/entities/bot.entity';
import { ConversationEntity } from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
// import { FlowsService } from '../flows/flows.service';
// import { ExecutionService } from '../flows/execution.service';
import { MessengerService } from '../channels/providers/messenger.service';
import { InstagramService } from '../channels/providers/instagram.service';
import { TelegramService } from '../channels/providers/telegram.service';
import { KBRagService } from '../knowledge-base/services/kb-rag.service';

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
    // private flowsService: FlowsService,
    // private executionService: ExecutionService,
    private messengerService: MessengerService,
    private instagramService: InstagramService,
    private telegramService: TelegramService,
    private kbRagService: KBRagService,
  ) {}

  async processMessage(incomingMessage: IncomingMessage): Promise<void> {
    try {
      this.logger.log(
        `Processing message from ${incomingMessage.channel}: ${incomingMessage.senderId}`,
      );

      const bot = await this.findActiveBotForChannel(incomingMessage.channel);

      if (!bot) {
        this.logger.warn(
          `No active bot found for channel: ${incomingMessage.channel}`,
        );
        return;
      }

      // if (bot.flowId && bot.flowId !== null) {
      //   await this.executeBotFlow(bot, incomingMessage);
      // } else {
      await this.answerWithKnowledgeBase(bot, incomingMessage);
      // }
    } catch (error) {
      this.logger.error(
        `Error processing message: ${error.message}`,
        error.stack,
      );
    }
  }

  private async findActiveBotForChannel(
    channel: string,
  ): Promise<BotEntity | null> {
    return this.botRepository.findOne({
      where: { isActive: true },
      relations: ['flow'],
    });
  }

  /*
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

      const flow = await this.flowsService.findOne(bot.flowId.toString());

      if (!flow) {
        this.logger.error(`Flow ${bot.flowId} not found`);
        return;
      }

      const flowInput = {
        trigger: 'message',
        channel: incomingMessage.channel,
        senderId: incomingMessage.senderId,
        message: incomingMessage.message,
        conversationId: incomingMessage.conversationId,
        metadata: incomingMessage.metadata,
        timestamp: new Date().toISOString(),
      };

      const flowData = {
        nodes: flow.nodes || [],
        edges: flow.edges || [],
      };

      const executionId = await this.executionService.executeFlow(
        bot.flowId.toString(),
        flowData,
        flowInput,
      );

      this.logger.log(
        `Flow execution started: ${executionId} for bot ${bot.name}`,
      );
    } catch (error) {
      this.logger.error(
        `Error executing bot flow: ${error.message}`,
        error.stack,
      );
    }
  }
  */

  async sendResponse(
    channel: string,
    recipientId: string,
    message: string,
  ): Promise<void> {
    try {
      this.logger.log(`Sending response to ${channel}: ${recipientId}`);

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
      this.logger.error(
        `Error sending response: ${error.message}`,
        error.stack,
      );
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
        `âœ… Facebook message sent to ${recipientId}: ${result.messageId}`,
      );
    } else {
      this.logger.error(`âŒ Failed to send Facebook message: ${result.error}`);
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
        `âœ… Instagram message sent to ${recipientId}: ${result.messageId}`,
      );
    } else {
      this.logger.error(`âŒ Failed to send Instagram message: ${result.error}`);
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
        `âœ… Telegram message sent to ${recipientId}: ${result.messageId}`,
      );
    } else {
      this.logger.error(`âŒ Failed to send Telegram message: ${result.error}`);
    }
  }

  private async answerWithKnowledgeBase(
    bot: BotEntity,
    incomingMessage: IncomingMessage,
  ): Promise<void> {
    try {
      this.logger.log(
        `Querying knowledge base for bot ${bot.name}: "${incomingMessage.message}"`,
      );

      const systemPrompt = bot.systemPrompt || bot.description || undefined;

      const result = await this.kbRagService.generateAnswerForAgent(
        incomingMessage.message,
        bot.id.toString(),
        undefined,
        undefined,
        systemPrompt,
      );

      const answer = result.answer;

      await this.sendResponse(
        incomingMessage.channel,
        incomingMessage.senderId,
        answer,
      );

      this.logger.log(
        `âœ… Knowledge base answer sent to ${incomingMessage.senderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error answering with knowledge base: ${error.message}`,
      );

      await this.sendResponse(
        incomingMessage.channel,
        incomingMessage.senderId,
        'Sorry, I encountered an error processing your message. Please try again.',
      );
    }
  }
}
