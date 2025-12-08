import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WorkspaceHelperService } from '../workspace-helper.service';

/**
 * Middleware to set default workspace context for authenticated users
 * This runs after JWT authentication
 */
@Injectable()
export class WorkspaceContextMiddleware implements NestMiddleware {
  constructor(private workspaceHelper: WorkspaceHelperService) {}

  async use(req: Request & { user?: any; defaultWorkspaceId?: string }, res: Response, next: NextFunction) {
    if (req.user?.id) {
      // Get user's default workspace and cache it in request
      const defaultWorkspace = await this.workspaceHelper.getUserDefaultWorkspace(req.user.id);
      if (defaultWorkspace) {
        req.defaultWorkspaceId = defaultWorkspace.id;
      }
    }
    next();
  }
}
