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

/**
 * Service to handle bot execution via events
 * Replaces direct service calls with event-driven approach
 */
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

    /**
     * Handle bot message processing event
     */
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

            // Determine execution strategy
            const activeFlowVersion = bot.flowVersions?.find(v => v.status === 'published');
            if (activeFlowVersion) {
                // Execute flow
                await this.executeFlow(bot, activeFlowVersion, event);
            } else if (bot.knowledgeBases && bot.knowledgeBases.length > 0) {
                // Use knowledge base (RAG)
                await this.executeKnowledgeBase(bot, event);
            } else {
                // Simple AI chat
                await this.executeSimpleChat(bot, event);
            }
        } catch (error) {
            this.logger.error(
                `Error processing bot message: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Execute bot flow
     */
    private async executeFlow(
        bot: BotEntity,
        flowVersion: any,
        event: BotMessageProcessingEvent,
    ): Promise<void> {
        this.logger.log(`Executing flow for bot ${bot.id}`);

        // Emit flow execution event
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

    /**
     * Execute knowledge base query
     */
    private async executeKnowledgeBase(
        bot: BotEntity,
        event: BotMessageProcessingEvent,
    ): Promise<void> {
        this.logger.log(`Executing knowledge base for bot ${bot.id}`);

        // For now, emit a simple response
        // In real implementation, this would query the knowledge base
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

    /**
     * Execute simple AI chat
     */
    private async executeSimpleChat(
        bot: BotEntity,
        event: BotMessageProcessingEvent,
    ): Promise<void> {
        this.logger.log(`Executing simple chat for bot ${bot.id}`);

        // For now, emit a simple echo response
        // In real implementation, this would call AI provider
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

    /**
     * Handle flow execution completed event
     */
    @OnEvent('flow.execution.completed')
    async handleFlowExecutionCompleted(event: any) {
        this.logger.debug(`Flow execution completed: ${event.executionId}`);

        // Extract response from flow output
        const response = event.output?.response || 'Flow completed successfully';

        // Emit bot response event
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
