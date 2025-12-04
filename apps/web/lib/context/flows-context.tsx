'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import {
  fetchFlows,
  fetchFlow,
  createFlow,
  updateFlow,
  deleteFlow
} from '@/lib/api/flows'
import type { Flow, CreateFlowDto, UpdateFlowDto } from '@/lib/types/flow'
type FlowCreateData = CreateFlowDto
type FlowUpdateData = UpdateFlowDto
import toast from '@/lib/toast'

interface FlowsContextType {
  flows: Flow[]
  loading: boolean
  error: string | null

  getFlow: (id: string) => Flow | undefined
  getFlowsByStatus: (status: string) => Flow[]
  refreshFlows: () => Promise<void>
  refreshSingleFlow: (id: string) => Promise<Flow>

  createNewFlow: (data: FlowCreateData) => Promise<Flow>
  updateExistingFlow: (id: string, data: FlowUpdateData) => Promise<Flow>
  deleteExistingFlow: (id: string) => Promise<void>
  duplicateExistingFlow: (id: string) => Promise<Flow>
  archiveExistingFlow: (id: string) => Promise<Flow>
}

const FlowsContext = createContext<FlowsContextType | undefined>(undefined)

export function FlowsProvider({ children }: { children: ReactNode }) {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFlows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchFlows()
      setFlows(data)
    } catch (err: any) {

      setError(err.message || 'Failed to load flows')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getFlow = useCallback((id: string) => {
    return flows.find(f => f.id === id)
  }, [flows])

  const getFlowsByStatus = useCallback((status: string) => {
    return flows.filter(f => f.status === status)
  }, [flows])

  const refreshSingleFlow = useCallback(async (id: string) => {
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

      throw err
    }
  }, [])

  const createNewFlow = useCallback(async (data: FlowCreateData) => {
    try {
      const newFlow = await createFlow(data)
      setFlows(prev => [...prev, newFlow])
      toast.success('Workflow created successfully')
      return newFlow
    } catch (err: any) {

      toast.error(err.message || 'Failed to create workflow')
      throw err
    }
  }, [])

  const updateExistingFlow = useCallback(async (id: string, data: FlowUpdateData) => {
    const previousFlows = flows
    setFlows(prev => prev.map(f => f.id === id ? { ...f, ...data } : f))

    try {
      const updated = await updateFlow(id, data)
      setFlows(prev => prev.map(f => f.id === id ? updated : f))
      toast.success('Workflow updated successfully')
      return updated
    } catch (err: any) {
      setFlows(previousFlows)

      toast.error(err.message || 'Failed to update workflow')
      throw err
    }
  }, [flows])

  const deleteExistingFlow = useCallback(async (id: string) => {
    const previousFlows = flows
    setFlows(prev => prev.filter(f => f.id !== id))

    try {
      await deleteFlow(id)
      toast.success('Workflow deleted successfully')
    } catch (err: any) {
      setFlows(previousFlows)

      toast.error(err.message || 'Failed to delete workflow')
      throw err
    }
  }, [flows])

  const duplicateExistingFlow = useCallback(async (id: string) => {
    try {
      toast.error('Duplicate feature not yet implemented')
      throw new Error('Not implemented')
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate workflow')
      throw err
    }
  }, [])

  const archiveExistingFlow = useCallback(async (id: string) => {
    try {
      toast.error('Archive feature not yet implemented')
      throw new Error('Not implemented')
    } catch (err: any) {

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
