'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface WorkspaceContextType {
  currentWorkspaceId: string | null
  setCurrentWorkspaceId: (id: string) => void
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [currentWorkspaceId, setWorkspaceIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Initialize workspace from localStorage or session - ONLY ONCE
  useEffect(() => {
    if (initialized || typeof window === 'undefined') {
      return
    }

    const stored = localStorage.getItem('currentWorkspaceId')
    if (stored) {
      setWorkspaceIdState(stored)
      setIsLoading(false)
      setInitialized(true)
    } else if (session?.workspace?.id) {
      setWorkspaceIdState(session.workspace.id)
      localStorage.setItem('currentWorkspaceId', session.workspace.id)
      setIsLoading(false)
      setInitialized(true)
    } else if (session && !session.workspace?.id) {
      // Session loaded but no workspace - stop loading
      setIsLoading(false)
      setInitialized(true)
    }
  }, [session?.workspace?.id, initialized])

  const setCurrentWorkspaceId = (id: string) => {
    setWorkspaceIdState(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentWorkspaceId', id)
    }
  }

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspaceId,
        setCurrentWorkspaceId,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    // Return default values instead of throwing
    // This allows components to work before WorkspaceProvider is added
    return {
      currentWorkspaceId: null,
      setCurrentWorkspaceId: () => {},
      isLoading: false,
    }
  }
  return context
}
