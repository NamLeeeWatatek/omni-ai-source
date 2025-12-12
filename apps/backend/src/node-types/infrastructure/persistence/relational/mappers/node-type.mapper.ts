import { NodeType } from '../../../../domain/node-type';
import { NodeTypeEntity } from '../entities/node-type.entity';

export class NodeTypeMapper {
  static toDomain(raw: NodeTypeEntity): NodeType {
    const domainEntity = new NodeType();
    domainEntity.id = raw.id;
    domainEntity.label = raw.label;
    domainEntity.category = raw.category;
    domainEntity.color = raw.color;
    domainEntity.description = raw.description;
    domainEntity.isActive = raw.isActive;
    domainEntity.properties = raw.properties;
    domainEntity.outputSchema = raw.outputSchema;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: NodeType): NodeTypeEntity {
    const persistenceEntity = new NodeTypeEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.label = domainEntity.label;
    persistenceEntity.category = domainEntity.category;
    persistenceEntity.color = domainEntity.color;
    persistenceEntity.description = domainEntity.description;
    persistenceEntity.properties = domainEntity.properties || [];
    persistenceEntity.outputSchema = domainEntity.outputSchema;
    if (domainEntity.createdAt) {
      persistenceEntity.createdAt = domainEntity.createdAt;
    }
    if (domainEntity.updatedAt) {
      persistenceEntity.updatedAt = domainEntity.updatedAt;
    }

    return persistenceEntity;
  }
}
