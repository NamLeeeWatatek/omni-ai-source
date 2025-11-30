import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeTypeSeedService } from './node-type-seed.service';
import { NodeTypeEntity } from '../../../../node-types/infrastructure/persistence/relational/entities/node-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NodeTypeEntity])],
  providers: [NodeTypeSeedService],
  exports: [NodeTypeSeedService],
})
export class NodeTypeSeedModule {}
