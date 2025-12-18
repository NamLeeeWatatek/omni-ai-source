'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { FiPlay, FiAlertCircle } from 'react-icons/fi'
import { DynamicForm } from '@/components/features/ugc-factory/DynamicForm'
import type { NodeProperty } from '@/components/features/ugc-factory/DynamicForm'
import { Node } from 'reactflow'
import { useAppSelector } from '@/lib/store/hooks'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/Dialog'

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
            const initialData: Record<string, any> = {}
            nodes.forEach(node => {
                const nodeType = getNodeType(node.type || '')
                const inputs = (nodeType as any)?.executeInputs || nodeType?.properties || []

                if (inputs.length > 0) {
                    const nodeData: Record<string, any> = { ...node.data.config }

                    inputs.forEach((input: any) => {
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

    const findTriggerVariables = (nodes: Node[]) => {
        const vars = new Set<string>()
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

        const executionData: Record<string, any> = {}

        const triggerVars = findTriggerVariables(nodes)

        nodes.forEach(node => {
            if (allNodesData[node.id] && Object.keys(allNodesData[node.id]).length > 0) {
                if (node.type?.startsWith('trigger-') && triggerVars.length > 0) {
                    const nodeData = allNodesData[node.id]
                    const hasTriggerVars = Object.keys(nodeData).some(k => triggerVars.includes(k))

                    if (hasTriggerVars) {
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

    const renderNodeInputs = () => {
        // Find the first node that has properties for execution
        const executableNode = nodes.find(n => {
            const nodeTypeId = n.data?.type || n.data?.nodeType || n.type || ''
            const nodeType = getNodeType(nodeTypeId)
            const inputs = (nodeType as any)?.executeInputs || nodeType?.properties || []
            return inputs.length > 0
        })

        if (!executableNode) {
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

        // Get properties from the executable node
        const nodeTypeId = executableNode.data?.type || executableNode.data?.nodeType || executableNode.type || ''
        const nodeType = getNodeType(nodeTypeId)
        const definedInputs = (nodeType as any)?.executeInputs || nodeType?.properties || []

        // Show dynamic form for the first node with properties
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: nodeType?.color || '#888' }}
                    />
                    <span>{executableNode.data?.label || nodeType?.label || 'Execution Inputs'}</span>
                </div>

                <DynamicForm
                    properties={definedInputs}
                    formData={allNodesData[executableNode.id] || {}}
                    onFormDataChange={(data) => {
                        setAllNodesData(prev => ({
                            ...prev,
                            [executableNode.id]: data
                        }))
                    }}
                    onSubmit={() => {}}
                    submitLabel=""
                    loading={false}
                />
            </div>
        )
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
