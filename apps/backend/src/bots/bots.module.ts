import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BotEntity,
  FlowVersionEntity,
  BotKnowledgeBaseEntity,
} from './infrastructure/persistence/relational/entities/bot.entity';
import { WidgetVersionEntity } from './infrastructure/persistence/relational/entities/widget-version.entity';
import { WidgetDeploymentEntity } from './infrastructure/persistence/relational/entities/widget-deployment.entity';
import { WorkspaceMemberEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import {
  ConversationEntity,
  MessageEntity,
} from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';
import { PublicBotController } from './controllers/public-bot.controller';
import { PublicWidgetController } from './controllers/public-widget.controller';
import { WidgetVersionController } from './controllers/widget-version.controller';
import { WidgetDeploymentController } from './controllers/widget-deployment.controller';
import { PublicBotService } from './services/public-bot.service';
import { WidgetVersionService } from './services/widget-version.service';
import { BotExecutionService } from './bot-execution.service';
import { BotFunctionsService } from './bot-functions.service';
import { BotInteractionService } from './bot-interaction.service';
import { FlowsModule } from '../flows/flows.module';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { MessagingModule } from '../channels/messaging.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { BotEventListener } from './listeners/bot-event.listener';
import { BotExecutionEventService } from './listeners/bot-execution-event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BotEntity,
      FlowVersionEntity,
      BotKnowledgeBaseEntity,
      WidgetVersionEntity,
      WidgetDeploymentEntity,
      WorkspaceMemberEntity,
      ConversationEntity,
      MessageEntity,
    ]),
    WorkspacesModule,
    forwardRef(() => FlowsModule),
    forwardRef(() => AiProvidersModule),
    forwardRef(() => KnowledgeBaseModule),
    MessagingModule,
  ],
  controllers: [BotsController, PublicBotController, PublicWidgetController, WidgetVersionController, WidgetDeploymentController],
  providers: [
    BotsService,
    PublicBotService,
    WidgetVersionService,
    BotExecutionService,
    BotFunctionsService,
    BotInteractionService,
    // Event Listeners
    BotEventListener,
    BotExecutionEventService,
  ],
  exports: [
    BotsService,
    PublicBotService,
    WidgetVersionService,
    BotExecutionService,
    BotFunctionsService,
    BotInteractionService,
    BotExecutionEventService,
  ],
})
export class BotsModule { }
