import { Flow } from 'src/flows/domain/flow';
import { FlowEntity } from '../entities/flow.entity';

export class FlowMapper {
  static toDomain(entity: FlowEntity): Flow {
    const domain = new Flow({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      status: entity.status as any,
      version: entity.version,
      nodes: entity.nodes,
      edges: entity.edges,
      workspaceId: entity.workspaceId,
      ownerId: entity.ownerId,
      visibility: entity.visibility as any,
      tags: entity.tags,
      category: entity.category,
      icon: entity.icon,
      teamId: entity.teamId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
    return domain;
  }

  static toPersistence(domain: Flow): FlowEntity {
    const entity = new FlowEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.status = domain.status;
    entity.version = domain.version;
    entity.nodes = domain.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data ?? {},
    }));
    entity.edges = domain.edges;
    entity.workspaceId = domain.workspaceId;
    entity.ownerId = domain.ownerId;
    entity.visibility = domain.visibility;
    entity.tags = domain.tags;
    entity.category = domain.category;
    entity.icon = domain.icon;
    entity.teamId = domain.teamId;
    if (domain.createdAt) {
      entity.createdAt = domain.createdAt;
    }
    if (domain.updatedAt) {
      entity.updatedAt = domain.updatedAt;
    }
    return entity;
  }

  static toPersistencePartial(domain: Partial<Flow>): Partial<FlowEntity> {
    const entity: Partial<FlowEntity> = {};

    if (domain.name !== undefined) entity.name = domain.name;
    if (domain.description !== undefined)
      entity.description = domain.description;
    if (domain.status !== undefined) entity.status = domain.status;
    if (domain.version !== undefined) entity.version = domain.version;
    if (domain.nodes !== undefined) {
      entity.nodes = domain.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data ?? {},
      }));
    }
    if (domain.edges !== undefined) entity.edges = domain.edges;
    if (domain.workspaceId !== undefined)
      entity.workspaceId = domain.workspaceId;
    if (domain.ownerId !== undefined) entity.ownerId = domain.ownerId;
    if (domain.visibility !== undefined) entity.visibility = domain.visibility;
    if (domain.tags !== undefined) entity.tags = domain.tags;
    if (domain.category !== undefined) entity.category = domain.category;
    if (domain.icon !== undefined) entity.icon = domain.icon;
    if (domain.teamId !== undefined) entity.teamId = domain.teamId;

    return entity;
  }
}
