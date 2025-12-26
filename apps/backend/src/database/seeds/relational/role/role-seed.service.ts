import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { PermissionEntity } from '../../../../permissions/infrastructure/persistence/relational/entities/permission.entity';
import { RoleEnum } from '../../../../roles/roles.enum';

@Injectable()
export class RoleSeedService {
  constructor(
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private permissionRepository: Repository<PermissionEntity>,
  ) { }

  async run() {
    const allPermissions = await this.permissionRepository.find();

    const adminPermissions = allPermissions;

    const ownerPermissions = allPermissions.filter((p) => {
      // Exclude System and IAM permissions for Workspace Owner
      if (p.name.startsWith('iam:') || p.name.startsWith('system:')) {
        return false;
      }
      // Exclude global wildcards if any (like '*')
      if (p.name === '*') return false;
      return true;
    });

    const userPermissions = allPermissions.filter((p) =>
      [
        'flows:ListFlows',
        'flows:GetFlow',
        'flows:ExecuteFlow',
        'chatbot:ListBots',
        'chatbot:GetBot',
        'chatbot:ExecuteBot',
        'templates:ListTemplates',
        'templates:GetTemplate',
        'files:ListFiles',
        'workspaces:ListWorkspaces',
        'workspaces:GetWorkspace',
        'integrations:ListIntegrations',
        // 'system:ReadSettings' // Users shouldn't read system settings? Maybe workspace settings.
      ].includes(p.name),
    );

    const roles = [
      {
        id: RoleEnum.admin,
        name: 'Admin',
        description: 'System Administrator with full access to everything',
        permissions: adminPermissions,
      },
      {
        id: RoleEnum.user,
        name: 'User',
        description: 'Regular system user',
        permissions: userPermissions,
      },
      {
        id: RoleEnum.member,
        name: 'Member',
        description: 'Workspace member with standard access',
        permissions: userPermissions,
      },
      {
        id: RoleEnum.owner,
        name: 'Owner',
        description: 'Workspace owner with full access to workspace resources',
        permissions: ownerPermissions,
      },
    ];

    for (const roleData of roles) {
      let role = await this.roleRepository.findOne({
        where: { id: roleData.id },
        relations: ['permissions'],
      });

      if (!role) {
        role = this.roleRepository.create(roleData);
      } else {
        role.name = roleData.name;
        role.description = roleData.description;
        role.permissions = roleData.permissions;
      }
      await this.roleRepository.save(role);
    }
  }
}
