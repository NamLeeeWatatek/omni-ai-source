import { Module } from '@nestjs/common';
import { CreationJobsService } from './creation-jobs.service';
import { CreationJobsController } from './creation-jobs.controller';
import { RelationalCreationJobsPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { ExecutionQueueModule } from '../execution/queue/execution-queue.module';

@Module({
  imports: [
    RelationalCreationJobsPersistenceModule,
    NotificationsModule,
    AuditModule,
    ExecutionQueueModule,
  ],
  controllers: [CreationJobsController],
  providers: [CreationJobsService],
  exports: [CreationJobsService, RelationalCreationJobsPersistenceModule],
})
export class CreationJobsModule { }
