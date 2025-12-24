import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreationToolsSeederService } from './creation-tools-seed.service';
import { CreationToolEntity } from '../../../../creation-tools/infrastructure/persistence/relational/entities/creation-tool.entity';
import { TemplateEntity } from '../../../../templates/infrastructure/persistence/relational/entities/template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CreationToolEntity, TemplateEntity])],
  providers: [CreationToolsSeederService],
  exports: [CreationToolsSeederService],
})
export class CreationToolsSeedModule {}
