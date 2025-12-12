import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AuditLogEntity,
  DataAccessLogEntity,
} from './infrastructure/persistence/relational/entities/audit.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity, DataAccessLogEntity])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
