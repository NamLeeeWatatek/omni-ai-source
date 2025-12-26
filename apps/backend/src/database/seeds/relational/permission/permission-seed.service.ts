import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionEntity } from '../../../../permissions/infrastructure/persistence/relational/entities/permission.entity';

@Injectable()
export class PermissionSeedService {
  constructor(
    @InjectRepository(PermissionEntity)
    private repository: Repository<PermissionEntity>,
  ) { }

  async run() {
    const permissions = [
      // IAM (Identity & Access Management)
      { name: 'iam:CreateUser', description: 'Create new users', resource: 'iam', action: 'CreateUser' },
      { name: 'iam:GetUser', description: 'View user details', resource: 'iam', action: 'GetUser' },
      { name: 'iam:ListUsers', description: 'List all users', resource: 'iam', action: 'ListUsers' },
      { name: 'iam:UpdateUser', description: 'Update user details', resource: 'iam', action: 'UpdateUser' },
      { name: 'iam:DeleteUser', description: 'Delete users', resource: 'iam', action: 'DeleteUser' },

      { name: 'iam:CreateRole', description: 'Create new roles', resource: 'iam', action: 'CreateRole' },
      { name: 'iam:GetRole', description: 'View role details', resource: 'iam', action: 'GetRole' },
      { name: 'iam:ListRoles', description: 'List all roles', resource: 'iam', action: 'ListRoles' },
      { name: 'iam:UpdateRole', description: 'Update role permissions', resource: 'iam', action: 'UpdateRole' },
      { name: 'iam:DeleteRole', description: 'Delete roles', resource: 'iam', action: 'DeleteRole' },

      // Chatbots
      { name: 'chatbot:*', description: 'Full access to Chatbots', resource: 'chatbot', action: '*' },
      { name: 'chatbot:CreateBot', description: 'Create new bots', resource: 'chatbot', action: 'CreateBot' },
      { name: 'chatbot:GetBot', description: 'View bot details', resource: 'chatbot', action: 'GetBot' },
      { name: 'chatbot:ListBots', description: 'List available bots', resource: 'chatbot', action: 'ListBots' },
      { name: 'chatbot:UpdateBot', description: 'Configure bots', resource: 'chatbot', action: 'UpdateBot' },
      { name: 'chatbot:DeleteBot', description: 'Delete bots', resource: 'chatbot', action: 'DeleteBot' },
      { name: 'chatbot:ExecuteBot', description: 'Chat with bots', resource: 'chatbot', action: 'ExecuteBot' },

      // Flows
      { name: 'flows:*', description: 'Full access to Flows', resource: 'flows', action: '*' },
      { name: 'flows:CreateFlow', description: 'Create new flows', resource: 'flows', action: 'CreateFlow' },
      { name: 'flows:GetFlow', description: 'View flow details', resource: 'flows', action: 'GetFlow' },
      { name: 'flows:ListFlows', description: 'List flows', resource: 'flows', action: 'ListFlows' },
      { name: 'flows:UpdateFlow', description: 'Edit flow logic', resource: 'flows', action: 'UpdateFlow' },
      { name: 'flows:DeleteFlow', description: 'Delete flows', resource: 'flows', action: 'DeleteFlow' },
      { name: 'flows:ExecuteFlow', description: 'Run flows', resource: 'flows', action: 'ExecuteFlow' },

      // Creation Tools
      { name: 'tools:*', description: 'Full access to Tools', resource: 'tools', action: '*' },
      { name: 'tools:CreateTool', description: 'Create new tools', resource: 'tools', action: 'CreateTool' },
      { name: 'tools:GetTool', description: 'View tool details', resource: 'tools', action: 'GetTool' },
      { name: 'tools:ListTools', description: 'List creation tools', resource: 'tools', action: 'ListTools' },
      { name: 'tools:UpdateTool', description: 'Edit tool configuration', resource: 'tools', action: 'UpdateTool' },
      { name: 'tools:DeleteTool', description: 'Delete tools', resource: 'tools', action: 'DeleteTool' },

      // Templates
      { name: 'templates:*', description: 'Full access to Templates', resource: 'templates', action: '*' },
      { name: 'templates:CreateTemplate', description: 'Create new templates', resource: 'templates', action: 'CreateTemplate' },
      { name: 'templates:GetTemplate', description: 'View template details', resource: 'templates', action: 'GetTemplate' },
      { name: 'templates:ListTemplates', description: 'List templates', resource: 'templates', action: 'ListTemplates' },
      { name: 'templates:UpdateTemplate', description: 'Edit templates', resource: 'templates', action: 'UpdateTemplate' },
      { name: 'templates:DeleteTemplate', description: 'Delete templates', resource: 'templates', action: 'DeleteTemplate' },

      // Knowledge Base
      { name: 'knowledge:*', description: 'Full access to Knowledge Base', resource: 'knowledge', action: '*' },
      { name: 'knowledge:CreateBase', description: 'Create knowledge bases', resource: 'knowledge', action: 'CreateBase' },
      { name: 'knowledge:GetBase', description: 'View knowledge base details', resource: 'knowledge', action: 'GetBase' },
      { name: 'knowledge:ListBases', description: 'List knowledge bases', resource: 'knowledge', action: 'ListBases' },
      { name: 'knowledge:UpdateBase', description: 'Update knowledge base', resource: 'knowledge', action: 'UpdateBase' },
      { name: 'knowledge:DeleteBase', description: 'Delete knowledge base', resource: 'knowledge', action: 'DeleteBase' },
      { name: 'knowledge:SyncBase', description: 'Sync knowledge base data', resource: 'knowledge', action: 'SyncBase' },

      // Files
      { name: 'files:*', description: 'Full access to Files', resource: 'files', action: '*' },
      { name: 'files:UploadFile', description: 'Upload files', resource: 'files', action: 'UploadFile' },
      { name: 'files:ListFiles', description: 'List files', resource: 'files', action: 'ListFiles' },
      { name: 'files:DeleteFile', description: 'Delete files', resource: 'files', action: 'DeleteFile' },

      // Workspaces
      { name: 'workspaces:*', description: 'Full access to Workspaces', resource: 'workspaces', action: '*' },
      { name: 'workspaces:CreateWorkspace', description: 'Create workspaces', resource: 'workspaces', action: 'CreateWorkspace' },
      { name: 'workspaces:GetWorkspace', description: 'View workspace details', resource: 'workspaces', action: 'GetWorkspace' },
      { name: 'workspaces:ListWorkspaces', description: 'List workspaces', resource: 'workspaces', action: 'ListWorkspaces' },
      { name: 'workspaces:UpdateWorkspace', description: 'Update workspace settings', resource: 'workspaces', action: 'UpdateWorkspace' },
      { name: 'workspaces:DeleteWorkspace', description: 'Delete workspaces', resource: 'workspaces', action: 'DeleteWorkspace' },

      // Integrations
      { name: 'integrations:*', description: 'Full access to Integrations', resource: 'integrations', action: '*' },
      { name: 'integrations:CreateIntegration', description: 'Connect new integrations', resource: 'integrations', action: 'CreateIntegration' },
      { name: 'integrations:ListIntegrations', description: 'View integrations', resource: 'integrations', action: 'ListIntegrations' },
      { name: 'integrations:UpdateIntegration', description: 'Update integration settings', resource: 'integrations', action: 'UpdateIntegration' },
      { name: 'integrations:DeleteIntegration', description: 'Disconnect integrations', resource: 'integrations', action: 'DeleteIntegration' },

      // Channels
      { name: 'channels:*', description: 'Full access to Channels', resource: 'channels', action: '*' },
      { name: 'channels:CreateChannel', description: 'Create channels', resource: 'channels', action: 'CreateChannel' },
      { name: 'channels:ListChannels', description: 'List channels', resource: 'channels', action: 'ListChannels' },
      { name: 'channels:UpdateChannel', description: 'Update channel', resource: 'channels', action: 'UpdateChannel' },
      { name: 'channels:DeleteChannel', description: 'Delete channel', resource: 'channels', action: 'DeleteChannel' },

      // System
      { name: 'system:*', description: 'Full access to System Settings', resource: 'system', action: '*' },
      { name: 'system:ReadSettings', description: 'View system settings', resource: 'system', action: 'ReadSettings' },
      { name: 'system:UpdateSettings', description: 'Update system settings', resource: 'system', action: 'UpdateSettings' },
      { name: 'system:ReadAuditLogs', description: 'View audit logs', resource: 'system', action: 'ReadAuditLogs' },
    ];

    for (const permission of permissions) {
      const exists = await this.repository.findOne({
        where: { name: permission.name },
      });

      if (!exists) {
        await this.repository.save(this.repository.create(permission));
      } else {
        // Update description if it changed (optional, but good for seeds)
        exists.description = permission.description;
        exists.resource = permission.resource;
        exists.action = permission.action;
        await this.repository.save(exists);
      }
    }
  }
}
