import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiConversationsController } from './ai-conversations.controller';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeDocumentEntity } from './infrastructure/persistence/relational/entities/knowledge-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeDocumentEntity])],
  controllers: [
    AiController,
    AiConversationsController,
    KnowledgeBaseController,
  ],
  providers: [AiService, KnowledgeBaseService],
  exports: [AiService, KnowledgeBaseService],
})
export class AiModule { }
