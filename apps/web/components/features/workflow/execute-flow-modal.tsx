'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FiPlay, FiX, FiLoader, FiAlertCircle } from 'react-icons/fi'
import { DynamicFormField } from './dynamic-form-field'
import { Node } from 'reactflow'
import { useNodeTypes } from '@/lib/context/node-types-context'

interface ExecuteFlowModalProps {
    isOpen: boolean
    onClose: () => void
    onExecute: (data: any) => Promise<void>
    nodes: Node[]
    isExecuting: boolean
}

export function ExecuteFlowModal({ isOpen, onClose, onExecute, nodes, isExecuting }: ExecuteFlowModalProps) {
    const [inputData, setInputData] = useState<Record<string, any>>({})
    const [allNodesData, setAllNodesData] = useState<Record<string, any>>({})
    const { getNodeType } = useNodeTypes()

    useEffect(() => {
        if (isOpen && nodes.length > 0) {
            // Initialize data for all nodes
            const initialData: Record<string, any> = {}
            nodes.forEach(node => {
                const nodeType = getNodeType(node.type || '')
                // Use executeInputs if available, otherwise fall back to properties
                const inputs = (nodeType as any)?.executeInputs || nodeType?.properties || []

                if (inputs.length > 0) {
                    // Initialize with default values from inputs
                    const nodeDefaults: Record<string, any> = {}
                    inputs.forEach((input: any) => {
                        // Only set default if NOT configured
                        const configValue = node.data.config?.[input.name]
                        const isConfigured = configValue !== undefined && configValue !== '' && configValue !== null

                        if (!isConfigured && input.default !== undefined) {
                            nodeDefaults[input.name] = input.default
                        }
                    })
                    initialData[node.id] = nodeDefaults
                } else {
                    initialData[node.id] = {}
                }
            })
            setAllNodesData(initialData)
            setInputData({})
        }
    }, [isOpen, nodes, getNodeType])

    if (!isOpen) return null

    // Helper to find trigger variables used in other nodes
    const findTriggerVariables = (nodes: Node[]) => {
        const vars = new Set<string>()
        // Regex to match {{trigger.body.variableName}}
        const regex = /\{\{trigger\.body\.([a-zA-Z0-9_]+)\}\}/g

        const walk = (obj: any) => {
            if (!obj) return
            if (typeof obj === 'string') {
                let match
                while ((match = regex.exec(obj)) !== null) {
                    vars.add(match[1])
                }
            } else if (typeof obj === 'object') {
                Object.values(obj).forEach(walk)
            }
        }

        nodes.forEach(node => walk(node.data))
        return Array.from(vars)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Combine all nodes data into execution payload
        const executionData: Record<string, any> = {}

        // Get trigger variables to know which fields belong to trigger body
        const triggerVars = findTriggerVariables(nodes)

        nodes.forEach(node => {
            if (allNodesData[node.id] && Object.keys(allNodesData[node.id]).length > 0) {
                // Special handling for trigger nodes with detected variables
                if (node.type?.startsWith('trigger-') && triggerVars.length > 0) {
                    // Check if the data contains any of the detected variables
                    const nodeData = allNodesData[node.id]
                    const hasTriggerVars = Object.keys(nodeData).some(k => triggerVars.includes(k))

                    if (hasTriggerVars) {
                        // Separate body params from other params
                        const bodyParams: Record<string, any> = {}
                        const otherParams: Record<string, any> = {}

                        Object.entries(nodeData).forEach(([key, val]) => {
                            if (triggerVars.includes(key)) {
                                bodyParams[key] = val
                            } else {
                                otherParams[key] = val
                            }
                        })

                        executionData[node.id] = {
                            ...otherParams,
                            body: bodyParams
                        }
                    } else {
                        executionData[node.id] = nodeData
                    }
                } else {
                    executionData[node.id] = allNodesData[node.id]
                }
            }
        })

        await onExecute(executionData)
    }

    const updateNodeData = (nodeId: string, field: string, value: any) => {
        setAllNodesData(prev => ({
            ...prev,
            [nodeId]: {
                ...prev[nodeId],
                [field]: value
            }
        }))
    }

    // Group nodes by category for better organization
    const renderNodeInputs = () => {
        const sections: { title: string; nodes: Node[]; customInputs?: Record<string, any[]> }[] = []
        const triggerVars = findTriggerVariables(nodes)

        // Trigger nodes first
        const activeTriggers = nodes.filter(n => n.type?.startsWith('trigger-'))

        if (activeTriggers.length > 0) {
            // If we detected variables like {{trigger.body.xyz}}, add them as inputs to the first trigger node
            const customTriggerInputs: Record<string, any[]> = {}

            if (triggerVars.length > 0) {
                const targetTriggerId = activeTriggers[0].id
                const targetNode = activeTriggers[0]

                // Filter out variables that are already configured in the trigger node
                const unconfiguredVars = triggerVars.filter(v => {
                    const configValue = targetNode.data.config?.[v]
                    return configValue === undefined || configValue === '' || configValue === null
                })

                if (unconfiguredVars.length > 0) {
                    customTriggerInputs[targetTriggerId] = unconfiguredVars.map(v => {
                        const lowerV = v.toLowerCase()
                        const isFile = /image|photo|video|file|attachment|media/.test(lowerV)
                        const isMultiple = /s$/.test(lowerV) || lowerV.includes('list') || lowerV.includes('array')

                        let accept = undefined
                        if (lowerV.includes('image') || lowerV.includes('photo')) accept = 'image/*'
                        else if (lowerV.includes('video')) accept = 'video/*'
                        else if (lowerV.includes('audio')) accept = 'audio/*'

                        return {
                            name: v,
                            label: v.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
                            type: isFile ? 'file' : 'text',
                            required: true,
                            description: `Detected from usage: {{trigger.body.${v}}}`,
                            multiple: isMultiple,
                            accept: accept
                        }
                    })
                }
            }

            if (Object.keys(customTriggerInputs).length > 0) {
                sections.push({
                    title: 'Trigger Inputs',
                    nodes: activeTriggers,
                    customInputs: customTriggerInputs
                })
            }
        }

        // Other nodes that need input
        const otherNodes = nodes.filter(n => {
            if (n.type?.startsWith('trigger-')) return false
            const nodeType = getNodeType(n.type || '')
            const inputs = (nodeType as any)?.executeInputs || nodeType?.properties || []

            // Filter out inputs that are already configured
            const unconfiguredInputs = inputs.filter((input: any) => {
                const configValue = n.data.config?.[input.name]
                const isUnconfigured = configValue === undefined || configValue === '' || configValue === null
                // Only show if it's unconfigured AND required
                return isUnconfigured && input.required
            })

            return unconfiguredInputs.length > 0
        })

        if (otherNodes.length > 0) {
            sections.push({ title: 'Required Inputs', nodes: otherNodes })
        }

        if (sections.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                        <FiPlay className="w-8 h-8 text-green-500" />
                    </div>
                    <h4 className="text-lg font-medium text-foreground mb-2">Ready to Execute</h4>
                    <p className="text-sm max-w-xs text-center">
                        All required fields are already configured in the workflow.
                    </p>
                </div>
            )
        }

        return sections.map((section, idx) => (
            <div key={idx} className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                        {section.title}
                    </h4>
                </div>

                {section.nodes.map(node => {
                    const nodeType = getNodeType(node.type || '')
                    const definedInputs = (nodeType as any)?.executeInputs || nodeType?.properties || []
                    const detectedInputs = section.customInputs?.[node.id] || []

                    // Filter defined inputs to only show unconfigured ones
                    const unconfiguredDefinedInputs = definedInputs.filter((input: any) => {
                        const configValue = node.data.config?.[input.name]
                        const isUnconfigured = configValue === undefined || configValue === '' || configValue === null
                        // Only show if it's unconfigured AND required
                        return isUnconfigured && input.required
                    })

                    // Merge inputs
                    const allInputs = [...unconfiguredDefinedInputs, ...detectedInputs]

                    if (allInputs.length === 0) return null

                    return (
                        <div key={node.id} className="space-y-4">
                            {/* Only show node header if there are multiple nodes requiring input */}
                            {(sections.length > 1 || section.nodes.length > 1) && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: nodeType?.color || '#888' }}
                                    />
                                    <span>{node.data.label || nodeType?.label || 'Node'}</span>
                                </div>
                            )}

                            <div className="grid gap-4">
                                {allInputs.map((input: any) => (
                                    <DynamicFormField
                                        key={input.name}
                                        field={input}
                                        value={allNodesData[node.id]?.[input.name]}
                                        onChange={(val) => updateNodeData(node.id, input.name, val)}
                                        allValues={allNodesData[node.id] || {}}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        ))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FiPlay className="w-4 h-4 text-primary" />
                            Execute Workflow
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Configure inputs for {nodes.length} node{nodes.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="execute-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-500">
                            💡 Fill in the required fields below to test your workflow. Real actions will be performed.
                        </div>

                        {renderNodeInputs()}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isExecuting}>
                        Cancel
                    </Button>
                    <Button type="submit" form="execute-form" disabled={isExecuting}>
                        {isExecuting ? (
                            <>
                                <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                                Executing...
                            </>
                        ) : (
                            <>
                                <FiPlay className="w-4 h-4 mr-2" />
                                Run Workflow
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
