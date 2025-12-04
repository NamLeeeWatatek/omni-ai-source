import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Param,
  Query,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChannelStrategy } from './channel.strategy';
import { ChannelsService } from './channels.service';
import { FacebookOAuthService } from './facebook-oauth.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageReceivedEvent } from '../shared/events';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationsGateway } from '../conversations/conversations.gateway';

/**
 * Controller for handling incoming webhooks from different channels
 */
@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly channelStrategy: ChannelStrategy,
    private readonly channelsService: ChannelsService,
    private readonly facebookOAuthService: FacebookOAuthService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
    @Inject(forwardRef(() => ConversationsGateway))
    private readonly conversationsGateway: ConversationsGateway,
    private readonly eventEmitter: EventEmitter2,
  ) { }

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

    const VERIFY_TOKEN =
      process.env.FACEBOOK_VERIFY_TOKEN || 'wataomi_verify_token';

    this.logger.log(
      `Facebook webhook verification: mode=${mode}, token=${token}`,
    );

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
      const isValid = this.channelStrategy.verifyWebhook(
        'facebook',
        payload,
        signature || '',
      );
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
      const isValid = this.channelStrategy.verifyWebhook(
        'instagram',
        payload,
        signature || '',
      );
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

    this.logger.log(`Processing Facebook message from ${senderId} to page ${pageId}`);

    try {
      // Find channel by pageId
      const channel = await this.channelsService.findByExternalId(pageId);

      if (!channel) {
        this.logger.warn(`No channel found for Facebook page ${pageId}`);
        return;
      }

      // Get botId from channel metadata
      const botId = channel.metadata?.botId as string | undefined;

      if (!botId) {
        this.logger.warn(`No botId found for channel ${channel.id}`);
        return;
      }

      // Get user info from Facebook
      let contactName = 'Facebook User';
      let contactAvatar: string | undefined;

      if (channel.accessToken) {
        try {
          const userInfo = await this.facebookOAuthService.getUserInfo(
            senderId,
            channel.accessToken,
          );
          contactName = userInfo.name || contactName;
          contactAvatar = userInfo.profile_pic;
        } catch (error) {
          this.logger.warn(`Failed to get user info for ${senderId}: ${error.message}`);
        }
      }

      // Use ConversationsService to find or create conversation
      const conversation = await this.conversationsService.findOrCreateFromWebhook({
        botId,
        channelId: channel.id,
        channelType: 'facebook',
        externalId: senderId,
        contactName,
        contactAvatar,
        metadata: {
          pageId,
          recipientId,
        },
      });

      // Emit WebSocket event for new/updated conversation
      try {
        this.conversationsGateway.broadcastConversationUpdate(conversation);
      } catch (error) {
        this.logger.warn('Failed to emit WebSocket event:', error);
      }

      // Save incoming message to database
      if (message.text) {
        const savedMessage = await this.conversationsService.addMessageFromWebhook({
          conversationId: conversation.id,
          content: message.text,
          role: 'user',
          metadata: {
            externalId: message.mid,
            senderId,
            pageId,
            recipientId,
            channelType: 'facebook',
          },
        });

        // Emit WebSocket event for new message
        try {
          this.conversationsGateway.emitNewMessage(conversation.id, savedMessage);
        } catch (error) {
          this.logger.warn('Failed to emit message WebSocket event:', error);
        }

        // Emit message received event
        this.eventEmitter.emit(
          'message.received',
          new MessageReceivedEvent(
            conversation.id,
            savedMessage.id,
            message.text,
            senderId,
            'facebook',
            {
              pageId,
              recipientId,
              messageId: message.mid,
              channelId: channel.id,
              botId,
            },
          ),
        );
      }
    } catch (error) {
      this.logger.error(`Error processing Facebook message: ${error.message}`);
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

    try {
      // Find channel by igId
      const channel = await this.channelsService.findByExternalId(igId);

      if (!channel) {
        this.logger.warn(`No channel found for Instagram account ${igId}`);
        return;
      }

      const botId = channel.metadata?.botId as string | undefined;

      if (!botId) {
        this.logger.warn(`No botId found for channel ${channel.id}`);
        return;
      }

      // Use ConversationsService to find or create conversation
      const conversation = await this.conversationsService.findOrCreateFromWebhook({
        botId,
        channelId: channel.id,
        channelType: 'instagram',
        externalId: senderId,
        contactName: 'Instagram User',
        metadata: {
          igId,
          messageId: message.mid,
        },
      });

      // Emit WebSocket event
      try {
        this.conversationsGateway.broadcastConversationUpdate(conversation);
      } catch (error) {
        this.logger.warn('Failed to emit WebSocket event:', error);
      }

      // Save incoming message
      if (message.text) {
        const savedMessage = await this.conversationsService.addMessageFromWebhook({
          conversationId: conversation.id,
          content: message.text,
          role: 'user',
          metadata: {
            externalId: message.mid,
            senderId,
            igId,
            channelType: 'instagram',
          },
        });

        // Emit message event
        try {
          this.conversationsGateway.emitNewMessage(conversation.id, savedMessage);
        } catch (error) {
          this.logger.warn('Failed to emit message WebSocket event:', error);
        }

        // Emit message received event
        this.eventEmitter.emit(
          'message.received',
          new MessageReceivedEvent(
            conversation.id,
            savedMessage.id,
            message.text,
            senderId,
            'instagram',
            {
              igId,
              messageId: message.mid,
              channelId: channel.id,
              botId,
            },
          ),
        );
      }
    } catch (error) {
      this.logger.error(`Error processing Instagram message: ${error.message}`);
    }
  }

  /**
   * Process Telegram message
   */
  private async processTelegramMessage(message: any) {
    const chatId = message.chat.id;
    const text = message.text;

    this.logger.log(`Processing Telegram message from ${chatId}`);

    try {
      // Find Telegram channel - you may need to adjust this based on your setup
      const channel = await this.channelsService.findByType('telegram');

      if (!channel) {
        this.logger.warn('No Telegram channel found');
        return;
      }

      const botId = channel.metadata?.botId as string | undefined;

      if (!botId) {
        this.logger.warn(`No botId found for channel ${channel.id}`);
        return;
      }

      const contactName = message.from.first_name || message.from.username || 'Telegram User';

      // Use ConversationsService to find or create conversation
      const conversation = await this.conversationsService.findOrCreateFromWebhook({
        botId,
        channelId: channel.id,
        channelType: 'telegram',
        externalId: chatId.toString(),
        contactName,
        metadata: {
          chatId,
          userId: message.from.id,
          messageId: message.message_id,
        },
      });

      // Emit WebSocket event
      try {
        this.conversationsGateway.broadcastConversationUpdate(conversation);
      } catch (error) {
        this.logger.warn('Failed to emit WebSocket event:', error);
      }

      // Save incoming message
      if (text) {
        const savedMessage = await this.conversationsService.addMessageFromWebhook({
          conversationId: conversation.id,
          content: text,
          role: 'user',
          metadata: {
            userId: message.from.id,
            messageId: message.message_id,
            chatId,
            channelType: 'telegram',
          },
        });

        // Emit message event
        try {
          this.conversationsGateway.emitNewMessage(conversation.id, savedMessage);
        } catch (error) {
          this.logger.warn('Failed to emit message WebSocket event:', error);
        }

        // Emit message received event
        this.eventEmitter.emit(
          'message.received',
          new MessageReceivedEvent(
            conversation.id,
            savedMessage.id,
            text,
            chatId.toString(),
            'telegram',
            {
              userId: message.from.id,
              messageId: message.message_id,
              channelId: channel.id,
              botId,
            },
          ),
        );
      }
    } catch (error) {
      this.logger.error(`Error processing Telegram message: ${error.message}`);
    }
  }
}
