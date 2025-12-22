import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, In, Like } from 'typeorm';
import { TemplateEntity } from '../entities/template.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { FilterTemplateDto, SortTemplateDto } from '../../../../dto/query-template.dto';
import { Template } from '../../../../domain/template';
import { TemplateRepository } from '../../template.repository';
import { TemplateMapper } from '../mappers/template.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class TemplatesRelationalRepository implements TemplateRepository {
  constructor(
    @InjectRepository(TemplateEntity)
    private readonly templatesRepository: Repository<TemplateEntity>,
  ) {}

  async create(data: Template): Promise<Template> {
    const persistenceModel = TemplateMapper.toPersistence(data);
    const newEntity = await this.templatesRepository.save(
      this.templatesRepository.create(persistenceModel),
    );
    return TemplateMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTemplateDto | null;
    sortOptions?: SortTemplateDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Template[]> {
    const where: FindOptionsWhere<TemplateEntity> = {};

    if (filterOptions?.isActive !== undefined) {
      where.isActive = filterOptions.isActive;
    }

    if (filterOptions?.name) {
      where.name = Like(`%${filterOptions.name}%`);
    }

    if (filterOptions?.category) {
      where.category = filterOptions.category;
    }

    if (filterOptions?.workspaceId) {
      where.workspaceId = filterOptions.workspaceId;
    }

    if (filterOptions?.createdBy) {
      where.createdBy = filterOptions.createdBy;
    }

    const entities = await this.templatesRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.orderBy]: sort.order,
        }),
        {},
      ),
    });

    return entities.map((template) => TemplateMapper.toDomain(template));
  }

  async findById(id: Template['id']): Promise<NullableType<Template>> {
    const entity = await this.templatesRepository.findOne({
      where: { id },
    });
    return entity ? TemplateMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Template['id'][]): Promise<Template[]> {
    const entities = await this.templatesRepository.find({
      where: { id: In(ids) },
    });
    return entities.map((template) => TemplateMapper.toDomain(template));
  }

  async findByNameAndWorkspace(name: string, workspaceId: string): Promise<NullableType<Template>> {
    const entity = await this.templatesRepository.findOne({
      where: { name, workspaceId },
    });
    return entity ? TemplateMapper.toDomain(entity) : null;
  }

  async findByWorkspace(workspaceId: string): Promise<Template[]> {
    const entities = await this.templatesRepository.find({
      where: { workspaceId },
    });
    return entities.map((template) => TemplateMapper.toDomain(template));
  }

  async update(id: Template['id'], payload: Partial<Template>): Promise<Template | null> {
    const entity = await this.templatesRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    const updatedEntity = await this.templatesRepository.save(
      this.templatesRepository.create(
        TemplateMapper.toPersistence({
          ...TemplateMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return TemplateMapper.toDomain(updatedEntity);
  }

  async remove(id: Template['id']): Promise<void> {
    await this.templatesRepository.softDelete(id);
  }
}
