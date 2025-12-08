import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateFormSchemaEntity } from './infrastructure/persistence/relational/entities/template-form-schema.entity';
import { FlowExecutionEntity } from '../flows/infrastructure/persistence/relational/entities/flow-execution.entity';
import { TemplateFormsController } from './template-forms.controller';
import { TemplateFormsService } from './template-forms.service';
import { TemplateExecutionService } from './template-execution.service';
import { FlowsModule } from '../flows/flows.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            TemplateFormSchemaEntity,
            FlowExecutionEntity, // Use existing flow execution entity
        ]),
        FlowsModule, // Import FlowsModule to use FlowsService
    ],
    controllers: [TemplateFormsController],
    providers: [
        TemplateFormsService,
        TemplateExecutionService,
    ],
    exports: [
        TemplateFormsService,
        TemplateExecutionService,
    ],
})
export class TemplateFormsModule { }

