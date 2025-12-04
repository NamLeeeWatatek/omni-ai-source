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

            const { getSession } = await import('next-auth/react')
            const session = await getSession()
            const token = session?.accessToken

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

            if (!response.ok) {
                const errorText = await response.text()

                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
                throw new Error('No response body')
            }

            let eventCount = 0

            while (true) {
                const { done, value } = await reader.read()

                if (done) {

                    break
                }

                const text = decoder.decode(value, { stream: true })

                const lines = text.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6)

                        try {
                            const event: ExecutionEvent = JSON.parse(jsonStr)
                            eventCount++

                            switch (event.type) {
                                case 'executionStarted':

                                    break

                                case 'nodeExecutionBefore':

                                    updateNodeStatus(event.data.nodeName, 'running')
                                    break

                                case 'nodeExecutionAfter':
                                    if (event.data.error) {

                                        updateNodeStatus(event.data.nodeName, 'error', event.data)
                                    } else {

                                        updateNodeStatus(event.data.nodeName, 'success', event.data)
                                    }
                                    break

                                case 'executionFinished':

                                    break

                                case 'executionError':

                                    setError(event.data.error)
                                    break
                            }
                        } catch (e) {

                        }
                    }
                }
            }

        } catch (err) {

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
