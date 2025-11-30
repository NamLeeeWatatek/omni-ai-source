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
    // Get all permissions
    const allPermissions = await this.permissionRepository.find();

    // Admin role - full permissions
    const adminPermissions = allPermissions; // Admin has all permissions

    // User role - limited permissions
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

    // Create/Update Admin role
    let adminRole = await this.roleRepository.findOne({
      where: { id: RoleEnum.admin },
      relations: ['permissions'],
    });

    if (!adminRole) {
      adminRole = this.roleRepository.create({
        id: RoleEnum.admin,
        name: 'Admin',
        description: 'Administrator with full access',
        casdoorRoleName: 'admin', // Map to Casdoor role
        permissions: adminPermissions,
      });
      await this.roleRepository.save(adminRole);
      console.log('✅ Created Admin role with all permissions');
    } else {
      adminRole.permissions = adminPermissions;
      adminRole.description = 'Administrator with full access';
      adminRole.casdoorRoleName = 'admin';
      await this.roleRepository.save(adminRole);
      console.log('✅ Updated Admin role permissions');
    }

    // Create/Update User role
    let userRole = await this.roleRepository.findOne({
      where: { id: RoleEnum.user },
      relations: ['permissions'],
    });

    if (!userRole) {
      userRole = this.roleRepository.create({
        id: RoleEnum.user,
        name: 'User',
        description: 'Regular user with limited access',
        casdoorRoleName: 'user', // Map to Casdoor role
        permissions: userPermissions,
      });
      await this.roleRepository.save(userRole);
      console.log('✅ Created User role with limited permissions');
    } else {
      userRole.permissions = userPermissions;
      userRole.description = 'Regular user with limited access';
      userRole.casdoorRoleName = 'user';
      await this.roleRepository.save(userRole);
      console.log('✅ Updated User role permissions');
    }
  }
}
