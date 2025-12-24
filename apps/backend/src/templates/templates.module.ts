import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { RelationalTemplatePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';

@Module({
  imports: [RelationalTemplatePersistenceModule, AiProvidersModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService, RelationalTemplatePersistenceModule],
})
export class TemplatesModule {}
