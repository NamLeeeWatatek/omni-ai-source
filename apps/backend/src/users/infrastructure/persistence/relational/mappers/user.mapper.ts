import { User } from '../../../../domain/user';
import { UserEntity } from '../entities/user.entity';

export class UserMapper {
  static toDomain(raw: UserEntity): User {
    const domainEntity = new User();
    domainEntity.id = raw.id;
    domainEntity.email = raw.email;
    domainEntity.name = raw.name;
    domainEntity.avatarUrl = raw.avatarUrl;
    domainEntity.password = raw.password;
    domainEntity.provider = raw.provider;
    domainEntity.providerId = raw.providerId;
    domainEntity.emailVerifiedAt = raw.emailVerifiedAt;
    domainEntity.isActive = raw.isActive;
    domainEntity.role = raw.role;

    domainEntity.firstName = raw.firstName;
    domainEntity.lastName = raw.lastName;
    domainEntity.socialId = raw.socialId;

    domainEntity.externalId = raw.externalId;
    domainEntity.casdoorId = raw.casdoorId;
    domainEntity.permissions = raw.permissions;
    domainEntity.lastLogin = raw.lastLogin;
    domainEntity.failedLoginAttempts = raw.failedLoginAttempts;
    domainEntity.lockedUntil = raw.lockedUntil;

    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: User): UserEntity {
    const persistenceEntity = new UserEntity();

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    persistenceEntity.email = domainEntity.email;
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.avatarUrl = domainEntity.avatarUrl;
    persistenceEntity.password = domainEntity.password;
    persistenceEntity.provider = domainEntity.provider;
    persistenceEntity.providerId = domainEntity.providerId;
    persistenceEntity.emailVerifiedAt = domainEntity.emailVerifiedAt;
    persistenceEntity.isActive = domainEntity.isActive ?? true;
    persistenceEntity.role = domainEntity.role ?? 'user';

    persistenceEntity.firstName = domainEntity.firstName;
    persistenceEntity.lastName = domainEntity.lastName;
    persistenceEntity.socialId = domainEntity.socialId;

    persistenceEntity.externalId = domainEntity.externalId;
    persistenceEntity.casdoorId = domainEntity.casdoorId;
    persistenceEntity.permissions = domainEntity.permissions;
    persistenceEntity.lastLogin = domainEntity.lastLogin;
    persistenceEntity.failedLoginAttempts =
      domainEntity.failedLoginAttempts ?? 0;
    persistenceEntity.lockedUntil = domainEntity.lockedUntil;

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
