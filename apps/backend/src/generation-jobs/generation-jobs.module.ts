import { Module } from '@nestjs/common';
import { GenerationJobsController } from './generation-jobs.controller';
import { GenerationJobsService } from './generation-jobs.service';
import { RelationalGenerationJobPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalGenerationJobPersistenceModule],
  controllers: [GenerationJobsController],
  providers: [GenerationJobsService],
  exports: [GenerationJobsService, RelationalGenerationJobPersistenceModule],
})
export class GenerationJobsModule {}
