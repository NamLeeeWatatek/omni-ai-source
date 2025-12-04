import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ConversationEntity,
  MessageEntity,
  MessageFeedbackEntity,
} from './infrastructure/persistence/relational/entities/conversation.entity';
import { AiConversationEntity } from './infrastructure/persistence/relational/entities/ai-conversation.entity';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { AiConversationsService } from './ai-conversations.service';
import { AiConversationsController } from './ai-conversations.controller';
import { ConversationsGateway } from './conversations.gateway';
import { ConversationEventListener } from './listeners/conversation-event.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      MessageEntity,
      MessageFeedbackEntity,
      AiConversationEntity,
    ]),
  ],
  controllers: [ConversationsController, AiConversationsController],
  providers: [ConversationsService, AiConversationsService, ConversationsGateway, ConversationEventListener],
  exports: [ConversationsService, AiConversationsService, ConversationsGateway, ConversationEventListener],
})
export class ConversationsModule { }
