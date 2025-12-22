import { Module } from '@nestjs/common';
import { NodeTypesController } from './node-types.controller';
import { NodeTypesService } from './node-types.service';
import { RelationalNodeTypePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { DatabaseConfig } from '../database/config/database-config.type';
import databaseConfig from '../database/config/database.config';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { ChannelsModule } from '../channels/channels.module';

const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? RelationalNodeTypePersistenceModule
  : RelationalNodeTypePersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, AiProvidersModule, ChannelsModule],
  controllers: [NodeTypesController],
  providers: [NodeTypesService],
  exports: [NodeTypesService, infrastructurePersistenceModule],
})
export class NodeTypesModule {}
