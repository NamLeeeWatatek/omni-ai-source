/**
 * Hook for real-time execution updates via WebSocket
 */
import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

interface ExecutionUpdate {
  executionId: string
  flowId: string
  status: 'running' | 'completed' | 'failed'
  currentNode?: string
  progress?: number
  result?: any
  error?: string
}

interface UseExecutionSocketOptions {
  flowId?: string
  executionId?: string
  onUpdate?: (update: ExecutionUpdate) => void
  onComplete?: (result: any) => void
  onError?: (error: string) => void
}

export function useExecutionSocket(options: UseExecutionSocketOptions = {}) {
  const { flowId, executionId, onUpdate, onComplete, onError } = options
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [executions, setExecutions] = useState<Map<string, ExecutionUpdate>>(new Map())

  // Initialize socket connection
  useEffect(() => {
    if (!session?.accessToken) return

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const socketUrl = API_URL.replace('/api/v1', '')

    const newSocket = io(`${socketUrl}/executions`, {
      auth: {
        token: session.accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected')
      setConnected(true)

      // Subscribe to flow executions if flowId provided
      if (flowId) {
        newSocket.emit('subscribe:flow', flowId)
      }

      // Subscribe to specific execution if executionId provided
      if (executionId) {
        newSocket.emit('subscribe:execution', executionId)
      }
    })

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
      setConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setConnected(false)
    })

    // Listen for execution start
    newSocket.on('execution:start', (data: any) => {
      console.log('▶️ Execution started:', data)
    })

    // Listen for execution progress
    newSocket.on('execution:progress', (data: any) => {
      console.log('📊 Execution progress:', data)
      
      const update: ExecutionUpdate = {
        executionId: data.executionId,
        flowId: data.flowId,
        status: 'running',
        currentNode: data.nodeId,
        progress: data.progress,
      }

      setExecutions((prev) => {
        const next = new Map(prev)
        next.set(update.executionId, update)
        return next
      })

      onUpdate?.(update)
    })

    // Listen for execution complete
    newSocket.on('execution:complete', (data: any) => {
      console.log('✅ Execution completed:', data)
      
      const update: ExecutionUpdate = {
        executionId: data.executionId,
        flowId: data.flowId || '',
        status: 'completed',
        result: data.result,
      }

      setExecutions((prev) => {
        const next = new Map(prev)
        next.set(update.executionId, update)
        return next
      })

      onUpdate?.(update)
      onComplete?.(data.result)
    })

    // Listen for execution error
    newSocket.on('execution:error', (data: any) => {
      console.log('❌ Execution error:', data)
      
      const update: ExecutionUpdate = {
        executionId: data.executionId,
        flowId: data.flowId || '',
        status: 'failed',
        error: data.error,
      }

      setExecutions((prev) => {
        const next = new Map(prev)
        next.set(update.executionId, update)
        return next
      })

      onUpdate?.(update)
      onError?.(data.error)
    })

    // Listen for node execution updates
    newSocket.on('execution:node:start', (data: any) => {
      console.log('🔵 Node started:', data)
    })

    newSocket.on('execution:node:complete', (data: any) => {
      console.log('✅ Node completed:', data)
    })

    newSocket.on('execution:node:error', (data: any) => {
      console.log('❌ Node error:', data)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [session?.accessToken, flowId, executionId])

  // Subscribe to a flow's executions
  const subscribeToFlow = useCallback(
    (flowId: string) => {
      if (socket && connected) {
        socket.emit('subscribe:flow', flowId)
      }
    },
    [socket, connected]
  )

  // Subscribe to a specific execution
  const subscribeToExecution = useCallback(
    (executionId: string) => {
      if (socket && connected) {
        socket.emit('subscribe:execution', executionId)
      }
    },
    [socket, connected]
  )

  // Unsubscribe from a flow
  const unsubscribeFromFlow = useCallback(
    (flowId: string) => {
      if (socket && connected) {
        socket.emit('unsubscribe:flow', flowId)
      }
    },
    [socket, connected]
  )

  // Get execution status
  const getExecution = useCallback(
    (executionId: string) => {
      return executions.get(executionId)
    },
    [executions]
  )

  return {
    socket,
    connected,
    executions: Array.from(executions.values()),
    subscribeToFlow,
    subscribeToExecution,
    unsubscribeFromFlow,
    getExecution,
  }
}
