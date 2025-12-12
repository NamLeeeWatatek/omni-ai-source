import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowSeedService } from './flow-seed.service';
import { FlowEntity } from '../../../../flows/infrastructure/persistence/relational/entities/flow.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FlowEntity, UserEntity])],
  providers: [FlowSeedService],
  exports: [FlowSeedService],
})
export class FlowSeedModule {}
