import { Module } from '@nestjs/common';
import { NodeTypesController } from './node-types.controller';
import { NodeTypesService } from './node-types.service';
import { RelationalNodeTypePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { DatabaseConfig } from '../database/config/database-config.type';
import databaseConfig from '../database/config/database.config';

const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? RelationalNodeTypePersistenceModule
  : RelationalNodeTypePersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [NodeTypesController],
  providers: [NodeTypesService],
  exports: [NodeTypesService, infrastructurePersistenceModule],
})
export class NodeTypesModule {}
