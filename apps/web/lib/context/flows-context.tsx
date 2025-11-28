'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { 
  Flow, 
  FlowCreateData,
  FlowUpdateData,
  fetchFlows, 
  fetchFlow, 
  createFlow, 
  updateFlow, 
  deleteFlow, 
  duplicateFlow, 
  archiveFlow 
} from '@/lib/api/flows'
import toast from '@/lib/toast'

interface FlowsContextType {
  flows: Flow[]
  loading: boolean
  error: string | null
  
  // Read operations
  getFlow: (id: number) => Flow | undefined
  getFlowsByStatus: (status: string) => Flow[]
  refreshFlows: () => Promise<void>
  refreshSingleFlow: (id: number) => Promise<Flow>
  
  // Write operations
  createNewFlow: (data: FlowCreateData) => Promise<Flow>
  updateExistingFlow: (id: number, data: FlowUpdateData) => Promise<Flow>
  deleteExistingFlow: (id: number) => Promise<void>
  duplicateExistingFlow: (id: number) => Promise<Flow>
  archiveExistingFlow: (id: number) => Promise<Flow>
}

const FlowsContext = createContext<FlowsContextType | undefined>(undefined)

export function FlowsProvider({ children }: { children: ReactNode }) {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load all flows
  const loadFlows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchFlows()
      setFlows(data)
    } catch (err: any) {
      console.error('Failed to load flows:', err)
      setError(err.message || 'Failed to load flows')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Get single flow from cache
  const getFlow = useCallback((id: number) => {
    return flows.find(f => f.id === id)
  }, [flows])

  // Get flows by status
  const getFlowsByStatus = useCallback((status: string) => {
    return flows.filter(f => f.status === status)
  }, [flows])

  // Refresh single flow (fetch from API and update cache)
  const refreshSingleFlow = useCallback(async (id: number) => {
    try {
      const updated = await fetchFlow(id)
      setFlows(prev => {
        const exists = prev.some(f => f.id === id)
        if (exists) {
          return prev.map(f => f.id === id ? updated : f)
        } else {
          return [...prev, updated]
        }
      })
      return updated
    } catch (err: any) {
      console.error(`Failed to refresh flow ${id}:`, err)
      throw err
    }
  }, [])

  // Create flow
  const createNewFlow = useCallback(async (data: FlowCreateData) => {
    try {
      const newFlow = await createFlow(data)
      setFlows(prev => [...prev, newFlow])
      toast.success('Workflow created successfully')
      return newFlow
    } catch (err: any) {
      console.error('Failed to create flow:', err)
      toast.error(err.message || 'Failed to create workflow')
      throw err
    }
  }, [])

  // Update flow with optimistic update
  const updateExistingFlow = useCallback(async (id: number, data: FlowUpdateData) => {
    // Optimistic update
    const previousFlows = flows
    setFlows(prev => prev.map(f => f.id === id ? { ...f, ...data } : f))

    try {
      const updated = await updateFlow(id, data)
      setFlows(prev => prev.map(f => f.id === id ? updated : f))
      toast.success('Workflow updated successfully')
      return updated
    } catch (err: any) {
      // Rollback on error
      setFlows(previousFlows)
      console.error('Failed to update flow:', err)
      toast.error(err.message || 'Failed to update workflow')
      throw err
    }
  }, [flows])

  // Delete flow
  const deleteExistingFlow = useCallback(async (id: number) => {
    // Optimistic delete
    const previousFlows = flows
    setFlows(prev => prev.filter(f => f.id !== id))

    try {
      await deleteFlow(id)
      toast.success('Workflow deleted successfully')
    } catch (err: any) {
      // Rollback on error
      setFlows(previousFlows)
      console.error('Failed to delete flow:', err)
      toast.error(err.message || 'Failed to delete workflow')
      throw err
    }
  }, [flows])

  // Duplicate flow
  const duplicateExistingFlow = useCallback(async (id: number) => {
    try {
      const duplicated = await duplicateFlow(id)
      setFlows(prev => [...prev, duplicated])
      toast.success('Workflow duplicated successfully')
      return duplicated
    } catch (err: any) {
      console.error('Failed to duplicate flow:', err)
      toast.error(err.message || 'Failed to duplicate workflow')
      throw err
    }
  }, [])

  // Archive flow
  const archiveExistingFlow = useCallback(async (id: number) => {
    try {
      const archived = await archiveFlow(id)
      setFlows(prev => prev.map(f => f.id === id ? archived : f))
      toast.success('Workflow archived successfully')
      return archived
    } catch (err: any) {
      console.error('Failed to archive flow:', err)
      toast.error(err.message || 'Failed to archive workflow')
      throw err
    }
  }, [])

  return (
    <FlowsContext.Provider value={{
      flows,
      loading,
      error,
      getFlow,
      getFlowsByStatus,
      refreshFlows: loadFlows,
      refreshSingleFlow,
      createNewFlow,
      updateExistingFlow,
      deleteExistingFlow,
      duplicateExistingFlow,
      archiveExistingFlow
    }}>
      {children}
    </FlowsContext.Provider>
  )
}

export function useFlows() {
  const context = useContext(FlowsContext)
  if (context === undefined) {
    throw new Error('useFlows must be used within a FlowsProvider')
  }
  return context
}
