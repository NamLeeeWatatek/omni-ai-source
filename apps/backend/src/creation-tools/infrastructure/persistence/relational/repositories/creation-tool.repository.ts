import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, Like } from 'typeorm';
import { CreationToolEntity } from '../entities/creation-tool.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import {
  FilterCreationToolDto,
  SortCreationToolDto,
} from '../../../../dto/query-creation-tool.dto';
import { CreationTool } from '../../../../domain/creation-tool';
import { CreationToolRepository } from '../../creation-tool.repository';
import { CreationToolMapper } from '../mappers/creation-tool.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class CreationToolsRelationalRepository
  implements CreationToolRepository
{
  constructor(
    @InjectRepository(CreationToolEntity)
    private readonly repository: Repository<CreationToolEntity>,
  ) {}

  async create(data: CreationTool): Promise<CreationTool> {
    const persistenceModel = CreationToolMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return CreationToolMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterCreationToolDto | null;
    sortOptions?: SortCreationToolDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<CreationTool[]> {
    const where: FindOptionsWhere<CreationToolEntity> = {};

    if (filterOptions?.isActive !== undefined) {
      where.isActive = filterOptions.isActive;
    }

    if (filterOptions?.name) {
      where.name = Like(`%${filterOptions.name}%`);
    }

    if (filterOptions?.slug) {
      where.slug = filterOptions.slug;
    }

    if (filterOptions?.category) {
      where.category = filterOptions.category;
    }

    if (filterOptions?.workspaceId) {
      where.workspaceId = filterOptions.workspaceId;
    }

    const entities = await this.repository.find({
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

    return entities.map((entity) => CreationToolMapper.toDomain(entity));
  }

  async findAll(filters?: {
    isActive?: boolean;
    workspaceId?: string;
  }): Promise<CreationTool[]> {
    const where: FindOptionsWhere<CreationToolEntity> = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.workspaceId) {
      where.workspaceId = filters.workspaceId;
    }

    const entities = await this.repository.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return entities.map((entity) => CreationToolMapper.toDomain(entity));
  }

  async findById(id: CreationTool['id']): Promise<NullableType<CreationTool>> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? CreationToolMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<NullableType<CreationTool>> {
    const entity = await this.repository.findOne({ where: { slug } });
    return entity ? CreationToolMapper.toDomain(entity) : null;
  }

  async findByWorkspace(workspaceId: string): Promise<CreationTool[]> {
    const entities = await this.repository.find({
      where: { workspaceId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return entities.map((entity) => CreationToolMapper.toDomain(entity));
  }

  async update(
    id: CreationTool['id'],
    payload: Partial<CreationTool>,
  ): Promise<CreationTool | null> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    const updatedEntity = await this.repository.save(
      this.repository.create(
        CreationToolMapper.toPersistence({
          ...CreationToolMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return CreationToolMapper.toDomain(updatedEntity);
  }

  async remove(id: CreationTool['id']): Promise<void> {
    await this.repository.softDelete(id);
  }
}
