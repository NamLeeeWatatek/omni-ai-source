import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/domain/user';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { RoleEntity } from '../roles/infrastructure/persistence/relational/entities/role.entity';
import { PermissionEntity } from './infrastructure/persistence/relational/entities/permission.entity';
import { UserCapabilitiesDto } from './dto/user-capabilities.dto';
import { PermissionCheckResponseDto } from './dto/permission-check.dto';
import { WorkspaceMemberEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly workspaceMemberRepository: Repository<WorkspaceMemberEntity>,
  ) { }

  async findAll() {
    return this.permissionRepository.find({
      order: {
        resource: 'ASC',
        action: 'ASC'
      }
    });
  }

  async create(dto: any) {
    const permission = this.permissionRepository.create(dto);
    return this.permissionRepository.save(permission);
  }

  async remove(id: string) {
    await this.permissionRepository.delete(id);
  }

  async getUserCapabilities(user: User, workspaceId?: string): Promise<UserCapabilitiesDto> {
    const userWithPermissions = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['role', 'role.permissions'],
    });

    if (!userWithPermissions) {
      throw new Error('User not found');
    }

    // Level 1: System Admin Check
    // If the user has a System Global Role of 'Admin' (or equivalent permission '*'), they have full access everywhere.
    const systemRole = userWithPermissions.role;
    const systemPermissions = systemRole?.permissions?.map(p => `${p.resource}:${p.action}`) || [];
    const isSystemAdmin = systemRole?.name === 'Admin' || systemPermissions.includes('*');

    let appliedRole = systemRole;
    let appliedClassName = systemRole?.name || 'User';

    // Level 2: Workspace Role Check (Per-Tenant)
    // If not System Admin, and we have a workspace context, we fetch the per-tenant role.
    if (!isSystemAdmin && workspaceId) {
      const member = await this.workspaceMemberRepository.findOne({
        where: { userId: user.id, workspaceId },
        relations: ['role', 'role.permissions'],
      });

      if (member && member.role) {
        appliedRole = member.role;
        appliedClassName = member.role.name || 'Member';
      } else {
        // If user is not a member of the workspace, or has no role??
        // Fallback to basic user, effectively no access.
        // Actually, if they are not a member, they shouldn't access most things.
        // We'll keep system permissions as base, but this usually implies restricted access.
      }
    }

    const rolePermissions = appliedRole?.permissions?.map(p => `${p.resource}:${p.action}`) || [];
    const inlinePermissions = userWithPermissions.permissions ?
      Object.keys(userWithPermissions.permissions).filter(k => userWithPermissions.permissions?.[k]) : [];

    // Merge System Permissions (Global) + Workspace Role Permissions (Local)
    // Actually, usually System Role permissions are additive.
    // If you are 'User' globally, but 'Admin' in Workspace, you get Admin.
    // So we should merge them effectively.
    const allPermissions = Array.from(new Set([...systemPermissions, ...rolePermissions, ...inlinePermissions]));

    // isAdmin flag usually implies "Bypass all checks".
    // We only want System Admin (Super Admin) to bypass everything.
    const isAdmin = isSystemAdmin;

    // For UI widgets, we might want to know if they are AT LEAST a workspace admin (Owner/Admin)
    const isWorkspaceAdmin = appliedClassName === 'Admin' || appliedClassName === 'Owner';

    const check = (action: string) => {
      if (isAdmin) return true;
      if (allPermissions.includes('*')) return true;
      if (allPermissions.includes(action)) return true;

      const [service] = action.split(':');
      if (allPermissions.includes(`${service}:*`)) return true;

      return false;
    };

    const can_create: Record<string, boolean> = {
      user: check('iam:CreateUser'),
      role: check('iam:CreateRole'),
      flow: check('flows:CreateFlow'),
      template: check('templates:CreateTemplate'),
      bot: check('chatbot:CreateBot'),
      channel: check('channels:CreateChannel'),
      integration: check('integrations:CreateIntegration'), // or Connect
      workspace: check('workspaces:CreateWorkspace'),
      file: check('files:UploadFile'),
    };

    const can_read: Record<string, boolean> = {
      user: check('iam:ListUsers') || check('iam:GetUser'), // Read usually implies List or Get
      role: check('iam:ListRoles') || check('iam:GetRole'),
      flow: check('flows:ListFlows') || check('flows:GetFlow'),
      template: check('templates:ListTemplates') || check('templates:GetTemplate'),
      bot: check('chatbot:ListBots') || check('chatbot:GetBot'),
      channel: check('channels:ListChannels'),
      integration: check('integrations:ListIntegrations'),
      workspace: check('workspaces:ListWorkspaces'),
      file: check('files:ListFiles'),
      settings: check('system:ReadSettings'),
      audit: check('system:ReadAuditLogs'),
    };

    const can_update: Record<string, boolean> = {
      user: check('iam:UpdateUser'),
      role: check('iam:UpdateRole'),
      flow: check('flows:UpdateFlow'),
      template: check('templates:UpdateTemplate'),
      bot: check('chatbot:UpdateBot'),
      channel: check('channels:UpdateChannel'),
      integration: check('integrations:UpdateIntegration'),
      workspace: check('workspaces:UpdateWorkspace'),
      settings: check('system:UpdateSettings'),
    };

    const can_delete: Record<string, boolean> = {
      user: check('iam:DeleteUser'),
      role: check('iam:DeleteRole'),
      flow: check('flows:DeleteFlow'),
      template: check('templates:DeleteTemplate'),
      bot: check('chatbot:DeleteBot'),
      channel: check('channels:DeleteChannel'),
      integration: check('integrations:DeleteIntegration'), // Disconnect
      workspace: check('workspaces:DeleteWorkspace'),
      file: check('files:DeleteFile'),
    };

    return {
      role: appliedClassName?.toLowerCase() || 'user',
      permissions: allPermissions,
      can_create,
      can_read,
      can_update,
      can_delete,
      can_execute: {
        flow: check('flows:ExecuteFlow'),
      },
      widgets: {
        user_management: check('iam:ListUsers'),
        flow_builder: check('flows:CreateFlow') || check('flows:UpdateFlow'),
        template_editor: check('templates:CreateTemplate') || check('templates:UpdateTemplate'),
        bot_manager: check('chatbot:ListBots'),
        channel_manager: check('channels:ListChannels'),
        integration_manager: check('integrations:ListIntegrations'),
        analytics_dashboard: check('analytics:ViewDashboard'), // If we add analytics
        settings_panel: check('system:ReadSettings'), // Or workspace settings?
        metadata_editor: isAdmin, // Only System Admin should edit metadata globally
        flow_viewer: check('flows:ListFlows'),
        template_viewer: check('templates:ListTemplates'),
        bot_viewer: check('chatbot:ListBots'),
        channel_viewer: check('channels:ListChannels'),
        analytics_viewer: true,
      },
      features: {
        can_export_analytics: isAdmin,
        can_manage_users: check('iam:ListUsers'),
        can_delete_flows: check('flows:DeleteFlow'),
        can_delete_templates: check('templates:DeleteTemplate'),
        can_delete_bots: check('chatbot:DeleteBot'),
        can_manage_integrations: check('integrations:ListIntegrations'),
        can_update_settings: check('system:UpdateSettings'),
        is_admin: isWorkspaceAdmin || isSystemAdmin, // Used for UI "Admin" badge/section. 
        is_super_admin: isSystemAdmin,
      },
    };
  }

  async checkPermissions(
    user: User,
    requiredPermissions: string[],
    workspaceId?: string,
  ): Promise<PermissionCheckResponseDto> {
    const capabilities = await this.getUserCapabilities(user, workspaceId);
    const userPermissions = new Set(capabilities.permissions);

    if (capabilities.features.is_admin) {
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
}
