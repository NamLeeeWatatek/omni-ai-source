import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelationalFlowPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import {
  FlowEntity,
  FlowExecutionEntity,
  NodeExecutionEntity,
  FlowVersionEntity,
  ExecutionArtifactEntity,
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
import { AIImageGeneratorExecutor } from './execution/executors/ai-image-generator.executor';
import { ConditionExecutor } from './execution/executors/condition.executor';
import { SendMessageExecutor } from './execution/executors/send-message.executor';
import { WebhookTriggerExecutor } from './execution/executors/webhook-trigger.executor';
import { ApiConnectorExecutor } from './execution/executors/api-connector.executor';
import { ResponseHandlerExecutor } from './execution/executors/response-handler.executor';
import { MultiSocialPostExecutor } from './execution/executors/multi-social-post.executor';
import { DelayExecutor } from './execution/executors/delay.executor';
import { KBQueryExecutor } from './execution/executors/kb-query.executor';
import { ChannelsModule } from '../channels/channels.module';
import { NodeTypesModule } from '../node-types/node-types.module';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { FilesModule } from '../files/files.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { ExecutionArtifactService } from './services/execution-artifact.service';
import { FormDiscoveryService } from './services/form-discovery.service';
import { ExecutionArtifactsController } from './execution-artifacts.controller';
import { FlowEventListener } from './listeners/flow-event.listener';

@Module({
  imports: [
    RelationalFlowPersistenceModule,
    TypeOrmModule.forFeature([
      FlowEntity,
      FlowExecutionEntity,
      NodeExecutionEntity,
      FlowVersionEntity,
      ExecutionArtifactEntity,
    ]),
    ChannelsModule,
    NodeTypesModule,
    AiProvidersModule,
    FilesModule,
    KnowledgeBaseModule,
  ],
  controllers: [
    FlowsController,
    ExecutionsController,
    ExecutionArtifactsController,
  ],
  providers: [
    FlowsService,
    FlowsGateway,
    ExecutionGateway,
    ExecutionService,
    NodeExecutorStrategy,
    HttpRequestExecutor,
    CodeExecutor,
    AIChatExecutor,
    AIImageGeneratorExecutor,
    ConditionExecutor,
    SendMessageExecutor,
    WebhookTriggerExecutor,
    ApiConnectorExecutor,
    ResponseHandlerExecutor,
    MultiSocialPostExecutor,
    DelayExecutor,
    KBQueryExecutor,
    ExecutionArtifactService,
    FormDiscoveryService,
    FlowEventListener,
  ],
  exports: [
    FlowsService,
    ExecutionService,
    ExecutionGateway,
    FormDiscoveryService,
    FlowEventListener,
  ],
})
export class FlowsModule implements OnModuleInit {
  constructor(
    private readonly strategy: NodeExecutorStrategy,
    private readonly httpExecutor: HttpRequestExecutor,
    private readonly codeExecutor: CodeExecutor,
    private readonly aiChatExecutor: AIChatExecutor,
    private readonly aiImageGeneratorExecutor: AIImageGeneratorExecutor,
    private readonly conditionExecutor: ConditionExecutor,
    private readonly sendMessageExecutor: SendMessageExecutor,
    private readonly webhookTriggerExecutor: WebhookTriggerExecutor,
    private readonly apiConnectorExecutor: ApiConnectorExecutor,
    private readonly responseHandlerExecutor: ResponseHandlerExecutor,
    private readonly multiSocialPostExecutor: MultiSocialPostExecutor,
    private readonly delayExecutor: DelayExecutor,
    private readonly kbQueryExecutor: KBQueryExecutor,
  ) {}

  onModuleInit() {
    // Core executors
    this.strategy.register('http-request', this.httpExecutor);
    this.strategy.register('code', this.codeExecutor);
    this.strategy.register('ai-chat', this.aiChatExecutor);
    this.strategy.register('ai-image-generator', this.aiImageGeneratorExecutor);
    this.strategy.register('condition', this.conditionExecutor);
    this.strategy.register('send-message', this.sendMessageExecutor);

    // Integration executors - for third-party connections
    this.strategy.register('webhook-trigger', this.webhookTriggerExecutor);
    this.strategy.register('api-connector', this.apiConnectorExecutor);
    this.strategy.register('response-handler', this.responseHandlerExecutor);
    this.strategy.register('multi-social-post', this.multiSocialPostExecutor);
    this.strategy.register('delay', this.delayExecutor);
    this.strategy.register('kb-query', this.kbQueryExecutor);

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

    // Stub executors for seeded node types (TODO: implement full functionality)
    this.strategy.register('ai-image', {
      execute: async (input) => {
        try {
          // TODO: Implement real AI image generation using AI providers service
          // For now, return placeholder response
          return {
            success: true,
            output: {
              ...input.input,
              aiImage: {
                generated: true,
                placeholder: 'AI image generation - TODO: implement',
                prompt: input.data?.prompt,
                model: input.data?.model || 'dall-e-3',
                provider: 'openai', // Default for now
              },
            },
          };
        } catch (error) {
          return {
            success: false,
            output: input.input,
            error: `AI image generation failed: ${error.message}`,
          };
        }
      },
    });

    this.strategy.register('image-upload', {
      execute: (input) =>
        Promise.resolve({
          success: true,
          output: {
            ...input.input,
            uploadedImages: input.data?.images || [],
          },
        }),
    });

    this.strategy.register('database-query', {
      execute: (input) =>
        Promise.resolve({
          success: true,
          output: {
            ...input.input,
            queryResult: {
              executed: true,
              query: input.data?.query,
              placeholder: 'Database query - TODO: implement',
            },
          },
        }),
    });

    this.strategy.register('loop', {
      execute: (input) =>
        Promise.resolve({
          success: true,
          output: {
            ...input.input,
            loopResult: {
              iterated: true,
              items: input.data?.items || [],
              placeholder: 'Loop execution - TODO: implement',
            },
          },
        }),
    });

    this.strategy.register('json-transform', {
      execute: (input) =>
        Promise.resolve({
          success: true,
          output: {
            ...input.input,
            transformedData: input.input,
            mapping: input.data?.mapping,
          },
        }),
    });

    // Social media post executors (simplified versions)
    this.strategy.register('social-facebook-post', {
      execute: (input) =>
        Promise.resolve({
          success: true,
          output: {
            ...input.input,
            facebookPost: {
              posted: true,
              content: input.data?.content,
              platform: 'facebook',
              placeholder: 'Facebook post - TODO: implement API integration',
            },
          },
        }),
    });

    this.strategy.register('social-instagram-post', {
      execute: (input) =>
        Promise.resolve({
          success: true,
          output: {
            ...input.input,
            instagramPost: {
              posted: true,
              caption: input.data?.caption,
              platform: 'instagram',
              placeholder: 'Instagram post - TODO: implement API integration',
            },
          },
        }),
    });

    this.strategy.register('social-tiktok-post', {
      execute: (input) =>
        Promise.resolve({
          success: true,
          output: {
            ...input.input,
            tiktokPost: {
              posted: true,
              caption: input.data?.caption,
              platform: 'tiktok',
              placeholder: 'TikTok post - TODO: implement API integration',
            },
          },
        }),
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
