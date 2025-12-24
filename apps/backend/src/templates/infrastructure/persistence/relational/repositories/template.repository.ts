import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, In, Like } from 'typeorm';
import { TemplateEntity } from '../entities/template.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import {
  FilterTemplateDto,
  SortTemplateDto,
} from '../../../../dto/query-template.dto';
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
      relations: ['creationTool'],
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
      relations: ['creationTool'],
    });
    return entity ? TemplateMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Template['id'][]): Promise<Template[]> {
    const entities = await this.templatesRepository.find({
      where: { id: In(ids) },
    });
    return entities.map((template) => TemplateMapper.toDomain(template));
  }

  async findByNameAndWorkspace(
    name: string,
    workspaceId: string,
  ): Promise<NullableType<Template>> {
    const entity = await this.templatesRepository.findOne({
      where: { name, workspaceId },
    });
    return entity ? TemplateMapper.toDomain(entity) : null;
  }

  async findByWorkspace(workspaceId: string): Promise<Template[]> {
    const entities = await this.templatesRepository.find({
      where: { workspaceId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return entities.map((template) => TemplateMapper.toDomain(template));
  }

  async findByCreationTool(creationToolId: string): Promise<Template[]> {
    const entities = await this.templatesRepository.find({
      where: { creationToolId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return entities.map((template) => TemplateMapper.toDomain(template));
  }

  async update(
    id: Template['id'],
    payload: Partial<Template>,
  ): Promise<Template | null> {
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

  async bulkUpdate(
    ids: Template['id'][],
    payload: Partial<Template>,
  ): Promise<void> {
    if (ids.length === 0) return;

    // transform payload to persistence format if needed,
    // but for simple updates (like creationToolId), direct update is safer/faster
    // than fetching all entities, mapping, and saving.
    // However, since we are using TypeORM, `update` ignores hooks/listeners.
    // Assuming this is fine for bulk operations.

    // We only support specific fields for bulk update for now to be safe,
    // or we pass the payload directly if it matches the entity structure.
    // Ideally we should use the Mapper, but Mapper works on full domain objects.
    // For now, I'll allow direct update on the repository for simplicity and performance.

    await this.templatesRepository.update(
      { id: In(ids) },
      payload as any, // Casting to any because Partial<Template> might mismatch Entity specific fields slightly, but keys should match.
    );
  }

  async remove(id: Template['id']): Promise<void> {
    await this.templatesRepository.softDelete(id);
  }

  async bulkRemove(ids: Template['id'][]): Promise<void> {
    if (ids.length === 0) return;
    await this.templatesRepository.softDelete({ id: In(ids) });
  }
}
