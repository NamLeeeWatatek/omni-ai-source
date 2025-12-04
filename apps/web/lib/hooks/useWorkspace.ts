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

  const switchWorkspace = useCallback(async (newWorkspaceId: string) => {
  }, [])

  return {
    workspace: session?.workspace || null,
    workspaces: session?.workspaces || [],
    workspaceId,
    
    currentWorkspace: session?.workspace || null,
    
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    hasWorkspace: !!workspaceId,
    
    switchWorkspace,
  }
}

export type UseWorkspaceReturn = ReturnType<typeof useWorkspace>
