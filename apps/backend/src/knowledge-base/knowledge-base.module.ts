import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotsModule } from '../bots/bots.module';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { FilesS3PresignedModule } from '../files/infrastructure/uploader/s3-presigned/files.module';

import { KBManagementController } from './controllers/kb-management.controller';
import { KBDocumentsController } from './controllers/kb-documents.controller';
import { KBFoldersController } from './controllers/kb-folders.controller';
import { KBQueryController } from './controllers/kb-query.controller';
import { KBProcessingController } from './controllers/kb-processing.controller';
import { KBSyncController } from './controllers/kb-sync.controller';

import { KBManagementService } from './services/kb-management.service';
import { KBDocumentsService } from './services/kb-documents.service';
import { KBFoldersService } from './services/kb-folders.service';
import { KBEmbeddingsService } from './services/kb-embeddings.service';
import { KBVectorService } from './services/kb-vector.service';
import { KBRagService } from './services/kb-rag.service';
import { KBProcessingQueueService } from './services/kb-processing-queue.service';
import { KBSyncService } from './services/kb-sync.service';
import { KBCrawlerService } from './services/kb-crawler.service';

import { KBProcessingGateway } from './gateways/kb-processing.gateway';

import {
  KnowledgeBaseEntity,
  KbFolderEntity,
  KbDocumentEntity,
  KbDocumentVersionEntity,
  RagFeedbackEntity,
} from './infrastructure/persistence/relational/entities/knowledge-base.entity';
import { KBChunkEntity } from './infrastructure/persistence/relational/entities/kb-chunk.entity';
import {
  BotEntity,
  BotKnowledgeBaseEntity,
} from '../bots/infrastructure/persistence/relational/entities/bot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KnowledgeBaseEntity,
      KbFolderEntity,
      KbDocumentEntity,
      KbDocumentVersionEntity,
      RagFeedbackEntity,
      KBChunkEntity,
      BotEntity,
      BotKnowledgeBaseEntity,
    ]),
    forwardRef(() => BotsModule),
    AiProvidersModule,
    FilesS3PresignedModule,
  ],
  controllers: [
    KBManagementController,
    KBDocumentsController,
    KBFoldersController,
    KBQueryController,
    KBProcessingController,
    KBSyncController,
  ],
  providers: [
    KBManagementService,
    KBDocumentsService,
    KBFoldersService,
    KBEmbeddingsService,
    KBVectorService,
    KBRagService,
    KBProcessingQueueService,
    KBSyncService,
    KBCrawlerService,
    KBProcessingGateway,
  ],
  exports: [
    KBManagementService,
    KBDocumentsService,
    KBRagService,
    KBProcessingQueueService,
  ],
})
export class KnowledgeBaseModule {}
