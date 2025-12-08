'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/lib/hooks/use-workspace'
import { useSession } from 'next-auth/react'
import axiosClient from '@/lib/axios-client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Workspace {
  id: string
  name: string
  slug: string
  plan: string
}

export function WorkspaceSwitcher() {
  const { data: session } = useSession()
  const workspace = useWorkspace()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)

  // Safe access to workspace context
  const currentWorkspaceId = workspace?.currentWorkspaceId || null
  const setCurrentWorkspaceId = workspace?.setCurrentWorkspaceId || (() => { })

  useEffect(() => {
    // Only fetch once
    if (hasFetched) {
      setLoading(false)
      return
    }

    let isMounted = true

    async function fetchWorkspaces() {
      // If no session yet, wait
      if (!session) {
        return
      }

      // If no accessToken, use session workspace
      if (!session?.accessToken) {
        if (isMounted) {
          setHasFetched(true)
          setLoading(false)
          // Set default workspace from session if available
          if (session?.workspace) {
            setWorkspaces([session.workspace])
          }
        }
        return
      }

      setHasFetched(true)

      try {
        const response = await axiosClient.get('/workspaces')
        if (isMounted) {
          const fetchedWorkspaces = response.data || []
          setWorkspaces(fetchedWorkspaces)

          // If no workspaces from API but session has workspace, use it
          if (fetchedWorkspaces.length === 0 && session?.workspace) {
            setWorkspaces([session.workspace])
          }
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error)
        // Fallback to session workspaces
        if (isMounted) {
          if (session?.workspaces && session.workspaces.length > 0) {
            setWorkspaces(session.workspaces)
          } else if (session?.workspace) {
            setWorkspaces([session.workspace])
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchWorkspaces()

    return () => {
      isMounted = false
    }
  }, [session, hasFetched])

  const handleWorkspaceChange = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId)
    // Optionally reload the page to refresh data
    // window.location.reload()
  }

  // Get workspace name from session or workspaces
  const getWorkspaceName = () => {
    if (workspaces.length > 0) {
      const current = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0]
      return current.name
    }
    if (session?.workspace?.name) {
      return session.workspace.name
    }
    return 'My Workspace'
  }

  const getWorkspacePlan = () => {
    if (workspaces.length > 0) {
      const current = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0]
      return current.plan || 'Free'
    }
    if (session?.workspace?.plan) {
      return session.workspace.plan
    }
    return 'Free'
  }

  if (loading) {
    return (
      <div className="w-full px-3 py-2 rounded-lg bg-accent/50">
        <div className="h-4 w-24 animate-pulse rounded bg-muted mb-1" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  // Always show workspace info, even if no workspaces loaded yet
  if (workspaces.length === 0) {
    return (
      <div className="w-full px-3 py-2 rounded-lg bg-accent/50">
        <p className="text-sm font-medium">{getWorkspaceName()}</p>
        <p className="text-xs text-muted-foreground">{getWorkspacePlan()} Plan</p>
      </div>
    )
  }

  // Show current workspace name if user only has one workspace
  if (workspaces.length === 1) {
    return (
      <div className="w-full px-3 py-2 rounded-lg bg-accent/50">
        <p className="text-sm font-medium">{workspaces[0].name}</p>
        <p className="text-xs text-muted-foreground">{workspaces[0].plan || 'Free'} Plan</p>
      </div>
    )
  }

  return (
    <Select value={currentWorkspaceId || undefined} onValueChange={handleWorkspaceChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select workspace" />
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((ws) => (
          <SelectItem key={ws.id} value={ws.id}>
            {ws.name} ({ws.plan})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
