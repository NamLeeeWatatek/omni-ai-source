'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestSSEPage() {
    const [logs, setLogs] = useState<string[]>([])
    const [isRunning, setIsRunning] = useState(false)

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
    }

    const testSSE = async () => {
        setIsRunning(true)
        setLogs([])
        addLog('🚀 Starting SSE test...')

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
            const token = localStorage.getItem('wataomi_token')

            addLog(`📡 Connecting to: ${API_URL}/executions/stream`)

            const response = await fetch(`${API_URL}/executions/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    flow_id: 83,
                    input_data: {}
                })
            })

            addLog(`📬 Response status: ${response.status} ${response.statusText}`)

            if (!response.ok) {
                const errorText = await response.text()
                addLog(`❌ Error: ${errorText}`)
                return
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
                addLog('❌ No response body')
                return
            }

            addLog('📖 Reading stream...')

            while (true) {
                const { done, value } = await reader.read()

                if (done) {
                    addLog('✅ Stream completed')
                    break
                }

                const text = decoder.decode(value, { stream: true })
                addLog(`📨 Chunk: ${text}`)

                const lines = text.split('\n')
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6)
                        try {
                            const event = JSON.parse(jsonStr)
                            addLog(`📬 Event: ${event.type} - ${JSON.stringify(event.data)}`)
                        } catch (e) {
                            addLog(`⚠️ Parse error: ${line}`)
                        }
                    }
                }
            }

        } catch (err: any) {
            addLog(`💥 Error: ${err.message}`)
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">SSE Test Page</h1>
            
            <Button 
                onClick={testSSE} 
                disabled={isRunning}
                className="mb-4"
            >
                {isRunning ? 'Running...' : 'Test SSE Execution'}
            </Button>

            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
                {logs.length === 0 ? (
                    <div className="text-gray-500">Click button to start test...</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))
                )}
            </div>
        </div>
    )
}
