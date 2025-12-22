import { Template } from '../../../../domain/template';
import { TemplateEntity } from '../entities/template.entity';

export class TemplateMapper {
  static toDomain(raw: TemplateEntity): Template {
    const domainEntity = new Template();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.description = raw.description;
    domainEntity.prompt = raw.prompt;
    domainEntity.mediaFiles = raw.mediaFiles;
    domainEntity.styleConfig = raw.styleConfig;
    domainEntity.category = raw.category;
    domainEntity.isActive = raw.isActive;
    domainEntity.createdBy = raw.createdBy;
    domainEntity.workspaceId = raw.workspaceId;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Template): TemplateEntity {
    const persistenceEntity = new TemplateEntity();

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    persistenceEntity.name = domainEntity.name;
    persistenceEntity.description = domainEntity.description;
    persistenceEntity.prompt = domainEntity.prompt;
    persistenceEntity.mediaFiles = domainEntity.mediaFiles;
    persistenceEntity.styleConfig = domainEntity.styleConfig;
    persistenceEntity.category = domainEntity.category;
    persistenceEntity.isActive = domainEntity.isActive ?? true;
    persistenceEntity.createdBy = domainEntity.createdBy;
    persistenceEntity.workspaceId = domainEntity.workspaceId;

    if (domainEntity.createdAt) {
      persistenceEntity.createdAt = domainEntity.createdAt;
    }
    if (domainEntity.updatedAt) {
      persistenceEntity.updatedAt = domainEntity.updatedAt;
    }
    if (domainEntity.deletedAt) {
      persistenceEntity.deletedAt = domainEntity.deletedAt;
    }

    return persistenceEntity;
  }
}
