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
    domainEntity.isPremium = raw.isPremium;
    domainEntity.isActive = raw.isActive;
    domainEntity.isTrigger = raw.isTrigger;
    domainEntity.properties = raw.properties;
    domainEntity.executor = raw.executor;
    domainEntity.sortOrder = raw.sortOrder;
    domainEntity.outputSchema = raw.outputSchema;
    domainEntity.metadata = raw.metadata;
    domainEntity.tags = raw.tags;
    domainEntity.workspaceId = raw.workspaceId ?? undefined;
    domainEntity.createdBy = raw.createdBy ?? undefined;
    domainEntity.updatedBy = raw.updatedBy ?? undefined;
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
    persistenceEntity.isPremium = domainEntity.isPremium ?? false;
    persistenceEntity.isActive = domainEntity.isActive ?? true;
    persistenceEntity.isTrigger = domainEntity.isTrigger ?? false;
    persistenceEntity.properties = domainEntity.properties || [];
    persistenceEntity.executor = domainEntity.executor;
    persistenceEntity.sortOrder = domainEntity.sortOrder ?? 0;
    persistenceEntity.outputSchema = domainEntity.outputSchema;
    persistenceEntity.metadata = domainEntity.metadata;
    persistenceEntity.tags = domainEntity.tags;
    persistenceEntity.workspaceId = domainEntity.workspaceId;
    persistenceEntity.createdBy = domainEntity.createdBy;
    persistenceEntity.updatedBy = domainEntity.updatedBy;
    if (domainEntity.createdAt) {
      persistenceEntity.createdAt = domainEntity.createdAt;
    }
    if (domainEntity.updatedAt) {
      persistenceEntity.updatedAt = domainEntity.updatedAt;
    }

    return persistenceEntity;
  }
}
