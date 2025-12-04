import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    MessageReceivedEvent,
    BotMessageProcessingEvent,
} from '../../shared/events';
import { BotEntity } from '../infrastructure/persistence/relational/entities/bot.entity';

/**
 * Event listener for bot-related events
 * Handles message processing without direct dependencies on other modules
 */
@Injectable()
export class BotEventListener {
    private readonly logger = new Logger(BotEventListener.name);

    constructor(
        @InjectRepository(BotEntity)
        private botRepository: Repository<BotEntity>,
    ) { }

    /**
     * Listen for incoming messages and determine if bot should process them
     */
    @OnEvent('message.received')
    async handleMessageReceived(event: MessageReceivedEvent) {
        this.logger.debug(
            `Message received event: ${event.conversationId} from ${event.channelType}`,
        );

        try {
            // Find active bot for this channel
            const bot = await this.findActiveBotForChannel(event.channelType);

            if (!bot) {
                this.logger.warn(
                    `No active bot found for channel type: ${event.channelType}`,
                );
                return;
            }

            // Emit bot processing event
            // This will be handled by BotExecutionService
            this.logger.log(
                `Bot ${bot.id} will process message from conversation ${event.conversationId}`,
            );
        } catch (error) {
            this.logger.error(
                `Error handling message received event: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Find active bot for a specific channel
     */
    private async findActiveBotForChannel(
        channelType: string,
    ): Promise<BotEntity | null> {
        return this.botRepository.findOne({
            where: {
                isActive: true,
                // Note: You may need to add channel filtering logic here
                // based on your bot-channel relationship
            },
        });
    }
}
