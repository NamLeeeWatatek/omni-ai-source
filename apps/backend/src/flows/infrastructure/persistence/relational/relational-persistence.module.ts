import { Module } from '@nestjs/common';
import { FlowRepository } from '../flow.repository';
import { RelationalFlowRepository } from './repositories/flow.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowEntity } from './entities/flow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FlowEntity])],
  providers: [
    {
      provide: FlowRepository,
      useClass: RelationalFlowRepository,
    },
  ],
  exports: [FlowRepository],
})
export class RelationalFlowPersistenceModule {}
