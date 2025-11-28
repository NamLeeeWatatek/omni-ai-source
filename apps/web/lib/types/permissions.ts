/**
 * Permission Types
 * Matches backend RBAC system
 */

export type Role = 
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'editor'
  | 'viewer'
  | 'user'

export type ResourceType = 
  | 'user'
  | 'flow'
  | 'template'
  | 'bot'
  | 'channel'
  | 'integration'
  | 'settings'
  | 'analytics'
  | 'metadata'

export interface UserCapabilities {
  role: Role
  permissions: string[]
  can_create: Record<ResourceType, boolean>
  can_read: Record<ResourceType, boolean>
  can_update: Record<ResourceType, boolean>
  can_delete: Record<ResourceType, boolean>
  can_execute: {
    flow: boolean
  }
  widgets: {
    user_management: boolean
    flow_builder: boolean
    template_editor: boolean
    bot_manager: boolean
    channel_manager: boolean
    integration_manager: boolean
    analytics_dashboard: boolean
    settings_panel: boolean
    metadata_editor: boolean
    flow_viewer: boolean
    template_viewer: boolean
    bot_viewer: boolean
    channel_viewer: boolean
    analytics_viewer: boolean
  }
  features: {
    can_export_analytics: boolean
    can_manage_users: boolean
    can_delete_flows: boolean
    can_delete_templates: boolean
    can_delete_bots: boolean
    can_manage_integrations: boolean
    can_update_settings: boolean
    is_admin: boolean
    is_super_admin: boolean
  }
}

export interface PermissionCheckRequest {
  permissions: string[]
}

export interface PermissionCheckResponse {
  has_permission: boolean
  missing_permissions: string[]
}

export interface WidgetConfig {
  id: string
  name: string
  type: string
  visible: boolean
  enabled: boolean
  required_permissions: string[]
}

export interface RoleInfo {
  name: string
  display_name: string
  permissions: string[]
  permission_count: number
}

export interface ResourcePermissions {
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
  can_list: boolean
}
