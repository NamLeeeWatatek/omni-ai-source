import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FlowEntity,
  FlowExecutionEntity,
  NodeExecutionEntity,
} from './infrastructure/persistence/relational/entities';
import { FlowsService } from './flows.service';
import { FlowsController } from './flows.controller';
import { ExecutionsController } from './executions.controller';
import { FlowsGateway } from './flows.gateway';
import { ExecutionGateway } from './execution.gateway';
import { ExecutionService } from './execution.service';
import { NodeExecutorStrategy } from './execution/node-executor.strategy';
import { HttpRequestExecutor } from './execution/executors/http-request.executor';
import { CodeExecutor } from './execution/executors/code.executor';
import { AIChatExecutor } from './execution/executors/ai-chat.executor';
import { ConditionExecutor } from './execution/executors/condition.executor';
import { SendMessageExecutor } from './execution/executors/send-message.executor';
import { WebhookTriggerExecutor } from './execution/executors/webhook-trigger.executor';
import { ApiConnectorExecutor } from './execution/executors/api-connector.executor';
import { ResponseHandlerExecutor } from './execution/executors/response-handler.executor';
import { ChannelsModule } from '../channels/channels.module';
import { TemplatesModule } from '../templates/templates.module';
import { FlowEventListener } from './listeners/flow-event.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FlowEntity,
      FlowExecutionEntity,
      NodeExecutionEntity,
    ]),
    ChannelsModule,
    TemplatesModule,
  ],
  controllers: [FlowsController, ExecutionsController],
  providers: [
    FlowsService,
    FlowsGateway,
    ExecutionGateway,
    ExecutionService,
    NodeExecutorStrategy,
    HttpRequestExecutor,
    CodeExecutor,
    AIChatExecutor,
    ConditionExecutor,
    SendMessageExecutor,
    WebhookTriggerExecutor,
    ApiConnectorExecutor,
    ResponseHandlerExecutor,
    FlowEventListener,
  ],
  exports: [FlowsService, ExecutionService, ExecutionGateway, FlowEventListener],
})
export class FlowsModule implements OnModuleInit {
  constructor(
    private readonly strategy: NodeExecutorStrategy,
    private readonly httpExecutor: HttpRequestExecutor,
    private readonly codeExecutor: CodeExecutor,
    private readonly aiChatExecutor: AIChatExecutor,
    private readonly conditionExecutor: ConditionExecutor,
    private readonly sendMessageExecutor: SendMessageExecutor,
    private readonly webhookTriggerExecutor: WebhookTriggerExecutor,
    private readonly apiConnectorExecutor: ApiConnectorExecutor,
    private readonly responseHandlerExecutor: ResponseHandlerExecutor,
  ) { }

  onModuleInit() {
    // Core executors
    this.strategy.register('http-request', this.httpExecutor);
    this.strategy.register('code', this.codeExecutor);
    this.strategy.register('ai-chat', this.aiChatExecutor);
    this.strategy.register('condition', this.conditionExecutor);
    this.strategy.register('send-message', this.sendMessageExecutor);

    // Integration executors - for third-party connections
    this.strategy.register('webhook-trigger', this.webhookTriggerExecutor);
    this.strategy.register('api-connector', this.apiConnectorExecutor);
    this.strategy.register('response-handler', this.responseHandlerExecutor);

    // Legacy webhook trigger (passthrough)
    this.strategy.register('webhook', {
      execute: (input) =>
        Promise.resolve({ success: true, output: input.input }),
    });

    // Manual trigger (passthrough)
    this.strategy.register('manual', {
      execute: (input) =>
        Promise.resolve({ success: true, output: input.input }),
    });

    // Schedule trigger (passthrough)
    this.strategy.register('schedule', {
      execute: (input) =>
        Promise.resolve({ success: true, output: input.input }),
    });

    // Receive message trigger (passthrough)
    this.strategy.register('receive-message', {
      execute: (input) =>
        Promise.resolve({ success: true, output: input.input }),
    });

    // Custom node handler
    this.strategy.register('custom', {
      execute: async (input) => {
        const actualType = input.data?.nodeType || input.data?.type;

        if (actualType && actualType !== 'custom') {
          return this.strategy.execute({
            ...input,
            nodeType: actualType,
          });
        }

        return { success: true, output: input.input };
      },
    });
  }
}
