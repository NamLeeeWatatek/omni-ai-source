import { Injectable } from '@nestjs/common';
import { User } from '../users/domain/user';
import { RoleEnum } from '../roles/roles.enum';
import { UserCapabilitiesDto } from './dto/user-capabilities.dto';
import { PermissionCheckResponseDto } from './dto/permission-check.dto';

@Injectable()
export class PermissionsService {
  getUserCapabilities(user: User): UserCapabilitiesDto {
    const isAdmin = user.role === 'admin';
    const customPermissions = user.permissions || {};

    const basePermissions = this.getBasePermissions(user.role);

    const allPermissions = [
      ...basePermissions,
      ...Object.keys(customPermissions).filter((key) => customPermissions[key]),
    ];

    const resources = [
      'user',
      'flow',
      'template',
      'bot',
      'channel',
      'integration',
      'settings',
      'analytics',
      'metadata',
    ];

    const can_create: Record<string, boolean> = {};
    const can_read: Record<string, boolean> = {};
    const can_update: Record<string, boolean> = {};
    const can_delete: Record<string, boolean> = {};

    resources.forEach((resource) => {
      can_create[resource] =
        isAdmin || allPermissions.includes(`${resource}:write`);
      can_read[resource] =
        isAdmin || allPermissions.includes(`${resource}:read`);
      can_update[resource] =
        isAdmin || allPermissions.includes(`${resource}:write`);
      can_delete[resource] =
        isAdmin || allPermissions.includes(`${resource}:delete`);
    });

    return {
      role: isAdmin ? 'admin' : 'user',
      permissions: allPermissions,
      can_create,
      can_read,
      can_update,
      can_delete,
      can_execute: {
        flow: isAdmin || allPermissions.includes('flows:write'),
      },
      widgets: {
        user_management: isAdmin,
        flow_builder: isAdmin || allPermissions.includes('flows:write'),
        template_editor: isAdmin || allPermissions.includes('templates:write'),
        bot_manager: isAdmin || allPermissions.includes('bots:write'),
        channel_manager: isAdmin,
        integration_manager: isAdmin,
        analytics_dashboard: true,
        settings_panel: isAdmin,
        metadata_editor: isAdmin,
        flow_viewer: true,
        template_viewer: true,
        bot_viewer: true,
        channel_viewer: true,
        analytics_viewer: true,
      },
      features: {
        can_export_analytics: isAdmin,
        can_manage_users: isAdmin,
        can_delete_flows: isAdmin || allPermissions.includes('flows:delete'),
        can_delete_templates:
          isAdmin || allPermissions.includes('templates:delete'),
        can_delete_bots: isAdmin || allPermissions.includes('bots:delete'),
        can_manage_integrations: isAdmin,
        can_update_settings: isAdmin,
        is_admin: isAdmin,
        is_super_admin: false,
      },
    };
  }

  checkPermissions(
    user: User,
    requiredPermissions: string[],
  ): PermissionCheckResponseDto {
    const capabilities = this.getUserCapabilities(user);
    const userPermissions = new Set(capabilities.permissions);

    if (capabilities.role === 'admin') {
      return {
        hasPermission: true,
        missingPermissions: [],
      };
    }

    const missingPermissions = requiredPermissions.filter(
      (perm) => !userPermissions.has(perm),
    );

    return {
      hasPermission: missingPermissions.length === 0,
      missingPermissions,
    };
  }

  private getBasePermissions(role?: 'admin' | 'user'): string[] {
    if (role === 'admin') {
      return [
        'flows:read',
        'flows:write',
        'flows:delete',
        'templates:read',
        'templates:write',
        'templates:delete',
        'users:read',
        'users:write',
        'users:delete',
        'settings:read',
        'settings:write',
        'bots:read',
        'bots:write',
        'conversations:read',
        'conversations:write',
      ];
    }

    return ['flows:read', 'flows:write', 'templates:read', 'bots:read'];
  }
}
