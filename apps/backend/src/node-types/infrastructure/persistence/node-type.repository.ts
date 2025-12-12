import { NodeCategoryId } from '../../types';
import { NodeType } from '../../domain/node-type';
import { NullableType } from 'src/utils/types/nullable.type';

export abstract class NodeTypeRepository {
  abstract create(
    data: Omit<NodeType, 'createdAt' | 'updatedAt'>,
  ): Promise<NodeType>;

  abstract findAll(category?: NodeCategoryId): Promise<NodeType[]>;

  abstract findById(id: NodeType['id']): Promise<NullableType<NodeType>>;

  abstract update(
    id: NodeType['id'],
    payload: Partial<NodeType>,
  ): Promise<NodeType | null>;

  abstract remove(id: NodeType['id']): Promise<void>;

  abstract getCategories(): Promise<{ id: string; label: string }[]>;
}
