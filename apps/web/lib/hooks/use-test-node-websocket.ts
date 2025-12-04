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

        return () => { }
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
            }, 60000)

            wsRef.current?.send(JSON.stringify({
                type: 'test_node',
                flow_id: flowId,
                node_id: nodeId,
                node_type: nodeType,
                config: config
            }))

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
