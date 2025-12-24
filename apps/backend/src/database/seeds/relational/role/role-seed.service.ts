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
  ) {}

  async run() {
    const allPermissions = await this.permissionRepository.find();

    const adminPermissions = allPermissions;

    const userPermissions = allPermissions.filter((p) =>
      [
        'flow:read',
        'flow:execute',
        'bot:read',
        'channel:read',
        'template:read',
        'integration:read',
        'workspace:read',
        'settings:read',
      ].includes(p.name),
    );

    const roles = [
      {
        id: RoleEnum.admin,
        name: 'Admin',
        description: 'Administrator with full access',
        permissions: adminPermissions,
      },
      {
        id: RoleEnum.user,
        name: 'User',
        description: 'Regular user with limited access',
        permissions: userPermissions,
      },
      {
        id: RoleEnum.member,
        name: 'Member',
        description: 'Workspace member',
        permissions: userPermissions,
      },
      {
        id: RoleEnum.owner,
        name: 'Owner',
        description: 'Workspace owner',
        permissions: adminPermissions,
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
