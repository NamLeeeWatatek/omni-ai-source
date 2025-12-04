import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    BotMessageProcessingEvent,
    BotResponseGeneratedEvent,
    FlowExecutionRequestedEvent,
} from '../../shared/events';
import { BotEntity } from '../infrastructure/persistence/relational/entities/bot.entity';
import { ConversationEntity } from 'src/conversations/infrastructure/persistence/relational/entities/conversation.entity';

@Injectable()
export class BotExecutionEventService {
    private readonly logger = new Logger(BotExecutionEventService.name);

    constructor(
        @InjectRepository(BotEntity)
        private botRepository: Repository<BotEntity>,
        @InjectRepository(ConversationEntity)
        private conversationRepository: Repository<ConversationEntity>,
        private eventEmitter: EventEmitter2,
    ) { }

    @OnEvent('bot.message.processing')
    async handleBotMessageProcessing(event: BotMessageProcessingEvent) {
        this.logger.debug(
            `Processing message for bot ${event.botId}, conversation ${event.conversationId}`,
        );

        try {
            const bot = await this.botRepository.findOne({
                where: { id: event.botId },
                relations: ['flowVersions', 'knowledgeBases'],
            });

            if (!bot) {
                this.logger.error(`Bot not found: ${event.botId}`);
                return;
            }

            const activeFlowVersion = bot.flowVersions?.find(v => v.status === 'published');
            if (activeFlowVersion) {
                await this.executeFlow(bot, activeFlowVersion, event);
            } else if (bot.knowledgeBases && bot.knowledgeBases.length > 0) {
                await this.executeKnowledgeBase(bot, event);
            } else {
                await this.executeSimpleChat(bot, event);
            }
        } catch (error) {
            this.logger.error(
                `Error processing bot message: ${error.message}`,
                error.stack,
            );
        }
    }

    private async executeFlow(
        bot: BotEntity,
        flowVersion: any,
        event: BotMessageProcessingEvent,
    ): Promise<void> {
        this.logger.log(`Executing flow for bot ${bot.id}`);

        const flowEvent = new FlowExecutionRequestedEvent(
            flowVersion.id,
            bot.id,
            event.conversationId,
            {
                message: event.messageContent,
                senderId: event.senderId,
                channelType: event.channelType,
            },
            event.metadata,
        );

        this.eventEmitter.emit('flow.execution.requested', flowEvent);
    }

    private async executeKnowledgeBase(
        bot: BotEntity,
        event: BotMessageProcessingEvent,
    ): Promise<void> {
        this.logger.log(`Executing knowledge base for bot ${bot.id}`);

        const response = `Knowledge base response for: ${event.messageContent}`;

        const responseEvent = new BotResponseGeneratedEvent(
            event.conversationId,
            response,
            bot.id,
            event.channelType,
            event.senderId,
            event.metadata,
        );

        this.eventEmitter.emit('bot.response.generated', responseEvent);
    }

    private async executeSimpleChat(
        bot: BotEntity,
        event: BotMessageProcessingEvent,
    ): Promise<void> {
        this.logger.log(`Executing simple chat for bot ${bot.id}`);

        const response = `Echo: ${event.messageContent}`;

        const responseEvent = new BotResponseGeneratedEvent(
            event.conversationId,
            response,
            bot.id,
            event.channelType,
            event.senderId,
            event.metadata,
        );

        this.eventEmitter.emit('bot.response.generated', responseEvent);
    }

    @OnEvent('flow.execution.completed')
    async handleFlowExecutionCompleted(event: any) {
        this.logger.debug(`Flow execution completed: ${event.executionId}`);

        const response = event.output?.response || 'Flow completed successfully';

        const responseEvent = new BotResponseGeneratedEvent(
            event.metadata?.conversationId || '',
            response,
            event.metadata?.botId || '',
            event.metadata?.channelType || '',
            event.metadata?.senderId || '',
            event.metadata,
        );

        this.eventEmitter.emit('bot.response.generated', responseEvent);
    }
}
