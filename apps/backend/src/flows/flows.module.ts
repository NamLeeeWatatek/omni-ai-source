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
  ],
  exports: [FlowsService, ExecutionService, ExecutionGateway],
})
export class FlowsModule implements OnModuleInit {
  constructor(
    private readonly strategy: NodeExecutorStrategy,
    private readonly httpExecutor: HttpRequestExecutor,
    private readonly codeExecutor: CodeExecutor,
    private readonly aiChatExecutor: AIChatExecutor,
    private readonly conditionExecutor: ConditionExecutor,
    private readonly sendMessageExecutor: SendMessageExecutor,
  ) {}

  onModuleInit() {
    this.strategy.register('http-request', this.httpExecutor);
    this.strategy.register('code', this.codeExecutor);
    this.strategy.register('ai-chat', this.aiChatExecutor);
    this.strategy.register('condition', this.conditionExecutor);
    this.strategy.register('send-message', this.sendMessageExecutor);
    // Simple pass-through for webhook trigger
    this.strategy.register('webhook', {
      execute: async (input) => ({ success: true, output: input.input }),
    });
  }
}
