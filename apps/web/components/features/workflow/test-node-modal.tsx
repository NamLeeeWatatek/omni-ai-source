'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FiPlay, FiX, FiCheckCircle, FiAlertCircle, FiClock, FiCopy, FiWifi, FiWifiOff } from 'react-icons/fi'
import { DynamicFormField } from './dynamic-form-field'
import { Node } from 'reactflow'
import { useAppSelector } from '@/lib/store/hooks'
import { useTestNodeWebSocket } from '@/lib/hooks/use-test-node-websocket'
import toast from '@/lib/toast'

interface TestNodeModalProps {
    node: Node
    onClose: () => void
    flowId: string | number
}

export function TestNodeModal({ node, onClose, flowId }: TestNodeModalProps) {
    const [inputData, setInputData] = useState<Record<string, any>>({})
    const { isConnected, isTesting, testResult: wsTestResult, testNode, clearResult } = useTestNodeWebSocket()
    const [testResult, setTestResult] = useState<any>(null)
    const [testError, setTestError] = useState<string | null>(null)

    const { items: nodeTypes = [] } = useAppSelector((state: any) => state.nodeTypes || {})

    const getNodeType = (typeId: string) => {
        return nodeTypes.find((nt: any) => nt.id === typeId)
    }

    const nodeType = getNodeType(node.data.type || node.type || '')
    const nodeConfig = node.data.config || {}

    // Get test inputs (properties that are not configured)
    const testInputs = (() => {
        const properties = nodeType?.properties || []

        // Filter to only show unconfigured required fields
        return properties.filter((prop: any) => {
            const isConfigured = nodeConfig[prop.name] !== undefined &&
                nodeConfig[prop.name] !== '' &&
                nodeConfig[prop.name] !== null
            return !isConfigured && prop.required
        })
    })()

    useEffect(() => {
        // Initialize with defaults
        const defaults: Record<string, any> = {}
        testInputs.forEach((input: any) => {
            if (input.default !== undefined) {
                defaults[input.name] = input.default
            }
        })
        setInputData(defaults)
    }, [node.id])

    // Sync WebSocket result to local state
    useEffect(() => {
        if (wsTestResult) {
            if (wsTestResult.status === 'success') {
                setTestResult(wsTestResult)
                setTestError(null)
            } else if (wsTestResult.status === 'error') {
                setTestError(wsTestResult.error || 'Test failed')
                setTestResult(null)
            }
        }
    }, [wsTestResult])

    const handleTest = async () => {
        setTestError(null)
        setTestResult(null)
        clearResult()

        try {
            // Prepare test payload
            const testPayload = {
                ...nodeConfig,
                ...inputData
            }

            // Use WebSocket if connected, otherwise fallback to HTTP
            if (isConnected) {
                await testNode(
                    flowId,
                    node.id,
                    node.data.type || node.type || '',
                    testPayload
                )
                toast.success('Node tested successfully!')
            } else {
                // Fallback to HTTP API
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
                
                // Get token from NextAuth session
                const { getSession } = await import('next-auth/react')
                const session = await getSession()
                const token = session?.accessToken

                const response = await fetch(`${API_URL}/flows/${flowId}/test-node`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        node_id: node.id,
                        node_type: node.data.type || node.type,
                        config: testPayload
                    })
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(errorData.detail || errorData.message || 'Test failed')
                }

                const result = await response.json()
                setTestResult(result)
                toast.success('Node tested successfully!')
            }
        } catch (error: any) {
            console.error('Test error:', error)
            setTestError(error.message || 'Test failed')
            toast.error(`Test failed: ${error.message}`)
        }
    }

    const handleCopyOutput = () => {
        if (testResult?.output) {
            navigator.clipboard.writeText(JSON.stringify(testResult.output, null, 2))
            toast.success('Output copied to clipboard!')
        }
    }

    const updateInputData = (field: string, value: any) => {
        setInputData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-border/40 bg-muted/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FiPlay className="w-4 h-4 text-primary" />
                            Test Node
                            {isConnected ? (
                                <FiWifi className="w-3 h-3 text-green-500" title="WebSocket connected" />
                            ) : (
                                <FiWifiOff className="w-3 h-3 text-muted-foreground" title="WebSocket disconnected (using HTTP)" />
                            )}
                        </h3>
                        <div className="text-sm text-muted-foreground mt-1">
                            {node.data.label || nodeType?.label || 'Node'}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Info Banner */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-500">
                        💡 Configure test inputs below. Configured values from properties are already applied.
                    </div>

                    {/* Test Inputs */}
                    {testInputs.length > 0 ? (
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                                Test Inputs
                            </h4>
                            {testInputs.map((input: any) => (
                                <DynamicFormField
                                    key={input.name}
                                    field={input}
                                    value={inputData[input.name]}
                                    onChange={(val) => updateInputData(input.name, val)}
                                    allValues={inputData}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FiCheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">All required fields are configured</p>
                            <p className="text-xs mt-1">Ready to test</p>
                        </div>
                    )}

                    {/* Test Results */}
                    {testResult && (
                        <div className="space-y-3 pt-4 border-t border-border/40">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                                    Test Results
                                </h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopyOutput}
                                >
                                    <FiCopy className="w-3 h-3 mr-1" />
                                    Copy
                                </Button>
                            </div>

                            {/* Status */}
                            <div className="glass rounded-lg p-3 border border-border/40">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-sm font-medium text-green-500">Success</span>
                                </div>
                                {testResult.execution_time_ms && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <FiClock className="w-3 h-3" />
                                        <span>{testResult.execution_time_ms}ms</span>
                                    </div>
                                )}
                            </div>

                            {/* Output Data */}
                            <div className="glass rounded-lg p-3 border border-border/40">
                                <div className="text-xs font-medium text-muted-foreground mb-2">OUTPUT</div>
                                <div className="bg-muted/30 rounded p-2 text-xs font-mono overflow-x-auto">
                                    <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(testResult.output || testResult, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Test Error */}
                    {testError && (
                        <div className="glass rounded-lg p-3 border border-red-500/20 bg-red-500/5 mt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FiAlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium text-red-500">Test Failed</span>
                            </div>
                            <div className="text-xs text-red-500 whitespace-pre-wrap">
                                {testError}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border/40 bg-muted/30 flex justify-end gap-3">
                    {!isConnected && (
                        <div className="text-xs text-amber-500 flex items-center gap-1 mr-auto">
                            <FiAlertCircle className="w-3 h-3" />
                            WebSocket unavailable, using HTTP fallback
                        </div>
                    )}
                    <Button variant="ghost" onClick={onClose} disabled={isTesting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleTest}
                        disabled={isTesting}
                    >
                        {isTesting ? (
                            <>
                                <Spinner className="size-4 mr-2" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <FiPlay className="w-4 h-4 mr-2" />
                                Run Test
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
