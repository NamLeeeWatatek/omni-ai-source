import { useState, useCallback, useRef } from 'react'
import type { Node } from 'reactflow'

interface ExecutionEvent {
    type: 'executionStarted' | 'nodeExecutionBefore' | 'nodeExecutionAfter' | 'executionFinished' | 'executionError'
    data: any
}

interface UseExecutionStreamReturn {
    execute: (flowId: number, inputData?: any) => Promise<void>
    isExecuting: boolean
    error: string | null
    updateNodeStatus: (nodeName: string, status: 'running' | 'success' | 'error', data?: any) => void
}

/**
 * Hook for real-time workflow execution with SSE
 * Following n8n pattern
 */
export function useExecutionStream(
    nodes: Node[],
    setNodes: (updater: (nodes: Node[]) => Node[]) => void
): UseExecutionStreamReturn {
    const [isExecuting, setIsExecuting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const eventSourceRef = useRef<EventSource | null>(null)

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

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
            const token = localStorage.getItem('wataomi_token')

            console.log('🚀 Starting SSE execution:', { flowId, API_URL })

            // Use fetch with streaming instead of EventSource (for POST support)
            const response = await fetch(`${API_URL}/executions/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    flow_id: flowId,
                    input_data: inputData
                })
            })

            console.log('📡 Response status:', response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Response error:', errorText)
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
                throw new Error('No response body')
            }

            // Read stream
            console.log('📖 Starting to read SSE stream...')
            let eventCount = 0
            
            while (true) {
                const { done, value } = await reader.read()
                
                if (done) {
                    console.log('✅ Stream completed, total events:', eventCount)
                    break
                }

                const text = decoder.decode(value, { stream: true })
                console.log('📨 Received chunk:', text.substring(0, 100) + '...')
                
                const lines = text.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6) // Remove 'data: ' prefix
                        
                        try {
                            const event: ExecutionEvent = JSON.parse(jsonStr)
                            eventCount++
                            console.log(`📬 Event #${eventCount}:`, event.type, event.data)
                            
                            switch (event.type) {
                                case 'executionStarted':
                                    console.log('🎬 Execution started:', event.data)
                                    break

                                case 'nodeExecutionBefore':
                                    console.log('⏳ Node starting:', event.data.nodeName)
                                    updateNodeStatus(event.data.nodeName, 'running')
                                    break

                                case 'nodeExecutionAfter':
                                    if (event.data.error) {
                                        console.log('❌ Node failed:', event.data.nodeName, event.data.error)
                                        updateNodeStatus(event.data.nodeName, 'error', event.data)
                                    } else {
                                        console.log('✅ Node completed:', event.data.nodeName)
                                        updateNodeStatus(event.data.nodeName, 'success', event.data)
                                    }
                                    break

                                case 'executionFinished':
                                    console.log('🏁 Execution finished:', event.data)
                                    break

                                case 'executionError':
                                    console.log('💥 Execution error:', event.data.error)
                                    setError(event.data.error)
                                    break
                            }
                        } catch (e) {
                            console.error('⚠️ Failed to parse SSE event:', line, e)
                        }
                    }
                }
            }

        } catch (err) {
            console.error('Execution stream error:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setIsExecuting(false)
        }
    }, [setNodes, updateNodeStatus])

    return {
        execute,
        isExecuting,
        error,
        updateNodeStatus
    }
}
