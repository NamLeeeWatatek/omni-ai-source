import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BotEntity,
  FlowVersionEntity,
} from './infrastructure/persistence/relational/entities/bot.entity';
import { ConversationEntity } from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';
import { BotExecutionService } from './bot-execution.service';
import { FlowsModule } from '../flows/flows.module';
import { AiModule } from '../ai/ai.module';
import { MessagingModule } from '../channels/messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BotEntity, FlowVersionEntity, ConversationEntity]),
    FlowsModule,
    AiModule,
    MessagingModule,
  ],
  controllers: [BotsController],
  providers: [BotsService, BotExecutionService],
  exports: [BotsService, BotExecutionService],
})
export class BotsModule {}
