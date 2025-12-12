import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NodeTypeEntity } from '../entities/node-type.entity';
import { NodeTypeMapper } from '../mappers/node-type.mapper';
import { NodeType } from '../../../../domain/node-type';
import { NodeTypeRepository } from '../../node-type.repository';
import { NodeCategoryId } from '../../../../types';
import { NullableType } from 'src/utils/types/nullable.type';

@Injectable()
export class NodeTypesRelationalRepository implements NodeTypeRepository {
  constructor(
    @InjectRepository(NodeTypeEntity)
    private readonly nodeTypeRepository: Repository<NodeTypeEntity>,
  ) {}

  async create(data: NodeType): Promise<NodeType> {
    const persistenceModel = NodeTypeMapper.toPersistence(data);
    const newEntity = await this.nodeTypeRepository.save(
      this.nodeTypeRepository.create(persistenceModel),
    );
    return NodeTypeMapper.toDomain(newEntity);
  }

  async findAll(category?: NodeCategoryId): Promise<NodeType[]> {
    const query = this.nodeTypeRepository
      .createQueryBuilder('nodeType')
      .where('nodeType.isActive = :isActive', { isActive: true })
      .orderBy('nodeType.sortOrder', 'ASC')
      .addOrderBy('nodeType.label', 'ASC');

    if (category) {
      query.andWhere('nodeType.category = :category', { category });
    }

    const entities = await query.getMany();
    return entities.map((entity) => NodeTypeMapper.toDomain(entity));
  }

  async findById(id: NodeType['id']): Promise<NullableType<NodeType>> {
    const entity = await this.nodeTypeRepository.findOne({
      where: { id, isActive: true },
    });

    return entity ? NodeTypeMapper.toDomain(entity) : null;
  }

  async update(
    id: NodeType['id'],
    payload: Partial<NodeType>,
  ): Promise<NodeType | null> {
    const entity = await this.nodeTypeRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    const updatedEntity = await this.nodeTypeRepository.save(
      this.nodeTypeRepository.create(
        NodeTypeMapper.toPersistence({
          ...NodeTypeMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return NodeTypeMapper.toDomain(updatedEntity);
  }

  async remove(id: NodeType['id']): Promise<void> {
    await this.nodeTypeRepository.update(id, { isActive: false });
  }

  async getCategories(): Promise<{ id: string; label: string }[]> {
    const result = await this.nodeTypeRepository
      .createQueryBuilder('nodeType')
      .select('nodeType.category', 'id')
      .addSelect('nodeType.category', 'label')
      .where('nodeType.isActive = :isActive', { isActive: true })
      .groupBy('nodeType.category')
      .getRawMany();

    return result;
  }
}
