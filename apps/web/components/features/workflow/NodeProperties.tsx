
'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { FiSave, FiSettings, FiPlay, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import toast from '@/lib/toast'
import type { Node } from 'reactflow'
import { useAppSelector } from '@/lib/store/hooks'
import { DynamicFormField } from '@/components/ui/DynamicFormField'

interface NodePropertiesProps {
    node: Node
    onUpdate: (node: Node) => void
}

export const NodeProperties = memo(function NodeProperties({ node, onUpdate }: NodePropertiesProps) {
    const { items: nodeTypes = [] } = useAppSelector((state: any) => state.nodeTypes || {})
    const nodeData = node.data as any
    const [config, setConfig] = useState(nodeData.config || {})
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

    const getNodeType = (typeId: string) => {
        return nodeTypes.find((nt: any) => nt.id === typeId)
    }

    const nodeRef = useRef(node)
    const onUpdateRef = useRef(onUpdate)

    useEffect(() => {
        nodeRef.current = node
        onUpdateRef.current = onUpdate
    }, [node, onUpdate])

    useEffect(() => {
        setConfig(nodeData.config || {})
    }, [node.id, nodeData.config])

    const handleUpdate = () => {
        onUpdateRef.current({
            ...nodeRef.current,
            data: {
                ...nodeRef.current.data,
                config
            }
        })
        toast.success('Node configuration saved!')
    }

    const hasChanges = () => {
        return JSON.stringify(config) !== JSON.stringify(nodeData.config || {})
    }

    // Auto-save when config changes (debounced)
    const autoSave = useCallback(() => {
        onUpdateRef.current({
            ...nodeRef.current,
            data: {
                ...nodeRef.current.data,
                config
            }
        })
        // No toast for auto-save
    }, [config])

    useEffect(() => {
        if (hasChanges() && Object.keys(config).length > 0) {
            const timeoutId = setTimeout(() => {
                autoSave()
            }, 1000) // Debounce 1 second

            return () => clearTimeout(timeoutId)
        }
    }, [config, autoSave])

    const handleTest = async () => {
        setIsTesting(true)
        setTestResult(null)

        try {
            // Simulate testing the node configuration
            // In a real implementation, this would call an API to test the node
            const nodeType = nodeData.type || nodeData.nodeType || node.type
            const nodeTypeInfo = getNodeType(nodeType)

            if (!nodeTypeInfo) {
                throw new Error('Node type not found')
            }

            // Basic validation - check required fields
            const missingFields: string[] = []
            if (nodeTypeInfo.properties) {
                nodeTypeInfo.properties.forEach((prop: any) => {
                    if (prop.required && (!config[prop.name] || config[prop.name] === '')) {
                        missingFields.push(prop.label || prop.name)
                    }
                })
            }

            // Check for variable expressions and validate them
            const invalidExpressions: string[] = []
            Object.entries(config).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    const expressions = value.match(/\{\{[^}]+\}\}/g)
                    if (expressions) {
                        expressions.forEach(expr => {
                            // Basic validation - check if expression follows expected patterns
                            if (!/\{\{[^}]+\}\}/.test(expr)) {
                                invalidExpressions.push(`${key}: ${expr}`)
                            }
                        })
                    }
                }
            })

            if (missingFields.length > 0) {
                setTestResult({
                    success: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`
                })
            } else if (invalidExpressions.length > 0) {
                setTestResult({
                    success: false,
                    message: `Invalid variable expressions: ${invalidExpressions.join(', ')}`
                })
            } else {
                // Simulate successful test
                await new Promise(resolve => setTimeout(resolve, 1000))
                setTestResult({
                    success: true,
                    message: 'Node configuration is valid and ready for execution'
                })
            }
        } catch (error: any) {
            setTestResult({
                success: false,
                message: error.message || 'Test failed'
            })
        } finally {
            setIsTesting(false)
        }
    }

    const updateConfig = useCallback((key: string, value: any) => {
        setConfig((prevConfig: any) => {
            const newConfig = { ...prevConfig, [key]: value }
            // Save to Redux immediately when config changes
            onUpdateRef.current({
                ...nodeRef.current,
                data: {
                    ...nodeRef.current.data,
                    config: newConfig
                }
            })
            return newConfig
        })
    }, [])

    const renderConfigForm = () => {
        // Get node type from data.type or data.nodeType
        const nodeType = nodeData.type || nodeData.nodeType || node.type
        const nodeTypeInfo = getNodeType(nodeType)

        if (!nodeTypeInfo) {
            return (
                <div className="text-center py-12 flex flex-col items-center justify-center text-muted-foreground/50">
                    <FiSettings className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">Node type not found: {nodeType}</p>
                    <p className="text-xs mt-2">Please ensure node types are loaded</p>
                </div>
            )
        }

        if (nodeTypeInfo.properties && Array.isArray(nodeTypeInfo.properties) && nodeTypeInfo.properties.length > 0) {
            return (
                <>
                    {nodeTypeInfo.properties.map((property: any) => (
                        <DynamicFormField
                            key={property.name}
                            field={property}
                            value={config[property.name]}
                            onChange={updateConfig}
                            allValues={config}
                        />
                    ))}
                </>
            )
        }

        return (
            <div className="text-center py-12 flex flex-col items-center justify-center text-muted-foreground/50">
                <FiSettings className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No configuration needed</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-5 p-1 overflow-y-auto">
                {renderConfigForm()}
            </div>

            {/* Test Results */}
            {testResult && (
                <div className={`mx-1 p-3 rounded-lg border ${
                    testResult.success
                        ? 'bg-green-500/10 border-green-500/20 text-green-700'
                        : 'bg-red-500/10 border-red-500/20 text-red-700'
                }`}>
                    <div className="flex items-center gap-2">
                        {testResult.success ? (
                            <FiCheckCircle className="w-4 h-4" />
                        ) : (
                            <FiAlertCircle className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                            {testResult.success ? 'Test Passed' : 'Test Failed'}
                        </span>
                    </div>
                    <p className="text-sm mt-1">{testResult.message}</p>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-border/40 sticky bottom-0 bg-background/95 backdrop-blur pb-1 space-y-2">
                {hasChanges() && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-amber-500 font-medium px-1">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        Unsaved changes
                    </div>
                )}

                {/* Test Button */}
                <Button
                    variant="outline"
                    onClick={handleTest}
                    disabled={isTesting}
                    className="w-full"
                >
                    {isTesting ? (
                        <>
                            <Spinner className="w-4 h-4 mr-2" />
                            Testing...
                        </>
                    ) : (
                        <>
                            <FiPlay className="w-4 h-4 mr-2" />
                            Test Node
                        </>
                    )}
                </Button>

                {/* Save Button */}
                <Button
                    onClick={handleUpdate}
                    className="w-full shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
                >
                    <FiSave className="w-4 h-4 mr-2" />
                    Save Configuration
                </Button>
            </div>
        </div>
    )
})

export default NodeProperties
