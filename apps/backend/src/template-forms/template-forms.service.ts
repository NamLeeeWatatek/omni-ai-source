import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateFormSchemaEntity } from './infrastructure/persistence/relational/entities/template-form-schema.entity';
import { CreateTemplateFormDto } from './dto/create-template-form.dto';
import { UpdateTemplateFormDto } from './dto/update-template-form.dto';

@Injectable()
export class TemplateFormsService {
    constructor(
        @InjectRepository(TemplateFormSchemaEntity)
        private repository: Repository<TemplateFormSchemaEntity>,
    ) { }

    async create(
        dto: CreateTemplateFormDto,
        userId: string,
    ): Promise<TemplateFormSchemaEntity> {
        const template = this.repository.create({
            ...dto,
            createdById: userId,
        });
        return this.repository.save(template);
    }

    async findAll(category?: string): Promise<TemplateFormSchemaEntity[]> {
        const query = this.repository
            .createQueryBuilder('template')
            .where('template.isActive = :isActive', { isActive: true });

        if (category && category !== 'all') {
            query.andWhere('template.category = :category', { category });
        }

        return query.orderBy('template.createdAt', 'DESC').getMany();
    }

    async findOne(id: string): Promise<TemplateFormSchemaEntity> {
        const template = await this.repository.findOne({ where: { id } });
        if (!template) {
            throw new NotFoundException('Template not found');
        }
        return template;
    }

    async update(
        id: string,
        dto: UpdateTemplateFormDto,
    ): Promise<TemplateFormSchemaEntity> {
        const template = await this.findOne(id);
        Object.assign(template, dto);
        return this.repository.save(template);
    }

    async remove(id: string): Promise<void> {
        const template = await this.findOne(id);
        await this.repository.remove(template);
    }

    async getFormSchema(templateId: string): Promise<any[]> {
        const template = await this.findOne(templateId);
        return template.formSchema;
    }
}
