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

    let adminRole = await this.roleRepository.findOne({
      where: { id: RoleEnum.admin },
      relations: ['permissions'],
    });

    if (!adminRole) {
      adminRole = this.roleRepository.create({
        id: RoleEnum.admin,
        name: 'Admin',
        description: 'Administrator with full access',
        casdoorRoleName: 'admin',
        permissions: adminPermissions,
      });
      await this.roleRepository.save(adminRole);
    } else {
      adminRole.permissions = adminPermissions;
      adminRole.description = 'Administrator with full access';
      adminRole.casdoorRoleName = 'admin';
      await this.roleRepository.save(adminRole);
    }

    let userRole = await this.roleRepository.findOne({
      where: { id: RoleEnum.user },
      relations: ['permissions'],
    });

    if (!userRole) {
      userRole = this.roleRepository.create({
        id: RoleEnum.user,
        name: 'User',
        description: 'Regular user with limited access',
        casdoorRoleName: 'user',
        permissions: userPermissions,
      });
      await this.roleRepository.save(userRole);
    } else {
      userRole.permissions = userPermissions;
      userRole.description = 'Regular user with limited access';
      userRole.casdoorRoleName = 'user';
      await this.roleRepository.save(userRole);
    }
  }
}
