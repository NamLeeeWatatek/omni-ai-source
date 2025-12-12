import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeTypeEntity } from './entities/node-type.entity';
import { NodeTypesRelationalRepository } from './repositories/node-type.repository';
import { NodeTypeRepository } from '../node-type.repository';

@Module({
  imports: [TypeOrmModule.forFeature([NodeTypeEntity])],
  providers: [
    {
      provide: NodeTypeRepository,
      useClass: NodeTypesRelationalRepository,
    },
  ],
  exports: [NodeTypeRepository],
})
export class RelationalNodeTypePersistenceModule {}
