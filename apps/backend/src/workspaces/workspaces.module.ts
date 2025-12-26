import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WorkspaceEntity,
  WorkspaceMemberEntity,
} from './infrastructure/persistence/relational/entities/workspace.entity';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceHelperService } from './workspace-helper.service';
import { WorkspaceAccessGuard } from './guards/workspace-access.guard';
import { WorkspaceContextInterceptor } from './interceptors/workspace-context.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity, WorkspaceMemberEntity])],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    WorkspaceHelperService,
    WorkspaceAccessGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: WorkspaceContextInterceptor,
    },
  ],
  exports: [
    WorkspacesService,
    WorkspaceHelperService,
    WorkspaceAccessGuard,
  ],
})
export class WorkspacesModule { }
