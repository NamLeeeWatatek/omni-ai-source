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
  ) { }

  onModuleInit() {
    // Register all node type executors
    this.strategy.register('http-request', this.httpExecutor);
    this.strategy.register('code', this.codeExecutor);
    this.strategy.register('ai-chat', this.aiChatExecutor);
    this.strategy.register('condition', this.conditionExecutor);
    this.strategy.register('send-message', this.sendMessageExecutor);

    // Simple pass-through for webhook trigger
    this.strategy.register('webhook', {
      execute: (input) =>
        Promise.resolve({ success: true, output: input.input }),
    });

    // Handle 'custom' type by checking node data for actual type
    this.strategy.register('custom', {
      execute: async (input) => {
        // Get actual node type from data
        const actualType = input.data?.nodeType || input.data?.type;

        if (actualType && actualType !== 'custom') {
          // Re-execute with actual type
          return this.strategy.execute({
            ...input,
            nodeType: actualType,
          });
        }

        // Default pass-through for unknown custom nodes
        return { success: true, output: input.input };
      },
    });
  }
}
