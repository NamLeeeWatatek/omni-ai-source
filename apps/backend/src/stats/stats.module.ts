import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { BotEntity } from '../bots/infrastructure/persistence/relational/entities/bot.entity';
import {
  ConversationEntity,
  MessageEntity,
} from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
// import {
//   FlowEntity,
//   FlowExecutionEntity,
// } from '../flows/infrastructure/persistence/relational/entities';
import { WorkspaceEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      BotEntity,
      ConversationEntity,
      MessageEntity,
      // FlowEntity,
      // FlowExecutionEntity,
      WorkspaceEntity,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
