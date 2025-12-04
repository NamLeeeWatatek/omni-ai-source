import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
    FlowExecutionRequestedEvent,
    FlowExecutionCompletedEvent,
    FlowExecutionFailedEvent,
} from '../../shared/events';
import { ExecutionService } from '../execution.service';
import { FlowsService } from '../flows.service';

@Injectable()
export class FlowEventListener {
    private readonly logger = new Logger(FlowEventListener.name);

    constructor(
        private readonly executionService: ExecutionService,
        private readonly flowsService: FlowsService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    @OnEvent('flow.execution.requested')
    async handleFlowExecutionRequested(event: FlowExecutionRequestedEvent) {
        this.logger.debug(
            `Flow execution requested: ${event.flowId} for bot ${event.botId}`,
        );

        try {
            const flow = await this.flowsService.findOne(event.flowId);
            if (!flow) {
                throw new Error(`Flow not found: ${event.flowId}`);
            }

            const flowData = {
                nodes: flow.data.nodes || [],
                edges: flow.data.edges || [],
            };

            const metadata = {
                ...event.metadata,
                botId: event.botId,
                conversationId: event.conversationId,
            };

            const executionId = await this.executionService.executeFlow(
                event.flowId,
                flowData,
                event.input,
                metadata,
            );

            this.logger.debug(`Flow execution started: ${executionId}`);
        } catch (error) {
            this.logger.error(
                `Error starting flow execution: ${error.message}`,
                error.stack,
            );

            const failureEvent = new FlowExecutionFailedEvent(
                event.flowId,
                '',
                error.message,
                event.metadata,
            );

            this.eventEmitter.emit('flow.execution.failed', failureEvent);
        }
    }
}
