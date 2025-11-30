import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateEntity } from '../entities/template.entity';
import { Template } from '../../../../domain/template';

@Injectable()
export class TemplateRepository {
  constructor(
    @InjectRepository(TemplateEntity)
    private readonly repository: Repository<TemplateEntity>,
  ) {}

  async findAll(category?: string): Promise<Template[]> {
    const query = this.repository
      .createQueryBuilder('template')
      .where('template.isActive = :isActive', { isActive: true });

    if (category) {
      query.andWhere('template.category = :category', { category });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Template | null> {
    return this.repository.findOne({
      where: { id, isActive: true },
    });
  }

  async search(query: string): Promise<Template[]> {
    return this.repository
      .createQueryBuilder('template')
      .where('template.isActive = :isActive', { isActive: true })
      .andWhere(
        '(LOWER(template.name) LIKE :query OR LOWER(template.description) LIKE :query)',
        { query: `%${query.toLowerCase()}%` },
      )
      .getMany();
  }

  async incrementUsage(id: string): Promise<void> {
    await this.repository.increment({ id }, 'usageCount', 1);
  }

  async create(template: Partial<TemplateEntity>): Promise<Template> {
    const entity = this.repository.create(template);
    return this.repository.save(entity);
  }
}
