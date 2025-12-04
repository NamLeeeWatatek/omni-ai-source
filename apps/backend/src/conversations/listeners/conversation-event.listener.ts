import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    BotResponseGeneratedEvent,
    SendChannelMessageEvent,
    MessageReceivedEvent,
} from '../../shared/events';
import { ConversationEntity, MessageEntity } from '../infrastructure/persistence/relational/entities/conversation.entity';


/**
 * Event listener for conversation-related events
 * Handles conversation and message persistence via events
 */
@Injectable()
export class ConversationEventListener {
    private readonly logger = new Logger(ConversationEventListener.name);

    constructor(
        @InjectRepository(ConversationEntity)
        private conversationRepository: Repository<ConversationEntity>,
        @InjectRepository(MessageEntity)
        private messageRepository: Repository<MessageEntity>,
        private eventEmitter: EventEmitter2,
    ) { }

    /**
     * Handle bot response generated event
     * Save the response and send it to the channel
     */
    @OnEvent('bot.response.generated')
    async handleBotResponseGenerated(event: BotResponseGeneratedEvent) {
        this.logger.debug(
            `Bot response generated for conversation ${event.conversationId}`,
        );

        try {
            // Save assistant message to database
            const message = this.messageRepository.create({
                conversationId: event.conversationId,
                role: 'assistant',
                content: event.responseContent,
                metadata: event.metadata || {},
            });

            await this.messageRepository.save(message);

            // Update conversation's lastMessageAt
            await this.conversationRepository.update(event.conversationId, {
                lastMessageAt: new Date(),
            });

            // Emit event to send message to external channel
            const sendEvent = new SendChannelMessageEvent(
                event.channelType,
                event.recipientId,
                event.responseContent,
                event.conversationId,
                event.metadata,
            );

            this.eventEmitter.emit('channel.message.send', sendEvent);

            this.logger.log(
                `Saved bot response and queued for sending: ${message.id}`,
            );
        } catch (error) {
            this.logger.error(
                `Error handling bot response: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Handle message sent event
     * Update message status if needed
     */
    @OnEvent('message.sent')
    async handleMessageSent(event: any) {
        this.logger.debug(
            `Message sent event: ${event.messageId} - Success: ${event.success}`,
        );

        if (!event.success) {
            this.logger.error(`Message sending failed: ${event.error}`);
            // Could update message status or retry logic here
        }
    }

    /**
     * Handle message received event
     * Update conversation activity
     */
    @OnEvent('message.received')
    async handleMessageReceived(event: MessageReceivedEvent) {
        this.logger.debug(`Message received in conversation ${event.conversationId}`);

        try {
            // Update conversation's lastMessageAt
            await this.conversationRepository.update(event.conversationId, {
                lastMessageAt: new Date(),
                status: 'active',
            });
        } catch (error) {
            this.logger.error(
                `Error updating conversation on message received: ${error.message}`,
                error.stack,
            );
        }
    }
}
