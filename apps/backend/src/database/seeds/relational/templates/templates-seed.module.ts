import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TemplatesSeedService } from './templates-seed.service';
import { TemplateEntity } from '../../../../templates/infrastructure/persistence/relational/entities/template.entity';
import { TemplatesModule } from '../../../../templates/templates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TemplateEntity]),
    TemplatesModule,
  ],
  providers: [TemplatesSeedService],
  exports: [TemplatesSeedService],
})
export class TemplatesSeedModule {}
