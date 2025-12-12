import { Injectable } from '@nestjs/common';
import { NodeCategory, NodeType } from './types';
import { NodeTypeRepository } from './infrastructure/persistence/node-type.repository';
// Import proper domain type for return and usage
import { NodeType as NodeTypeDomain } from './domain/node-type';

@Injectable()
export class NodeTypesService {
  constructor(private readonly nodeTypeRepository: NodeTypeRepository) {}

  private readonly categories: NodeCategory[] = [
    { id: 'trigger', label: 'Triggers', color: '#4CAF50' },
    { id: 'messaging', label: 'Messaging', color: '#9C27B0' },
    { id: 'ai', label: 'AI', color: '#00BCD4' },
    { id: 'integration', label: 'Integrations', color: '#7C4DFF' },
    { id: 'data', label: 'Data', color: '#607D8B' },
    { id: 'logic', label: 'Logic', color: '#FFC107' },
    { id: 'transform', label: 'Transform', color: '#3F51B5' },
  ];

  async findAll(category?: NodeCategory['id']): Promise<NodeTypeDomain[]> {
    return this.nodeTypeRepository.findAll(category);
  }

  async findOne(id: string): Promise<NodeTypeDomain | null> {
    return this.nodeTypeRepository.findById(id);
  }

  async getCategories(): Promise<NodeCategory[]> {
    try {
      const result = await this.nodeTypeRepository.getCategories();

      if (result.length === 0) {
        return this.categories;
      }

      return result.map((cat) => ({
        ...cat,
        id: cat.id as any, // Cast to NodeCategoryId if needed
        color: this.categories.find((c) => c.id === cat.id)?.color || '#607D8B',
      }));
    } catch (error) {
      return this.categories;
    }
  }

  async create(
    data: Omit<NodeTypeDomain, 'createdAt' | 'updatedAt'>,
  ): Promise<NodeTypeDomain> {
    return this.nodeTypeRepository.create(data);
  }

  async update(
    id: string,
    data: Partial<NodeTypeDomain>,
  ): Promise<NodeTypeDomain> {
    const updated = await this.nodeTypeRepository.update(id, data);
    if (!updated) {
      throw new Error(`Node type ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    return this.nodeTypeRepository.remove(id);
  }
}
