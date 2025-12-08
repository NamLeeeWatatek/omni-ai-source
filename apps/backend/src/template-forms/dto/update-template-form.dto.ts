import { PartialType } from '@nestjs/swagger';
import { CreateTemplateFormDto } from './create-template-form.dto';

export class UpdateTemplateFormDto extends PartialType(CreateTemplateFormDto) { }
