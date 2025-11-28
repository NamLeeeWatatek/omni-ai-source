'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FiPlay, FiAlertCircle } from 'react-icons/fi'
import { DynamicFormField } from './dynamic-form-field'
import { Node } from 'reactflow'
import { useAppSelector } from '@/lib/store/hooks'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'

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
    const { items: nodeTypes = [] } = useAppSelector((state: any) => state.nodeTypes || {})

    const getNodeType = useCallback((typeId: string) => {
        return nodeTypes.find((nt: any) => nt.id === typeId)
    }, [nodeTypes])

    useEffect(() => {
        if (isOpen && nodes.length > 0) {
            // Initialize data for all nodes - START WITH CONFIGURED VALUES
            const initialData: Record<string, any> = {}
            nodes.forEach(node => {
                const nodeType = getNodeType(node.type || '')
                // Use executeInputs if available, otherwise fall back to properties
                const inputs = (nodeType as any)?.executeInputs || nodeType?.properties || []

                if (inputs.length > 0) {
                    // Start with configured values, then add defaults for unconfigured
                    const nodeData: Record<string, any> = { ...node.data.config }

                    inputs.forEach((input: any) => {
                        // If not configured and has default, use default
                        if (nodeData[input.name] === undefined && input.default !== undefined) {
                            nodeData[input.name] = input.default
                        }
                    })
                    initialData[node.id] = nodeData
                } else {
                    initialData[node.id] = { ...node.data.config }
                }
            })
            setAllNodesData(initialData)
            setInputData({})
        }
    }, [isOpen, nodes, getNodeType])

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

        // Other nodes that need input - SHOW EXECUTION FIELDS
        const otherNodes = nodes.filter(n => {
            if (n.type?.startsWith('trigger-')) return false
            const nodeType = getNodeType(n.type || '')
            const inputs = (nodeType as any)?.executeInputs || nodeType?.properties || []

            // Show important execution fields
            const executionInputs = inputs.filter((input: any) => {
                // Always show required fields
                if (input.required) return true

                // Show common execution fields
                const executionFieldNames = ['content', 'prompt', 'message', 'text', 'body', 'query', 'input']
                if (executionFieldNames.includes(input.name.toLowerCase())) return true

                // Show unconfigured fields
                const configValue = n.data.config?.[input.name]
                const isUnconfigured = configValue === undefined || configValue === '' || configValue === null
                return isUnconfigured
            })

            return executionInputs.length > 0
        })

        if (otherNodes.length > 0) {
            sections.push({ title: 'Node Inputs', nodes: otherNodes })
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

                    // Show important fields for execution (both configured and unconfigured)
                    // Priority: required fields + common execution fields (content, prompt, message, etc)
                    const executionFields = definedInputs.filter((input: any) => {
                        // Always show required fields
                        if (input.required) return true

                        // Show common execution fields even if configured
                        const executionFieldNames = ['content', 'prompt', 'message', 'text', 'body', 'query', 'input']
                        if (executionFieldNames.includes(input.name.toLowerCase())) return true

                        // Show unconfigured optional fields
                        const configValue = node.data.config?.[input.name]
                        const isUnconfigured = configValue === undefined || configValue === '' || configValue === null
                        return isUnconfigured
                    })

                    // Merge inputs
                    const allInputs = [...executionFields, ...detectedInputs]

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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <FiPlay className="w-5 h-5 text-primary" />
                        Execute Workflow
                    </DialogTitle>
                    <DialogDescription>
                        Configure inputs for {nodes.length} node{nodes.length !== 1 ? 's' : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    <form id="execute-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-500 flex items-start gap-2">
                            <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Review and modify execution inputs below. Pre-configured values are shown and can be overridden.</span>
                        </div>

                        {renderNodeInputs()}
                    </form>
                </div>

                <DialogFooter className="p-6 pt-2 border-t border-border/40 bg-muted/10">
                    <Button variant="ghost" onClick={onClose} disabled={isExecuting}>
                        Cancel
                    </Button>
                    <Button type="submit" form="execute-form" disabled={isExecuting}>
                        {isExecuting ? (
                            <>
                                <Spinner className="size-4 mr-2" />
                                Executing...
                            </>
                        ) : (
                            <>
                                <FiPlay className="w-4 h-4 mr-2" />
                                Run Workflow
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
