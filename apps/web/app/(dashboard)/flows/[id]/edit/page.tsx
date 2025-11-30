'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import toast from '@/lib/toast'
import {
    FiArrowLeft,
    FiSave,
    FiPlay,
    FiX,
    FiLoader,
    FiMoreVertical
} from 'react-icons/fi'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    addEdge,
    BackgroundVariant,
    useReactFlow,
    type Connection,
    type Edge,
    type Node,
    Panel
} from 'reactflow'
import 'reactflow/dist/style.css'
import axiosClient from '@/lib/axios-client'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import {
    setNodes,
    updateNodesWithoutDirty,
    setEdges,
    updateEdgesWithoutDirty,
    addNode as addNodeAction,
    updateNode as updateNodeAction,
    setSelectedNodeId,
    setWorkflowName,
    setSelectedChannelId,
    setHasUnsavedChanges,
    setIsExecuting,
    setIsTesting,
    clearDraftTemplate,
    loadWorkflow,
    resetEditor
} from '@/lib/store/slices/workflowEditorSlice'
import { NodePalette } from '@/components/features/workflow/node-palette'
import NodeProperties from '@/components/features/workflow/node-properties'
import CustomNode from '@/components/features/workflow/custom-node'
import { TestNodePanel } from '@/components/features/workflow/test-node-panel'
import { NodeContextMenu } from '@/components/features/workflow/node-context-menu'
import { ExecuteFlowModal } from '@/components/features/workflow/execute-flow-modal'
import type { NodeType } from '@/lib/store/slices/nodeTypesSlice'
import { useExecutionWebSocket } from '@/lib/hooks/use-execution-websocket'

const nodeTypes = {
    custom: CustomNode
}

interface Channel {
    id: number
    name: string
}

export default function WorkflowEditorPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const { screenToFlowPosition } = useReactFlow()
    const dispatch = useAppDispatch()

    // Redux state (Global) - with default values
    const nodes = useAppSelector((state: any) => state.workflowEditor?.nodes || [])
    const edges = useAppSelector((state: any) => state.workflowEditor?.edges || [])
    const selectedNodeId = useAppSelector((state: any) => state.workflowEditor?.selectedNodeId)
    const workflowName = useAppSelector((state: any) => state.workflowEditor?.workflowName || 'Untitled Workflow')
    const selectedChannelId = useAppSelector((state: any) => state.workflowEditor?.selectedChannelId)
    const hasUnsavedChanges = useAppSelector((state: any) => state.workflowEditor?.hasUnsavedChanges || false)
    const isExecuting = useAppSelector((state: any) => state.workflowEditor?.isExecuting || false)
    const isTesting = useAppSelector((state: any) => state.workflowEditor?.isTesting || false)
    const draftTemplate = useAppSelector((state: any) => state.workflowEditor?.draftTemplate)

    // Local UI state only
    const [showProperties, setShowProperties] = useState(false)
    const [showTestPanel, setShowTestPanel] = useState(false)
    const [showExecuteModal, setShowExecuteModal] = useState(false)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Temporary data (from API)
    const [flow, setFlow] = useState<any>(null)
    const [channels, setChannels] = useState<Channel[]>([])
    const [savedState, setSavedState] = useState<string>('')
    
    // Ref to prevent double-save of template
    const templateSavedRef = useRef(false)

    // Custom handlers that dispatch to Redux
    const handleNodesChange = useCallback((changes: any) => {
        // Apply changes using ReactFlow's applyNodeChanges
        let updatedNodes = [...nodes]
        let shouldMarkDirty = false

        changes.forEach((change: any) => {
            if (change.type === 'position') {
                // Update position
                updatedNodes = updatedNodes.map(n =>
                    n.id === change.id
                        ? { ...n, position: change.position || n.position }
                        : n
                )
                // Only mark dirty if dragging finished
                if (change.dragging === false) {
                    shouldMarkDirty = true
                }
            } else if (change.type === 'dimensions') {
                // Update dimensions (not dirty)
                updatedNodes = updatedNodes.map(n =>
                    n.id === change.id
                        ? { ...n, width: change.dimensions?.width, height: change.dimensions?.height }
                        : n
                )
            } else if (change.type === 'select') {
                // Update selection (not dirty)
                updatedNodes = updatedNodes.map(n =>
                    n.id === change.id
                        ? { ...n, selected: change.selected }
                        : n
                )
            } else if (change.type === 'remove') {
                // Remove node (dirty)
                updatedNodes = updatedNodes.filter(n => n.id !== change.id)
                shouldMarkDirty = true
            }
        })

        // Use appropriate action based on whether change should mark dirty
        if (shouldMarkDirty) {
            dispatch(setNodes(updatedNodes))
        } else {
            dispatch(updateNodesWithoutDirty(updatedNodes))
        }
    }, [nodes, dispatch])

    const handleEdgesChange = useCallback((changes: any) => {
        let updatedEdges = [...edges]
        let shouldMarkDirty = false

        changes.forEach((change: any) => {
            if (change.type === 'remove') {
                updatedEdges = updatedEdges.filter(e => e.id !== change.id)
                shouldMarkDirty = true // Removing edge is meaningful change
            } else if (change.type === 'select') {
                updatedEdges = updatedEdges.map(e =>
                    e.id === change.id
                        ? { ...e, selected: change.selected }
                        : e
                )
                // Selection doesn't mark dirty
            }
        })

        // Use appropriate action
        if (shouldMarkDirty) {
            dispatch(setEdges(updatedEdges))
        } else {
            dispatch(updateEdgesWithoutDirty(updatedEdges))
        }
    }, [edges, dispatch])

    // WebSocket execution hook (shared for both Test Run and Execute)
    // Note: We use Redux states (isTesting, isExecuting) for button states, not isWebSocketExecuting
    const { execute: executeWithWebSocket, isExecuting: isWebSocketExecuting } = useExecutionWebSocket(
        (updater: any) => {
            const newNodes = typeof updater === 'function' ? updater(nodes) : updater
            // Don't mark as dirty when updating execution status via WebSocket
            dispatch(updateNodesWithoutDirty(newNodes))
        }
    )

    // Auto-clear execution status after 5 seconds
    useEffect(() => {
        // Wait until all executions are done (both Test Run and Execute)
        if (!isExecuting && !isTesting) {
            const hasExecutionStatus = nodes.some((n: Node) => n.data?.executionStatus)

            if (hasExecutionStatus) {
                const timer = setTimeout(() => {
                    const cleanNodes = nodes.map((n: Node) => ({
                        ...n,
                        data: {
                            ...n.data,
                            executionStatus: undefined,
                            executionError: undefined
                        }
                    }))
                    // Don't mark as dirty when clearing execution status
                    dispatch(updateNodesWithoutDirty(cleanNodes))
                }, 5000) // Clear after 5 seconds

                return () => clearTimeout(timer)
            }
        }
    }, [isExecuting, isTesting, nodes, dispatch])

    const selectedNode = useMemo(() =>
        nodes.find((n: Node) => n.id === selectedNodeId) || null
        , [nodes, selectedNodeId])

    useEffect(() => {
        loadChannels()
    }, [])


    const currentStateString = useMemo(() => {
        if (!Array.isArray(nodes)) {
            return JSON.stringify({
                name: workflowName,
                channel_id: selectedChannelId,
                nodes: [],
                edges: []
            })
        }

        const cleanNodes = nodes.map((node: any) => {
            if (!node || !node.id) return null
            const {
                executionStatus,
                executionError,
                executionOutput,
                ...cleanData
            } = node.data || {}
            return {
                id: node.id,
                type: node.type || 'custom',
                position: node.position ? {
                    x: Math.round(node.position.x || 0),
                    y: Math.round(node.position.y || 0)
                } : { x: 0, y: 0 },
                data: cleanData
            }
        }).filter(Boolean)

        return JSON.stringify({
            name: workflowName,
            channel_id: selectedChannelId,
            nodes: cleanNodes,
            edges
        })
    }, [workflowName, selectedChannelId, nodes, edges])

    useEffect(() => {
        if (!savedState) return
        const hasChanges = currentStateString !== savedState
        if (hasChanges !== hasUnsavedChanges) {
            dispatch(setHasUnsavedChanges(hasChanges))
        }
    }, [currentStateString, savedState, hasUnsavedChanges, dispatch])

    const migrateNodes = (nodes: Node[]) => {
        return nodes.map(node => {
            const originalType = node.data?.type || node.type

            return {
                ...node,
                type: 'custom',
                data: {
                    ...node.data,
                    type: originalType,
                    label: node.data?.label || node.data?.name || originalType
                }
            }
        })
    }

    useEffect(() => {
        if (params.id === 'new') {
            // Load template from Redux if available
            if (draftTemplate && !templateSavedRef.current) {
                // Mark as being saved to prevent double-save
                templateSavedRef.current = true
                
                const migratedNodes = migrateNodes(draftTemplate.nodes || [])
                const templateName = draftTemplate.name || 'Untitled Workflow'
                const templateEdges = draftTemplate.edges || []

                // CRITICAL: Clear template FIRST to prevent double-save on re-mount
                dispatch(clearDraftTemplate())

                // Load template into editor
                dispatch(setNodes(migratedNodes))
                dispatch(setEdges(templateEdges))
                dispatch(setWorkflowName(templateName))

                // Auto-save the template as a new flow
                const createFlowFromTemplate = async () => {
                    try {
                        setIsSaving(true)
                        const flowData = {
                            name: templateName,
                            description: '',
                            channel_id: null,
                            data: {
                                nodes: migratedNodes,
                                edges: templateEdges
                            }
                        }

                        const created: any = await axiosClient.post('/flows/', flowData)
                        setFlow(created)

                        // Update saved state
                        const cleanNodes = migratedNodes.map((node: any) => {
                            if (!node) return null
                            const { executionStatus, executionError, executionOutput, ...cleanData } = node.data || {}
                            return {
                                id: node.id,
                                type: node.type,
                                position: node.position ? {
                                    x: Math.round(node.position.x || 0),
                                    y: Math.round(node.position.y || 0)
                                } : { x: 0, y: 0 },
                                data: cleanData
                            }
                        }).filter(Boolean)

                        const newState = JSON.stringify({
                            name: templateName,
                            channel_id: null,
                            nodes: cleanNodes,
                            edges: templateEdges
                        })
                        setSavedState(newState)
                        dispatch(setHasUnsavedChanges(false))

                        // Redirect to the new flow URL properly
                        router.replace(`/flows/${created.id}/edit`)

                        // No toast needed for auto-save of template
                    } catch (error) {
                        console.error('Failed to auto-save template:', error)
                        toast.error('Failed to save template as new flow')
                    } finally {
                        setIsSaving(false)
                    }
                }

                createFlowFromTemplate()
            } else {
                // Empty new flow - set empty state
                dispatch(setNodes([]))
                dispatch(setEdges([]))
                dispatch(setWorkflowName('Untitled Workflow'))
                dispatch(setSelectedChannelId(null))
                setSavedState(JSON.stringify({
                    name: 'Untitled Workflow',
                    channel_id: null,
                    nodes: [],
                    edges: []
                }))
                dispatch(setHasUnsavedChanges(false)) // No changes yet for empty flow
            }
        } else {
            // Existing flow - load from API
            loadFlow()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id])

    const loadChannels = async () => {
        try {
            const data: any = await axiosClient.get('/channels/')
            setChannels(data)
        } catch (e: any) {
            console.error('Failed to load channels:', e)
        }
    }

    const loadFlow = async () => {
        try {
            const data: any = await axiosClient.get(`/flows/${params.id}`)
            setFlow(data)

            // IMPORTANT: Backend uses 'data' field, not 'flow_data'
            const flowData = data.data || data.flow_data || {}

            const migratedNodes = flowData.nodes ? migrateNodes(flowData.nodes) : []

            // Load into Redux
            dispatch(loadWorkflow({
                name: data.name,
                description: data.description || '',
                nodes: migratedNodes,
                edges: flowData.edges || [],
                channelId: data.channel_id || null
            }))

            // Save initial state (clean nodes for comparison - remove execution status)
            // Use migrated nodes to ensure consistency
            const cleanNodes = migratedNodes.map((node: any) => {
                if (!node) return null
                const { executionStatus, executionError, executionOutput, ...cleanData } = node.data || {}
                return {
                    id: node.id,
                    type: node.type,
                    position: node.position ? {
                        x: Math.round(node.position.x || 0),
                        y: Math.round(node.position.y || 0)
                    } : { x: 0, y: 0 },
                    data: cleanData
                }
            }).filter(Boolean)

            const initialState = JSON.stringify({
                name: data.name,
                channel_id: data.channel_id || null,
                nodes: cleanNodes,
                edges: flowData.edges || []
            })
            setSavedState(initialState)
            dispatch(setHasUnsavedChanges(false))
        } catch (e: any) {
            toast.error('Failed to load workflow')
        }
    }



    const onConnect = useCallback(
        (params: Edge | Connection) => {
            const newEdge = addEdge(params, edges)
            dispatch(setEdges(newEdge))
        },
        [edges, dispatch]
    )

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [])

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault()

            const nodeTypeData = event.dataTransfer.getData('application/reactflow')
            if (!nodeTypeData) return

            const nodeType: NodeType = JSON.parse(nodeTypeData)
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            })

            const newNode: Node = {
                id: `${nodeType.id}-${Date.now()}`,
                type: 'custom',
                position,
                data: {
                    label: nodeType.label,
                    type: nodeType.id,
                    config: {}
                }
            }

            dispatch(addNodeAction(newNode))
        },
        [screenToFlowPosition, dispatch]
    )

    const handleAddNode = useCallback((nodeType: NodeType) => {
        const position = {
            x: Math.random() * 400 + 100,
            y: Math.random() * 400 + 100
        }

        const newNode: Node = {
            id: `${nodeType.id}-${Date.now()}`,
            type: 'custom',
            position,
            data: {
                label: nodeType.label,
                type: nodeType.id,
                config: {}
            }
        }

        dispatch(addNodeAction(newNode))
    }, [dispatch])

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        // Clear execution status when clicking node
        if (node.data?.executionStatus) {
            const cleanNode = {
                ...node,
                data: {
                    ...node.data,
                    executionStatus: undefined,
                    executionError: undefined
                }
            }
            const cleanNodes = nodes.map((n: Node) => n.id === node.id ? cleanNode : n)
            // Don't mark as dirty when clearing execution status
            dispatch(updateNodesWithoutDirty(cleanNodes))
        }

        dispatch(setSelectedNodeId(node.id))
        setShowProperties(true)
        setShowTestPanel(false)
    }, [nodes, dispatch])

    const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
        event.preventDefault()
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            nodeId: node.id
        })
        dispatch(setSelectedNodeId(node.id))
    }, [dispatch])

    const handleContextMenuTest = () => {
        setShowTestPanel(true)
        setShowProperties(false)
    }

    const handleContextMenuEdit = () => {
        setShowProperties(true)
        setShowTestPanel(false)
    }

    const handleContextMenuDuplicate = useCallback(() => {
        const nodeToDuplicate = nodes.find((n: Node) => n.id === contextMenu?.nodeId)
        if (nodeToDuplicate) {
            const newNode: Node = {
                ...nodeToDuplicate,
                id: `${nodeToDuplicate.data.type}-${Date.now()}`,
                position: {
                    x: nodeToDuplicate.position.x + 50,
                    y: nodeToDuplicate.position.y + 50
                },
                selected: false
            }
            dispatch(addNodeAction(newNode))
            // toast.success('Node duplicated!')
        }
    }, [nodes, contextMenu, dispatch])

    const handleContextMenuDelete = useCallback(() => {
        if (contextMenu?.nodeId) {
            const newNodes = nodes.filter((n: Node) => n.id !== contextMenu.nodeId)
            const newEdges = edges.filter((e: Edge) => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId)

            dispatch(setNodes(newNodes))
            dispatch(setEdges(newEdges))
            setShowProperties(false)
            setShowTestPanel(false)
            dispatch(setSelectedNodeId(null))
            // toast.success('Node deleted!')
        }
    }, [contextMenu, nodes, edges, dispatch])

    const handleNodeUpdate = useCallback((updatedNode: Node) => {
        dispatch(updateNodeAction({ id: updatedNode.id, data: updatedNode.data }))
    }, [dispatch])

    const handleSave = async () => {
        const savePromise = (async () => {
            setIsSaving(true)
            // IMPORTANT: Backend uses 'data' field, not 'flow_data'
            const flowData = {
                name: workflowName,
                description: flow?.description || '',
                channel_id: selectedChannelId,
                data: {
                    nodes,
                    edges
                }
            }

            if (params.id === 'new') {
                // Create new flow
                const created: any = await axiosClient.post('/flows/', flowData)
                setFlow(created)

                // Update saved state
                const cleanNodes = nodes.map((node: any) => {
                    if (!node) return null
                    const { executionStatus, executionError, executionOutput, ...cleanData } = node.data || {}
                    return {
                        id: node.id,
                        type: node.type,
                        position: node.position ? {
                            x: Math.round(node.position.x || 0),
                            y: Math.round(node.position.y || 0)
                        } : { x: 0, y: 0 },
                        data: cleanData
                    }
                }).filter(Boolean)

                const newState = JSON.stringify({
                    name: workflowName,
                    channel_id: selectedChannelId,
                    nodes: cleanNodes,
                    edges
                })
                setSavedState(newState)
                dispatch(setHasUnsavedChanges(false))

                // Update URL without triggering navigation (replace instead of push)
                window.history.replaceState({}, '', `/flows/${created.id}/edit`)

                return created
            } else {
                // Update existing flow
                const updated: any = await axiosClient.put(`/flows/${params.id}`, flowData)
                setFlow(updated)

                // Update saved state after successful save (clean execution status)
                const cleanNodes = nodes.map((node: any) => {
                    if (!node) return null
                    const { executionStatus, executionError, executionOutput, ...cleanData } = node.data || {}
                    return {
                        id: node.id,
                        type: node.type,
                        position: node.position ? {
                            x: Math.round(node.position.x || 0),
                            y: Math.round(node.position.y || 0)
                        } : { x: 0, y: 0 },
                        data: cleanData
                    }
                }).filter(Boolean)

                const newState = JSON.stringify({
                    name: workflowName,
                    channel_id: selectedChannelId,
                    nodes: cleanNodes,
                    edges
                })
                setSavedState(newState)
                dispatch(setHasUnsavedChanges(false))

                return updated
            }
        })()

        toast.promise(savePromise, {
            loading: 'Saving workflow...',
            success: params.id === 'new'
                ? 'Workflow created! You can continue editing.'
                : 'Workflow saved successfully!',
            error: (err) => `Failed to save: ${err.message}`
        })

        savePromise.finally(() => setIsSaving(false))
    }

    // Save as Template
    const handleSaveAsTemplate = async () => {
        if (nodes.length === 0) {
            toast.error('Add some nodes first!')
            return
        }

        if (hasUnsavedChanges) {
            toast.error('Please save your workflow first')
            return
        }

        const templateName = prompt('Enter template name:', workflowName || 'My Template')
        if (!templateName) return

        const templateDescription = prompt('Enter template description (optional):')

        try {
            await axiosClient.post('/templates/', {
                name: templateName,
                description: templateDescription || '',
                category: 'custom',
                nodes: nodes.map((node: any) => {
                    const { executionStatus, executionError, executionOutput, ...cleanData } = node.data || {}
                    return {
                        id: node.id,
                        type: node.type,
                        position: node.position,
                        data: cleanData
                    }
                }),
                edges: edges
            })
            toast.success('Template saved successfully!')
        } catch (error) {
            console.error('Failed to save template:', error)
            toast.error('Failed to save template')
        }
    }

    // Test Run with WebSocket (real-time node updates)
    const handleTestRun = async () => {
        if (nodes.length === 0) {
            toast.error('Add some nodes first!')
            return
        }

        // Use flow.id if available (after save), otherwise try params.id
        const flowId = flow?.id || (params.id !== 'new' ? parseInt(params.id) : null)
        if (!flowId) {
            toast.error('Please save the workflow before testing')
            return
        }

        // Block if unsaved changes - must save first
        if (hasUnsavedChanges) {
            toast.error('Please save your changes before testing')
            return
        }

        // Validate that nodes are connected (at least 1 edge if multiple nodes)
        if (nodes.length > 1 && edges.length === 0) {
            toast.error('Please connect your nodes before testing')
            return
        }

        dispatch(setIsTesting(true))
        try {
            await executeWithWebSocket(flowId, {})
            toast.success('Test run completed!')
        } catch (error: any) {
            toast.error(`Test run failed: ${error.message}`)
        } finally {
            dispatch(setIsTesting(false))
        }
    }

    // Execute - Open modal to input data
    const handleExecute = () => {
        if (nodes.length === 0) {
            toast.error('Add some nodes first!')
            return
        }

        // Use flow.id if available (after save), otherwise try params.id
        const flowId = flow?.id || (params.id !== 'new' ? parseInt(params.id) : null)
        if (!flowId) {
            toast.error('Please save the workflow before executing')
            return
        }

        // Block if unsaved changes - must save first
        if (hasUnsavedChanges) {
            toast.error('Please save your changes before executing')
            return
        }

        // Validate that nodes are connected (at least 1 edge if multiple nodes)
        if (nodes.length > 1 && edges.length === 0) {
            toast.error('Please connect your nodes before executing')
            return
        }

        setShowExecuteModal(true)
    }

    // Execute workflow with input data from modal
    const handleExecuteWithData = async (inputData: Record<string, any>) => {
        // Use flow.id if available (after save), otherwise try params.id
        const flowId = flow?.id || (params.id !== 'new' ? parseInt(params.id) : null)
        if (!flowId) {
            toast.error('Please save the workflow before executing')
            return
        }

        dispatch(setIsExecuting(true))
        setShowExecuteModal(false)

        try {
            // Use WebSocket for real-time execution with node status updates
            await executeWithWebSocket(flowId, inputData)
            toast.success('Workflow executed successfully!')
        } catch (error: any) {
            toast.error(`Execution failed: ${error.message}`)
        } finally {
            dispatch(setIsExecuting(false))
        }
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-border/40 flex items-center justify-between px-6 bg-background">
                <div className="flex items-center gap-4 flex-1">
                    <Link href="/flows">
                        <Button variant="ghost" size="icon">
                            <FiArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <input
                        type="text"
                        value={workflowName}
                        onChange={(e) => dispatch(setWorkflowName(e.target.value))}
                        className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 max-w-md"
                        placeholder="Workflow name"
                    />

                    {/* Channel Selector */}
                    <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-muted-foreground">Channel:</span>
                        <select
                            value={selectedChannelId || ''}
                            onChange={(e) => dispatch(setSelectedChannelId(e.target.value ? Number(e.target.value) : null))}
                            className="px-3 py-1.5 rounded-lg border border-border/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">All Channels</option>
                            {channels.map((channel) => (
                                <option key={channel.id} value={channel.id}>
                                    {channel.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                        <span className="text-sm text-amber-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            Unsaved changes
                        </span>
                    )}

                    {/* Test Run - WebSocket real-time */}
                    <Button
                        variant="outline"
                        onClick={handleTestRun}
                        disabled={isTesting}
                        title="Test run with real-time node updates"
                    >
                        {isTesting ? (
                            <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <FiPlay className="w-4 h-4 mr-2" />
                        )}
                        Test Run
                    </Button>

                    {/* Execute - WebSocket with input data */}
                    <Button
                        onClick={handleExecute}
                        disabled={isExecuting}
                        title="Execute with input data and show detailed results"
                    >
                        {isExecuting ? (
                            <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <FiPlay className="w-4 h-4 mr-2" />
                        )}
                        Execute
                    </Button>

                    {hasUnsavedChanges && (
                        <Button onClick={handleSave} disabled={isSaving} variant="default">
                            {isSaving ? (
                                <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <FiSave className="w-4 h-4 mr-2" />
                            )}
                            Save
                        </Button>
                    )}

                    {/* More Options Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <FiMoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleSaveAsTemplate}>
                                <FiSave className="w-4 h-4 mr-2" />
                                Save as Template
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={handleNodesChange}
                        onEdgesChange={handleEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onNodeContextMenu={onNodeContextMenu}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                        <Controls />
                        <MiniMap />
                        <Panel position="top-left">
                            <NodePalette onAddNode={handleAddNode} />
                        </Panel>
                        {contextMenu && (
                            <NodeContextMenu
                                x={contextMenu.x}
                                y={contextMenu.y}
                                onClose={() => setContextMenu(null)}
                                onTest={handleContextMenuTest}
                                onEdit={handleContextMenuEdit}
                                onDuplicate={handleContextMenuDuplicate}
                                onDelete={handleContextMenuDelete}
                                canTest={params.id !== 'new'}
                            />
                        )}
                    </ReactFlow>
                </div>

                {/* Properties Panel - Always show when node is selected, even if execution results are visible */}
                {showProperties && selectedNode && !showTestPanel && (
                    <div className="w-80 border-l border-border/40 bg-background flex flex-col h-full z-10">
                        <div className="p-4 border-b border-border/40 flex items-center justify-between">
                            <h3 className="font-semibold">Node Properties</h3>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowProperties(false)}
                                >
                                    <FiX className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <NodeProperties
                                node={selectedNode}
                                onUpdate={handleNodeUpdate}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Test Node Modal */}
            <Dialog open={showTestPanel} onOpenChange={setShowTestPanel}>
                <DialogContent className="max-w-2xl h-[80vh] p-0 overflow-hidden bg-background">
                    {selectedNode && (
                        <TestNodePanel
                            node={selectedNode}
                            onClose={() => setShowTestPanel(false)}
                            flowId={params.id}
                            className="w-full border-0"
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Execute Flow Modal */}
            <ExecuteFlowModal
                isOpen={showExecuteModal}
                onClose={() => setShowExecuteModal(false)}
                onExecute={handleExecuteWithData}
                nodes={nodes}
                isExecuting={isExecuting}
            />


        </div>
    )
}
