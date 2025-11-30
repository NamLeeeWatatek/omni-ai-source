import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionEntity } from '../../../../permissions/infrastructure/persistence/relational/entities/permission.entity';

@Injectable()
export class PermissionSeedService {
  constructor(
    @InjectRepository(PermissionEntity)
    private repository: Repository<PermissionEntity>,
  ) {}

  async run() {
    const permissions = [
      // Flow permissions
      {
        name: 'flow:create',
        description: 'Create flows',
        resource: 'flow',
        action: 'create',
      },
      {
        name: 'flow:read',
        description: 'View flows',
        resource: 'flow',
        action: 'read',
      },
      {
        name: 'flow:update',
        description: 'Edit flows',
        resource: 'flow',
        action: 'update',
      },
      {
        name: 'flow:delete',
        description: 'Delete flows',
        resource: 'flow',
        action: 'delete',
      },
      {
        name: 'flow:execute',
        description: 'Execute flows',
        resource: 'flow',
        action: 'execute',
      },

      // Bot permissions
      {
        name: 'bot:create',
        description: 'Create bots',
        resource: 'bot',
        action: 'create',
      },
      {
        name: 'bot:read',
        description: 'View bots',
        resource: 'bot',
        action: 'read',
      },
      {
        name: 'bot:update',
        description: 'Edit bots',
        resource: 'bot',
        action: 'update',
      },
      {
        name: 'bot:delete',
        description: 'Delete bots',
        resource: 'bot',
        action: 'delete',
      },

      // Channel permissions
      {
        name: 'channel:create',
        description: 'Create channels',
        resource: 'channel',
        action: 'create',
      },
      {
        name: 'channel:read',
        description: 'View channels',
        resource: 'channel',
        action: 'read',
      },
      {
        name: 'channel:update',
        description: 'Edit channels',
        resource: 'channel',
        action: 'update',
      },
      {
        name: 'channel:delete',
        description: 'Delete channels',
        resource: 'channel',
        action: 'delete',
      },

      // Template permissions
      {
        name: 'template:create',
        description: 'Create templates',
        resource: 'template',
        action: 'create',
      },
      {
        name: 'template:read',
        description: 'View templates',
        resource: 'template',
        action: 'read',
      },
      {
        name: 'template:update',
        description: 'Edit templates',
        resource: 'template',
        action: 'update',
      },
      {
        name: 'template:delete',
        description: 'Delete templates',
        resource: 'template',
        action: 'delete',
      },

      // Integration permissions
      {
        name: 'integration:create',
        description: 'Create integrations',
        resource: 'integration',
        action: 'create',
      },
      {
        name: 'integration:read',
        description: 'View integrations',
        resource: 'integration',
        action: 'read',
      },
      {
        name: 'integration:update',
        description: 'Edit integrations',
        resource: 'integration',
        action: 'update',
      },
      {
        name: 'integration:delete',
        description: 'Delete integrations',
        resource: 'integration',
        action: 'delete',
      },

      // User permissions
      {
        name: 'user:create',
        description: 'Create users',
        resource: 'user',
        action: 'create',
      },
      {
        name: 'user:read',
        description: 'View users',
        resource: 'user',
        action: 'read',
      },
      {
        name: 'user:update',
        description: 'Edit users',
        resource: 'user',
        action: 'update',
      },
      {
        name: 'user:delete',
        description: 'Delete users',
        resource: 'user',
        action: 'delete',
      },

      // Workspace permissions
      {
        name: 'workspace:create',
        description: 'Create workspaces',
        resource: 'workspace',
        action: 'create',
      },
      {
        name: 'workspace:read',
        description: 'View workspaces',
        resource: 'workspace',
        action: 'read',
      },
      {
        name: 'workspace:update',
        description: 'Edit workspaces',
        resource: 'workspace',
        action: 'update',
      },
      {
        name: 'workspace:delete',
        description: 'Delete workspaces',
        resource: 'workspace',
        action: 'delete',
      },

      // Settings permissions
      {
        name: 'settings:read',
        description: 'View settings',
        resource: 'settings',
        action: 'read',
      },
      {
        name: 'settings:update',
        description: 'Edit settings',
        resource: 'settings',
        action: 'update',
      },
    ];

    for (const permission of permissions) {
      const exists = await this.repository.findOne({
        where: { name: permission.name },
      });

      if (!exists) {
        await this.repository.save(this.repository.create(permission));
      }
    }

    console.log(`✅ Seeded ${permissions.length} permissions`);
  }
}
