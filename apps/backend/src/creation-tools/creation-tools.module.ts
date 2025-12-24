import { Module } from '@nestjs/common';
import { CreationToolsService } from './creation-tools.service';
import { CreationToolsController } from './creation-tools.controller';
import { RelationalCreationToolPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [RelationalCreationToolPersistenceModule, TemplatesModule],
  controllers: [CreationToolsController],
  providers: [CreationToolsService],
  exports: [CreationToolsService, RelationalCreationToolPersistenceModule],
})
export class CreationToolsModule {}
