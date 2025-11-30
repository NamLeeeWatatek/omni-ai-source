import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeTypesController } from './node-types.controller';
import { NodeTypesService } from './node-types.service';
import { NodeTypeEntity } from './infrastructure/persistence/relational/entities/node-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NodeTypeEntity])],
  controllers: [NodeTypesController],
  providers: [NodeTypesService],
  exports: [NodeTypesService],
})
export class NodeTypesModule {}
