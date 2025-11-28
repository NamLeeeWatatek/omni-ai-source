import { useEffect, useRef, useState, useCallback } from 'react'

interface TestNodeResult {
    status: 'running' | 'success' | 'error'
    output?: any
    error?: string
    execution_time_ms?: number
}

export function useTestNodeWebSocket() {
    const wsRef = useRef<WebSocket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<TestNodeResult | null>(null)

    useEffect(() => {
        // For now, return disconnected state
        // Backend needs to implement WebSocket endpoint
        // Example: ws://localhost:8000/ws/test-node
        
        // Uncomment when backend WebSocket is ready:
        /*
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws/test-node'
        const token = localStorage.getItem('wataomi_token')

        const ws = new WebSocket(`${WS_URL}?token=${token}`)

        ws.onopen = () => {
            console.log('Test Node WebSocket connected')
            setIsConnected(true)
        }

        ws.onclose = () => {
            console.log('Test Node WebSocket disconnected')
            setIsConnected(false)
        }

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            
            if (data.type === 'test_node_start') {
                setIsTesting(true)
                setTestResult({ status: 'running' })
            } else if (data.type === 'test_node_success') {
                setIsTesting(false)
                setTestResult({
                    status: 'success',
                    output: data.output,
                    execution_time_ms: data.execution_time_ms
                })
            } else if (data.type === 'test_node_error') {
                setIsTesting(false)
                setTestResult({
                    status: 'error',
                    error: data.error || 'Test failed',
                    execution_time_ms: data.execution_time_ms
                })
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
        }

        wsRef.current = ws

        return () => {
            ws.close()
        }
        */

        return () => {}
    }, [])

    const testNode = useCallback(async (
        flowId: string | number,
        nodeId: string,
        nodeType: string,
        config: Record<string, any>
    ) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket not connected')
        }

        setIsTesting(true)
        setTestResult(null)

        return new Promise<TestNodeResult>((resolve, reject) => {
            const timeout = setTimeout(() => {
                setIsTesting(false)
                reject(new Error('Test timeout'))
            }, 60000) // 60s timeout

            // Send test request via WebSocket
            wsRef.current?.send(JSON.stringify({
                type: 'test_node',
                flow_id: flowId,
                node_id: nodeId,
                node_type: nodeType,
                config: config
            }))

            // Note: Response will be handled by ws.onmessage in useEffect
            // This is a simplified version - in production you'd want to track request IDs
        })
    }, [])

    return {
        isConnected,
        isTesting,
        testResult,
        testNode,
        clearResult: () => setTestResult(null)
    }
}
