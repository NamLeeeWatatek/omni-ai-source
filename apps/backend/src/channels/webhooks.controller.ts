import { Controller, Post, Get, Body, Headers, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChannelStrategy } from './channel.strategy';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { BotExecutionService } from '../bots/bot-execution.service';

/**
 * Controller for handling incoming webhooks from different channels
 */
@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly channelStrategy: ChannelStrategy,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    private readonly botExecutionService: BotExecutionService,
  ) {}

  /**
   * Generic webhook endpoint for all channels
   * Route: POST /webhooks/:channel
   */
  @Post(':channel')
  async handleWebhook(
    @Param('channel') channel: string,
    @Body() payload: any,
    @Headers('x-hub-signature-256') facebookSignature?: string,
    @Headers('x-signature') genericSignature?: string,
  ) {
    try {
      // Determine which signature header to use
      const signature = facebookSignature || genericSignature || '';

      // Verify webhook signature
      const isValid = this.channelStrategy.verifyWebhook(
        channel,
        payload,
        signature,
      );

      if (!isValid) {
        return {
          success: false,
          error: 'Invalid webhook signature',
        };
      }

      // Parse incoming message
      const message = this.channelStrategy.parseIncomingMessage(
        channel,
        payload,
      );

      // TODO: Trigger workflow execution based on incoming message
      // This would involve:
      // 1. Finding flows with 'receive-message' trigger for this channel
      // 2. Executing those flows with the incoming message as input

      return {
        success: true,
        message: 'Webhook received',
        data: message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Facebook webhook verification endpoint (GET request from Facebook)
   * Route: GET /webhooks/facebook
   */
  @Get('facebook')
  @ApiOperation({ summary: 'Verify Facebook webhook' })
  verifyFacebookWebhook(@Query() query: any) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'wataomi_verify_token';

    this.logger.log(`Facebook webhook verification: mode=${mode}, token=${token}`);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      this.logger.log('Facebook webhook verified successfully');
      return challenge;
    }

    this.logger.error('Facebook webhook verification failed');
    return { success: false, error: 'Verification failed' };
  }

  /**
   * Facebook webhook handler (POST request with messages)
   * Route: POST /webhooks/facebook
   */
  @Post('facebook')
  @ApiOperation({ summary: 'Handle Facebook webhook events' })
  async handleFacebookWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    try {
      this.logger.log('Received Facebook webhook');

      // Verify signature
      const isValid = this.channelStrategy.verifyWebhook('facebook', payload, signature || '');
      if (!isValid) {
        this.logger.error('Invalid Facebook webhook signature');
        return { success: false, error: 'Invalid signature' };
      }

      // Process entries
      if (payload.object === 'page') {
        for (const entry of payload.entry || []) {
          for (const messaging of entry.messaging || []) {
            await this.processFacebookMessage(messaging, entry.id);
          }
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Facebook webhook error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Instagram webhook handler
   * Route: POST /webhooks/instagram
   */
  @Post('instagram')
  @ApiOperation({ summary: 'Handle Instagram webhook events' })
  async handleInstagramWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    try {
      this.logger.log('Received Instagram webhook');

      // Verify signature (same as Facebook)
      const isValid = this.channelStrategy.verifyWebhook('instagram', payload, signature || '');
      if (!isValid) {
        this.logger.error('Invalid Instagram webhook signature');
        return { success: false, error: 'Invalid signature' };
      }

      // Process entries
      if (payload.object === 'instagram') {
        for (const entry of payload.entry || []) {
          for (const messaging of entry.messaging || []) {
            await this.processInstagramMessage(messaging, entry.id);
          }
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Instagram webhook error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Telegram webhook handler
   * Route: POST /webhooks/telegram
   */
  @Post('telegram')
  @ApiOperation({ summary: 'Handle Telegram webhook events' })
  async handleTelegramWebhook(@Body() payload: any) {
    try {
      this.logger.log('Received Telegram webhook');

      if (payload.message) {
        await this.processTelegramMessage(payload.message);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Telegram webhook error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process Facebook message and save to conversations
   */
  private async processFacebookMessage(messaging: any, pageId: string) {
    const senderId = messaging.sender.id;
    const recipientId = messaging.recipient.id;
    const message = messaging.message;

    if (!message) return;

    this.logger.log(`Processing Facebook message from ${senderId}`);

    // Save to conversations
    const conversation = this.conversationRepository.create({
      externalId: senderId,
      status: 'active',
      metadata: {
        channel: 'facebook',
        pageId,
        senderId,
        recipientId,
        messageId: message.mid,
        lastMessage: message.text || '[Media]',
        lastMessageAt: new Date().toISOString(),
      },
    });

    await this.conversationRepository.save(conversation);

    // Trigger bot execution
    if (message.text) {
      await this.botExecutionService.processMessage({
        channel: 'facebook',
        senderId,
        message: message.text,
        conversationId: conversation.id,
        metadata: {
          pageId,
          recipientId,
          messageId: message.mid,
        },
      });
    }
  }

  /**
   * Process Instagram message
   */
  private async processInstagramMessage(messaging: any, igId: string) {
    const senderId = messaging.sender.id;
    const message = messaging.message;

    if (!message) return;

    this.logger.log(`Processing Instagram message from ${senderId}`);

    const conversation = this.conversationRepository.create({
      externalId: senderId,
      status: 'active',
      metadata: {
        channel: 'instagram',
        igId,
        senderId,
        messageId: message.mid,
        lastMessage: message.text || '[Media]',
        lastMessageAt: new Date().toISOString(),
      },
    });

    await this.conversationRepository.save(conversation);

    // Trigger bot execution
    if (message.text) {
      await this.botExecutionService.processMessage({
        channel: 'instagram',
        senderId,
        message: message.text,
        conversationId: conversation.id,
        metadata: {
          igId,
          messageId: message.mid,
        },
      });
    }
  }

  /**
   * Process Telegram message
   */
  private async processTelegramMessage(message: any) {
    const chatId = message.chat.id;
    const text = message.text;

    this.logger.log(`Processing Telegram message from ${chatId}`);

    const conversation = this.conversationRepository.create({
      externalId: chatId.toString(),
      status: 'active',
      metadata: {
        channel: 'telegram',
        chatId,
        userId: message.from.id,
        messageId: message.message_id,
        customerName: message.from.first_name || message.from.username,
        lastMessage: text || '[Media]',
        lastMessageAt: new Date().toISOString(),
      },
    });

    await this.conversationRepository.save(conversation);

    // Trigger bot execution
    if (text) {
      await this.botExecutionService.processMessage({
        channel: 'telegram',
        senderId: chatId.toString(),
        message: text,
        conversationId: conversation.id,
        metadata: {
          userId: message.from.id,
          messageId: message.message_id,
        },
      });
    }
  }
}
