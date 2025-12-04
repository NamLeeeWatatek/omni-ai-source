'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MdCheck, MdExpandMore, MdAdd, MdBusiness } from 'react-icons/md';
import { cn } from '@/lib/utils';

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);

  if (!currentWorkspace && workspaces.length === 0) {
    return (
      <Button variant="ghost" className="w-full justify-between px-3 h-12" disabled>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading workspace...</span>
        </div>
      </Button>
    );
  }

  const workspace = currentWorkspace || workspaces[0];

  if (!workspace) {
    return (
      <Button variant="ghost" className="w-full justify-between px-3 h-12" disabled>
        <div className="flex items-center gap-3">
          <MdBusiness className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">No workspace</span>
        </div>
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 h-12 hover:bg-accent/50"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              {workspace.avatarUrl ? (
                <img
                  src={workspace.avatarUrl}
                  alt={workspace.name}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <MdBusiness className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-sm truncate">
                {workspace.name}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {workspace.plan} Plan
              </div>
            </div>
          </div>
          <MdExpandMore className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => {
              switchWorkspace(workspace.id);
              setOpen(false);
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                {workspace.avatarUrl ? (
                  <img
                    src={workspace.avatarUrl}
                    alt={workspace.name}
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <MdBusiness className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {workspace.name}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {workspace.plan}
                </div>
              </div>
              {(currentWorkspace?.id || workspaces[0]?.id) === workspace.id && (
                <MdCheck className="w-5 h-5 text-primary flex-shrink-0" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-primary">
          <MdAdd className="w-5 h-5 mr-2" />
          Create Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
