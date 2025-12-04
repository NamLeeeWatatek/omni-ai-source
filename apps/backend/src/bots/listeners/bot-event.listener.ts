import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    MessageReceivedEvent,
    BotMessageProcessingEvent,
} from '../../shared/events';
import { BotEntity } from '../infrastructure/persistence/relational/entities/bot.entity';

@Injectable()
export class BotEventListener {
    private readonly logger = new Logger(BotEventListener.name);

    constructor(
        @InjectRepository(BotEntity)
        private botRepository: Repository<BotEntity>,
    ) { }

    @OnEvent('message.received')
    async handleMessageReceived(event: MessageReceivedEvent) {
        this.logger.debug(
            `Message received event: ${event.conversationId} from ${event.channelType}`,
        );

        try {
            const bot = await this.findActiveBotForChannel(event.channelType);

            if (!bot) {
                this.logger.warn(
                    `No active bot found for channel type: ${event.channelType}`,
                );
                return;
            }

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

    private async findActiveBotForChannel(
        channelType: string,
    ): Promise<BotEntity | null> {
        return this.botRepository.findOne({
            where: {
                isActive: true,
            },
        });
    }
}
