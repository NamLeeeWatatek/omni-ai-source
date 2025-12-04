import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
    SendChannelMessageEvent,
    MessageSentEvent,
} from '../../shared/events';
import { ChannelStrategy } from '../channel.strategy';

/**
 * Event listener for channel-related events
 * Handles sending messages to external channels via events
 */
@Injectable()
export class ChannelEventListener {
    private readonly logger = new Logger(ChannelEventListener.name);

    constructor(
        private readonly channelStrategy: ChannelStrategy,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    /**
     * Handle send channel message event
     */
    @OnEvent('channel.message.send')
    async handleSendChannelMessage(event: SendChannelMessageEvent) {
        this.logger.debug(
            `Sending message to ${event.channelType} channel for recipient ${event.recipientId}`,
        );

        try {
            const result = await this.channelStrategy.sendMessage(
                event.channelType,
                {
                    to: event.recipientId,
                    content: event.content,
                },
            );

            // Emit message sent event
            const sentEvent = new MessageSentEvent(
                event.conversationId || '',
                result.messageId || '',
                event.channelType,
                result.success,
                result.error,
            );

            this.eventEmitter.emit('message.sent', sentEvent);

            if (result.success) {
                this.logger.log(
                    `Message sent successfully to ${event.channelType}: ${result.messageId}`,
                );
            } else {
                this.logger.error(
                    `Failed to send message to ${event.channelType}: ${result.error}`,
                );
            }
        } catch (error) {
            this.logger.error(
                `Error sending channel message: ${error.message}`,
                error.stack,
            );

            // Emit failure event
            const sentEvent = new MessageSentEvent(
                event.conversationId || '',
                '',
                event.channelType,
                false,
                error.message,
            );

            this.eventEmitter.emit('message.sent', sentEvent);
        }
    }
}
