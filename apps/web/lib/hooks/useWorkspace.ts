/**
 * Workspace Context Hook
 * Provides easy access to current workspace from session
 */
import { useSession } from 'next-auth/react'
import { useMemo, useCallback } from 'react'
import type { SessionWorkspace } from '@/lib/types/next-auth'

export function useWorkspace() {
  const { data: session, status, update } = useSession()

  const workspaceId = useMemo(() => session?.workspace?.id || null, [session?.workspace?.id])

  // Switch workspace function (would need backend support)
  const switchWorkspace = useCallback(async (newWorkspaceId: string) => {
    // TODO: Implement workspace switching with backend
    console.log('Switching to workspace:', newWorkspaceId)
    // This would typically call an API to update user's current workspace
    // and then update the session
  }, [])

  return {
    // Primary properties
    workspace: session?.workspace || null,
    workspaces: session?.workspaces || [],
    workspaceId,
    
    // Aliases for backward compatibility
    currentWorkspace: session?.workspace || null,
    
    // Status flags
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    hasWorkspace: !!workspaceId,
    
    // Actions
    switchWorkspace,
  }
}

export type UseWorkspaceReturn = ReturnType<typeof useWorkspace>
