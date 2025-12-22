import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlowRepository } from '../../flow.repository';
import { FlowEntity } from '../entities/flow.entity';
import { FlowMapper } from '../mappers/flow.mapper';
import { Flow, FlowCreateData, FlowUpdateData } from 'src/flows/domain/flow';

@Injectable()
export class RelationalFlowRepository implements FlowRepository {
  constructor(
    @InjectRepository(FlowEntity)
    private readonly flowRepository: Repository<FlowEntity>,
  ) { }

  async create(data: FlowCreateData): Promise<Flow> {
    const entity = new FlowEntity();
    Object.assign(entity, data);
    const savedEntity = await this.flowRepository.save(entity);
    return FlowMapper.toDomain(savedEntity);
  }

  async findAll(options?: {
    workspaceId?: string;
    ownerId?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Flow[]> {
    const query = this.flowRepository.createQueryBuilder('flow');

    if (options?.workspaceId) {
      query.andWhere('flow.workspaceId = :workspaceId', {
        workspaceId: options.workspaceId,
      });
    }

    if (options?.status) {
      query.andWhere('flow.status = :status', { status: options.status });
    }

    if (options?.category) {
      query.andWhere('flow.category = :category', {
        category: options.category,
      });
    }

    if (options?.limit) {
      query.take(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    query.orderBy('flow.createdAt', 'DESC');

    const entities = await query.getMany();
    return entities.map((entity) => FlowMapper.toDomain(entity));
  }

  async findPublished(options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Flow[]> {
    return this.findAll({
      ...options,
      status: 'published',
    });
  }

  async findById(id: Flow['id']): Promise<Flow | null> {
    const entity = await this.flowRepository.findOne({
      where: { id },
    });

    return entity ? FlowMapper.toDomain(entity) : null;
  }

  async findByOwnerId(
    ownerId: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Flow[]> {
    return this.findAll({
      ...options,
      ownerId,
    });
  }

  async update(id: Flow['id'], payload: FlowUpdateData): Promise<Flow | null> {
    const updateData = FlowMapper.toPersistencePartial(payload);
    await this.flowRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: Flow['id']): Promise<void> {
    await this.flowRepository.delete(id);
  }

  async findAllComplex(options: {
    workspaceId?: string;
    ownerId?: string;
    status?: string;
    published?: boolean;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Flow[]> {
    const query = this.flowRepository.createQueryBuilder('flow');

    if (options.workspaceId) {
      query.andWhere('flow.workspaceId = :workspaceId', {
        workspaceId: options.workspaceId,
      });
    }

    if (options.published === true) {
      // Show ALL published flows (status = 'published')
      query.andWhere('flow.status = :status', { status: 'published' });
    } else if (options.published === false) {
      // If explicitly asking for unpublished, filter by owner
      if (options.ownerId) {
        query.andWhere('flow.ownerId = :ownerId', { ownerId: options.ownerId });
      }
      query.andWhere('flow.status != :status', { status: 'published' });
    } else if (options.ownerId) {
      // No published filter - show user's own flows
      query.andWhere('flow.ownerId = :ownerId', { ownerId: options.ownerId });
    }

    if (options.category) {
      query.andWhere('flow.category = :category', {
        category: options.category,
      });
    }

    if (options.limit) {
      query.take(options.limit);
    }

    if (options.offset) {
      query.skip(options.offset);
    }

    query.orderBy('flow.createdAt', 'DESC');

    const entities = await query.getMany();
    return entities.map((entity) => FlowMapper.toDomain(entity));
  }

  async count(options?: {
    workspaceId?: string;
    ownerId?: string;
    status?: string;
  }): Promise<number> {
    const query = this.flowRepository.createQueryBuilder('flow');

    if (options?.workspaceId) {
      query.andWhere('flow.workspaceId = :workspaceId', {
        workspaceId: options.workspaceId,
      });
    }

    if (options?.status) {
      query.andWhere('flow.status = :status', { status: options.status });
    }

    return query.getCount();
  }

  async findAllPaginated(options: {
    workspaceId?: string;
    ownerId?: string;
    status?: string;
    published?: boolean;
    category?: string;
    limit?: number;
    offset?: number;
    page?: number;
    search?: string;
    sort?: { orderBy: string; order: 'ASC' | 'DESC' }[];
  }): Promise<{
    data: Flow[];
    hasNextPage: boolean;
    total: number;
  }> {
    const query = this.flowRepository.createQueryBuilder('flow');

    if (options?.workspaceId) {
      query.andWhere('flow.workspaceId = :workspaceId', {
        workspaceId: options.workspaceId,
      });
    }

    if (options?.status) {
      query.andWhere('flow.status = :status', { status: options.status });
    }

    if (options.published === true) {
      // Show ALL published flows (status = 'published')
      query.andWhere('flow.status = :status', { status: 'published' });
    } else if (options.published === false) {
      // If explicitly asking for unpublished, filter by owner
      if (options.ownerId) {
        query.andWhere('flow.ownerId = :ownerId', { ownerId: options.ownerId });
      }
      query.andWhere('flow.status != :status', { status: 'published' });
    } else if (options.ownerId) {
      // No published filter - show user's own flows
      query.andWhere('flow.ownerId = :ownerId', { ownerId: options.ownerId });
    }

    if (options.category) {
      query.andWhere('flow.category = :category', {
        category: options.category,
      });
    }

    if (options.search) {
      query.andWhere('flow.name ILIKE :search', {
        search: `%${options.search}%`,
      });
    }

    if (options.sort && options.sort.length > 0) {
      options.sort.forEach((sortOption) => {
        if (sortOption.orderBy && (sortOption.orderBy as any) !== 'undefined') {
          query.addOrderBy(
            `flow.${sortOption.orderBy}`,
            sortOption.order.toUpperCase() as 'ASC' | 'DESC',
          );
        }
      });
    }

    // Calculate pagination
    const limit = options.limit || 10;
    const page = options.page || 1;
    const offset = options.offset || (page - 1) * limit;

    if (options.limit) {
      query.take(limit);
    }

    if (options.offset !== undefined) {
      query.skip(offset);
    }

    const [entities, total] = await query.getManyAndCount();

    return {
      data: entities.map((entity) => FlowMapper.toDomain(entity)),
      hasNextPage: offset + entities.length < total,
      total,
    };
  }
}
