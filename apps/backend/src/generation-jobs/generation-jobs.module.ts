import { Module } from '@nestjs/common';
import { GenerationJobsController } from './generation-jobs.controller';
import { GenerationJobsService } from './generation-jobs.service';
import { RelationalGenerationJobPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

import { ExecutionQueueModule } from '../execution/queue/execution-queue.module';

@Module({
  imports: [RelationalGenerationJobPersistenceModule, ExecutionQueueModule],
  controllers: [GenerationJobsController],
  providers: [GenerationJobsService],
  exports: [GenerationJobsService, RelationalGenerationJobPersistenceModule],
})
export class GenerationJobsModule { }
