
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

      setConnected(true)

      if (flowId) {
        newSocket.emit('subscribe:flow', flowId)
      }

      if (executionId) {
        newSocket.emit('subscribe:execution', executionId)
      }
    })

    newSocket.on('disconnect', () => {

      setConnected(false)
    })

    newSocket.on('connect_error', (error) => {

      setConnected(false)
    })

    newSocket.on('execution:progress', (data: any) => {
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

    newSocket.on('execution:complete', (data: any) => {
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

    newSocket.on('execution:error', (data: any) => {
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

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [session?.accessToken, flowId, executionId])

  const subscribeToFlow = useCallback(
    (flowId: string) => {
      if (socket && connected) {
        socket.emit('subscribe:flow', flowId)
      }
    },
    [socket, connected]
  )

  const subscribeToExecution = useCallback(
    (executionId: string) => {
      if (socket && connected) {
        socket.emit('subscribe:execution', executionId)
      }
    },
    [socket, connected]
  )

  const unsubscribeFromFlow = useCallback(
    (flowId: string) => {
      if (socket && connected) {
        socket.emit('unsubscribe:flow', flowId)
      }
    },
    [socket, connected]
  )

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
