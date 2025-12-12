import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract current workspace ID from request
 * Priority: Header > Query > Body > User's default workspace
 *
 * Usage:
 * @Get()
 * findAll(@CurrentWorkspace() workspaceId: string) { ... }
 */
export const CurrentWorkspace = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<string | undefined> => {
    const request = ctx.switchToHttp().getRequest();

    // 1. Check X-Workspace-Id header (recommended for frontend)
    const headerWorkspaceId = request.headers['x-workspace-id'];
    if (headerWorkspaceId) {
      return headerWorkspaceId;
    }

    // 2. Check query parameter (for API testing)
    if (request.query?.workspaceId) {
      return request.query.workspaceId;
    }

    // 3. Check body (for POST/PATCH requests)
    if (request.body?.workspaceId) {
      return request.body.workspaceId;
    }

    // 4. Fallback to user's default workspace (set by middleware)
    return request.defaultWorkspaceId;
  },
);
