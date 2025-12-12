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
  ) {}

  async create(data: FlowCreateData): Promise<Flow> {
    const entity = new FlowEntity();
    Object.assign(entity, data);
    const savedEntity = await this.flowRepository.save(entity);
    return FlowMapper.toDomain(savedEntity);
  }

  async findAll(options?: {
    ownerId?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Flow[]> {
    const query = this.flowRepository.createQueryBuilder('flow');

    if (options?.ownerId) {
      query.andWhere('flow.ownerId = :ownerId', { ownerId: options.ownerId });
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
      relations: ['owner'],
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
    ownerId?: string;
    status?: string;
    published?: boolean;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Flow[]> {
    const query = this.flowRepository.createQueryBuilder('flow');

    if (options.published === true) {
      // Show ALL published flows (status = 'published')
      query.where('flow.status = :status', { status: 'published' });
    } else if (options.published === false) {
      // If explicitly asking for unpublished, filter by owner
      if (options.ownerId) {
        query.where('flow.ownerId = :ownerId', { ownerId: options.ownerId });
        query.andWhere('flow.status != :status', { status: 'published' });
      } else {
        query.where('flow.status != :status', { status: 'published' });
      }
    } else {
      // No published filter - show user's own flows
      if (options.ownerId) {
        query.where('flow.ownerId = :ownerId', { ownerId: options.ownerId });
      }
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
    ownerId?: string;
    status?: string;
  }): Promise<number> {
    const query = this.flowRepository.createQueryBuilder('flow');

    if (options?.ownerId) {
      query.andWhere('flow.ownerId = :ownerId', { ownerId: options.ownerId });
    }

    if (options?.status) {
      query.andWhere('flow.status = :status', { status: options.status });
    }

    return query.getCount();
  }
}
