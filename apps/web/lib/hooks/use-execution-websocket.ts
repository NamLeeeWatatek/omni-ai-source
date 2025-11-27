import { useState, useCallback } from 'react'
import type { Node } from 'reactflow'
import { wsService } from '@/lib/services/websocket-service'

interface UseExecutionWebSocketReturn {
    execute: (flowId: number, inputData?: any) => Promise<void>
    isExecuting: boolean
    error: string | null
}

/**
 * Hook for real-time workflow execution with WebSocket
 * Uses centralized WebSocket service
 */
export function useExecutionWebSocket(
    setNodes: (updater: (nodes: Node[]) => Node[]) => void
): UseExecutionWebSocketReturn {
    const [isExecuting, setIsExecuting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const updateNodeStatus = useCallback((nodeName: string, status: 'running' | 'success' | 'error', data?: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                const nodeLabel = node.data?.label || node.id
                if (nodeLabel === nodeName || node.id === nodeName) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            executionStatus: status,
                            executionError: data?.error?.message || null,
                            executionOutput: data?.data || null
                        }
                    }
                }
                return node
            })
        )
    }, [setNodes])

    const execute = useCallback(async (flowId: number, inputData: any = {}) => {
        return new Promise<void>((resolve, reject) => {
            setIsExecuting(true)
            setError(null)

            // Reset all nodes to idle
            setNodes((nds) =>
                nds.map((node) => ({
                    ...node,
                    data: {
                        ...node.data,
                        executionStatus: 'idle',
                        executionError: null,
                        executionOutput: null
                    }
                }))
            )

            const endpoint = `/ws/execute/${flowId}`

            // Connect using centralized service
            wsService.connect(endpoint, () => {
                // On connection open, send start command
                console.log('🔌 Connected, sending start command...')
                wsService.send(endpoint, {
                    action: 'start',
                    input_data: inputData
                })
            })

            // Subscribe to events (match backend event types exactly)
            const unsubscribeStarted = wsService.on(endpoint, 'executionStarted', (data) => {
                console.log('🎬 Execution started:', data)
            })

            const unsubscribeBefore = wsService.on(endpoint, 'nodeExecutionBefore', (data) => {
                console.log('⏳ Node starting:', data.nodeName)
                updateNodeStatus(data.nodeName, 'running')
            })

            const unsubscribeAfter = wsService.on(endpoint, 'nodeExecutionAfter', (data) => {
                if (data.error) {
                    console.log('❌ Node failed:', data.nodeName, data.error)
                    updateNodeStatus(data.nodeName, 'error', data)
                } else {
                    console.log('✅ Node completed:', data.nodeName)
                    updateNodeStatus(data.nodeName, 'success', data)
                }
            })

            const unsubscribeFinished = wsService.on(endpoint, 'executionFinished', (data) => {
                console.log('🏁 Execution finished:', data)
                setIsExecuting(false)
                
                // Cleanup
                unsubscribeStarted()
                unsubscribeBefore()
                unsubscribeAfter()
                unsubscribeFinished()
                unsubscribeError()
                
                wsService.disconnect(endpoint)
                resolve()
            })

            const unsubscribeError = wsService.on(endpoint, 'executionError', (data) => {
                console.log('💥 Execution error:', data.error)
                setError(data.error)
                setIsExecuting(false)
                
                // Cleanup
                unsubscribeStarted()
                unsubscribeBefore()
                unsubscribeAfter()
                unsubscribeFinished()
                unsubscribeError()
                
                wsService.disconnect(endpoint)
                reject(new Error(data.error))
            })

            // Handle connection errors
            wsService.onError(endpoint, (error) => {
                console.error('❌ WebSocket connection error:', error)
                setError('WebSocket connection error')
                setIsExecuting(false)
                reject(new Error('WebSocket connection error'))
            })
        })
    }, [setNodes, updateNodeStatus])

    return {
        execute,
        isExecuting,
        error
    }
}
