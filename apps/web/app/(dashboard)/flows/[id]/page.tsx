'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'


import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    addEdge,
    useReactFlow,
    ReactFlowProvider,
    type Connection,
    type Edge,
    type Node,
    Panel
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'

import type { NodeType } from '@/lib/store/slices/nodeTypesSlice'
import { useExecutionWebSocket } from '@/lib/hooks/use-execution-websocket'
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
import {
    FiEdit,
    FiPlay,
    FiCopy,
    FiTrash2,
    FiDownload,
    FiShare2,
    FiClock,
    FiCheckCircle,
    FiTrendingUp,
    FiActivity,
    FiLoader,
    FiSave,
    FiArrowLeft,
    FiX,
    FiMoreVertical,
    FiEye
} from 'react-icons/fi'
import { getExecutionReference } from '@/lib/utils/execution'
import CustomNode from '@/components/features/workflow/CustomNode'
import { ExecuteFlowModal } from '@/components/features/workflow/ExecuteFlowModal'
import { NodeContextMenu } from '@/components/features/workflow/NodeContextMenu'
import { NodePalette } from '@/components/features/workflow/NodePalette'
import NodeProperties from '@/components/features/workflow/NodeProperties'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from 'postcss'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'

function FlowPreview({ nodes, edges, allNodeTypes }: { nodes: any[], edges: any[], allNodeTypes: any[] }) {
    const previewNodeTypes = useMemo(() => {
        const types: Record<string, any> = { custom: CustomNode }
        allNodeTypes.forEach((t: any) => {
            types[t.id] = CustomNode
        })
        return types
    }, [allNodeTypes])

    const safeNodes = useMemo(() => {
        return nodes.map(node => {
            // Handle both backend format and ReactFlow format
            const isBackendFormat = node.type !== 'custom' && !node.data?.type

            if (isBackendFormat) {
                // Backend format: { id, type: 'webhook', position, data: {...config} }
                const nodeType = allNodeTypes.find((nt: any) => nt.id === node.type)
                return {
                    id: node.id,
                    type: 'custom',
                    position: node.position || { x: 0, y: 0 },
                    data: {
                        type: node.type,
                        nodeType: node.type,
                        label: nodeType?.label || node.type,
                        config: node.data || {},
                        color: nodeType?.color
                    }
                }
            } else {
                // ReactFlow format: { id, type: 'custom', position, data: { type, label, config } }
                const originalType = node.data?.type || node.data?.nodeType || node.type
                return {
                    ...node,
                    type: 'custom',
                    data: {
                        ...node.data,
                        type: originalType,
                        nodeType: originalType,
                        label: node.data?.label || node.data?.name || originalType
                    }
                }
            }
        })
    }, [nodes, allNodeTypes])

    return (
        <div className="h-[600px] bg-background rounded-lg border border-border overflow-hidden relative shadow-sm group">
            <ReactFlow
                nodes={safeNodes}
                edges={edges}
                nodeTypes={previewNodeTypes}
                fitView
                proOptions={{ hideAttribution: true }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                zoomOnScroll={true}
                panOnScroll={true}
                minZoom={0.1}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                <Controls />
                <MiniMap className="!bg-background/90 !border-border" />
            </ReactFlow>
            <div className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-background/80 backdrop-blur rounded-full text-xs font-medium text-muted-foreground border border-border shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Read Only Preview
            </div>
        </div>
    )
}

function VersionsTab({ flowId, onUpdate }: { flowId: string, onUpdate: () => void }) {
    const [versions, setVersions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadVersions()
    }, [flowId])

    const loadVersions = async () => {
        try {
            setLoading(true)
            const data = await axiosClient.get(`/flows/${flowId}/versions`)
            setVersions(data)
        } catch (e: any) {

            toast.error('Failed to load versions')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateVersion = async () => {
        const createPromise = axiosClient.post(`/flows/${flowId}/versions`, {
            name: `Version ${versions.length + 1}`,
            description: 'Manual version snapshot'
        }).then(() => {
            loadVersions()
            onUpdate()
        })

        toast.promise(createPromise, {
            loading: 'Creating version...',
            success: 'Version created successfully!',
            error: (err) => `Failed to create version: ${err.message}`
        })
    }

    const handleRestore = async (version: number) => {
        toast.error('Version restore coming soon!')
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Version History</h3>
                <Button size="sm" onClick={handleCreateVersion}>
                    <FiClock className="w-4 h-4 mr-2" />
                    Create Version
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading versions...
                </div>
            ) : versions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <FiClock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No versions yet</p>
                    <p className="text-sm mb-4">
                        Create version snapshots to track changes over time
                    </p>
                    <Button onClick={handleCreateVersion}>
                        Create First Version
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {versions.map((v) => (
                        <div
                            key={v.version}
                            className={`p-4 rounded-lg border ${v.is_current
                                ? 'border-primary/40 bg-primary/5'
                                : 'border-border/40 bg-muted/20'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold">Version {v.version}</h4>
                                        {v.is_current && (
                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary text-white">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        {v.description || v.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(v.created_at)}
                                    </p>
                                </div>
                                {!v.is_current && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRestore(v.version)}
                                    >
                                        Restore
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}

function SettingsTab({
    flow,
    onUpdate,
    onArchive,
    onDelete
}: {
    flow: any
    onUpdate: () => void
    onArchive: () => void
    onDelete: () => void
}) {
    const [name, setName] = useState(flow.name)
    const [description, setDescription] = useState(flow.description || '')
    const [status, setStatus] = useState(flow.status)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        const savePromise = (async () => {
            setSaving(true)
            await axiosClient.patch(`/flows/${flow.id}`, {
                name,
                description,
                status
            })
            onUpdate()
        })()

        toast.promise(savePromise, {
            loading: 'Saving settings...',
            success: 'Settings saved successfully!',
            error: (err) => `Failed to save: ${err.message}`
        })

        savePromise.finally(() => setSaving(false))
    }

    const hasChanges = name !== flow.name ||
        description !== (flow.description || '') ||
        status !== flow.status

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Workflow Settings</h3>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2">Workflow Name</label>
                    {/* <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter workflow name"
                    /> */}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Describe what this workflow does"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {hasChanges && (
                    <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <span className="text-sm text-amber-500">You have unsaved changes</span>
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <FiSave className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                )}

                <div className="pt-6 border-t border-border/40 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium mb-1">Archive Workflow</h4>
                            <p className="text-sm text-muted-foreground">
                                Archive this workflow (can be restored later)
                            </p>
                        </div>
                        <Button variant="outline" onClick={onArchive}>
                            Archive
                        </Button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <div>
                            <h4 className="font-medium mb-1 text-red-500">Delete Workflow</h4>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete this workflow and all its data
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            className="text-red-500 hover:bg-red-500/10"
                            onClick={onDelete}
                        >
                            <FiTrash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}

const nodeTypes = {
    custom: CustomNode
}

interface Channel {
    id: number
    name: string
}

// Inner component that uses ReactFlow hooks
function WorkflowDetailPageInner({ params }: { params: { id: string } }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const dispatch = useAppDispatch()
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const { screenToFlowPosition } = useReactFlow()

    // Check if we're in edit mode from URL
    const isEditModeFromUrl = searchParams.get('mode') === 'edit'
    const [isEditMode, setIsEditMode] = useState(isEditModeFromUrl)

    const [activeTab, setActiveTab] = useState<'overview' | 'executions' | 'versions' | 'settings'>('overview')
    const [flow, setFlow] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    // Editor state from Redux
    const editorNodes = useAppSelector((state: any) => state.workflowEditor?.nodes || [])
    const editorEdges = useAppSelector((state: any) => state.workflowEditor?.edges || [])
    const selectedNodeId = useAppSelector((state: any) => state.workflowEditor?.selectedNodeId)
    const workflowName = useAppSelector((state: any) => state.workflowEditor?.workflowName || 'Untitled Workflow')
    const selectedChannelId = useAppSelector((state: any) => state.workflowEditor?.selectedChannelId)
    const hasUnsavedChanges = useAppSelector((state: any) => state.workflowEditor?.hasUnsavedChanges || false)
    const isExecuting = useAppSelector((state: any) => state.workflowEditor?.isExecuting || false)
    const isTesting = useAppSelector((state: any) => state.workflowEditor?.isTesting || false)
    const draftTemplate = useAppSelector((state: any) => state.workflowEditor?.draftTemplate)

    // Editor UI state
    const [showProperties, setShowProperties] = useState(false)
    const [showTestPanel, setShowTestPanel] = useState(false)
    const [showExecuteModal, setShowExecuteModal] = useState(false)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [channels, setChannels] = useState<Channel[]>([])
    const [savedState, setSavedState] = useState<string>('')
    const templateSavedRef = useRef(false)

    const { items: allNodeTypes = [] } = useAppSelector((state: any) => state.nodeTypes || {})

    // Sync edit mode with URL
    useEffect(() => {
        setIsEditMode(isEditModeFromUrl)
    }, [isEditModeFromUrl])

    useEffect(() => {
        if (isEditMode) {
            loadChannels()
        }
    }, [isEditMode])

    useEffect(() => {
        if (params.id === 'new') {
            // Handle new flow creation
            setLoading(false)
            setFlow({ name: 'Untitled Workflow', status: 'draft', nodes: [], edges: [] })

            if (isEditMode) {
                if (draftTemplate && !templateSavedRef.current) {
                    templateSavedRef.current = true
                    const migratedNodes = migrateNodes(draftTemplate.nodes || [])
                    const templateName = draftTemplate.name || 'Untitled Workflow'
                    const templateEdges = draftTemplate.edges || []

                    dispatch(clearDraftTemplate())
                    dispatch(setNodes(migratedNodes))
                    dispatch(setEdges(templateEdges))
                    dispatch(setWorkflowName(templateName))

                    // Auto-save new flow from template
                    const createFlowFromTemplate = async () => {
                        try {
                            setIsSaving(true)

                            // Convert to backend format
                            const backendNodes = migratedNodes.map((node: any) => {
                                const nodeType = node.data?.type || node.data?.nodeType || node.type
                                return {
                                    id: node.id,
                                    type: nodeType === 'custom' ? (node.data?.type || node.data?.nodeType) : nodeType,
                                    position: node.position,
                                    data: node.data?.config || {}
                                }
                            })

                            const flowData = {
                                name: templateName,
                                description: '',
                                channelId: null,
                                nodes: backendNodes,
                                edges: templateEdges
                            }

                            const created: any = await axiosClient.post('/flows/', flowData)

                            if (!created || !created.id) {
                                throw new Error('Failed to create flow: No ID returned')
                            }

                            setFlow(created)
                            router.replace(`/flows/${created.id}?mode=edit`)
                        } catch (error) {
                            console.error('[Flow Create from Template] Error:', error)
                            toast.error('Failed to save template as new flow')
                        } finally {
                            setIsSaving(false)
                        }
                    }

                    createFlowFromTemplate()
                } else {
                    dispatch(setNodes([]))
                    dispatch(setEdges([]))
                    dispatch(setWorkflowName('Untitled Workflow'))
                    dispatch(setSelectedChannelId(null))
                    dispatch(setHasUnsavedChanges(false))
                }
            }
        } else {
            loadFlow()
        }
    }, [params.id])

    // Separate effect to handle edit mode changes
    useEffect(() => {
        if (params.id !== 'new' && flow && isEditMode && !loading) {
            // Load flow data into editor when entering edit mode
            // Use new structure: flow.nodes and flow.edges directly (already at top level from API)
            const nodes = Array.isArray(flow.nodes) ? flow.nodes : []
            const edges = Array.isArray(flow.edges) ? flow.edges : []

            // Convert backend nodes to ReactFlow format
            const reactFlowNodes = nodes.map((node: any) => {
                const nodeTypeInfo = allNodeTypes.find((nt: any) => nt.id === node.type)
                return {
                    id: node.id,
                    type: 'custom', // ReactFlow type
                    position: node.position || { x: 0, y: 0 },
                    data: {
                        type: node.type, // NodeType.id
                        nodeType: node.type, // Backup reference
                        label: nodeTypeInfo?.label || node.type,
                        config: node.data || {}, // User config
                        color: nodeTypeInfo?.color
                    }
                }
            })

            console.log('[Edit Mode] ReactFlow nodes count:', reactFlowNodes.length)
            if (reactFlowNodes.length > 0) {
                console.log('[Edit Mode] Sample ReactFlow node:', reactFlowNodes[0])
            }

            dispatch(loadWorkflow({
                name: flow.name || 'Untitled Workflow',
                description: flow.description || '',
                nodes: reactFlowNodes,
                edges: edges,
                channelId: flow.channel_id || flow.channelId || null
            }))

            const cleanNodes = reactFlowNodes.map((node: any) => {
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
                name: flow.name || 'Untitled Workflow',
                channel_id: flow.channel_id || flow.channelId || null,
                nodes: cleanNodes,
                edges: edges
            })
            setSavedState(initialState)
            dispatch(setHasUnsavedChanges(false))
        }
    }, [isEditMode, flow, loading, allNodeTypes])

    const loadChannels = async () => {
        try {
            const channels: any = await axiosClient.get('/channels/')
            setChannels(channels)
        } catch (e: any) {
            // Silent fail
        }
    }

    const migrateNodes = (nodes: Node[]) => {
        return nodes.map(node => {
            const originalType = node.data?.type || node.type
            return {
                ...node,
                type: 'custom',
                data: {
                    ...node.data,
                    type: originalType,
                    nodeType: originalType,
                    label: node.data?.label || node.data?.name || originalType
                }
            }
        })
    }

    const loadFlow = async () => {
        try {
            setLoading(true)
            const flowObject: any = await axiosClient.get(`/flows/${params.id}`)

            console.log('[Load Flow] Raw response:', flowObject)
            console.log('[Load Flow] Has top-level nodes:', Array.isArray(flowObject.nodes))
            console.log('[Load Flow] Has top-level edges:', Array.isArray(flowObject.edges))
            console.log('[Load Flow] Nodes count:', flowObject.nodes?.length || 0)
            console.log('[Load Flow] Edges count:', flowObject.edges?.length || 0)

            // Backend returns both formats for compatibility:
            // - nodes/edges at top level (new, preferred)
            // - data.nodes/edges (legacy, for backward compatibility)
            // We use top-level directly

            if (!Array.isArray(flowObject.nodes)) {
                flowObject.nodes = []
                console.warn('[Load Flow] No nodes array, initialized empty')
            }

            if (!Array.isArray(flowObject.edges)) {
                flowObject.edges = []
                console.warn('[Load Flow] No edges array, initialized empty')
            }

            setFlow(flowObject)
        } catch (e: any) {
            console.error('[Load Flow] Error:', e)
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    // Editor handlers
    const handleNodesChange = useCallback((changes: any) => {
        let updatedNodes = [...editorNodes]
        let shouldMarkDirty = false

        changes.forEach((change: any) => {
            if (change.type === 'position') {
                updatedNodes = updatedNodes.map(n =>
                    n.id === change.id
                        ? { ...n, position: change.position || n.position }
                        : n
                )
                if (change.dragging === false) {
                    shouldMarkDirty = true
                }
            } else if (change.type === 'dimensions') {
                updatedNodes = updatedNodes.map(n =>
                    n.id === change.id
                        ? { ...n, width: change.dimensions?.width, height: change.dimensions?.height }
                        : n
                )
            } else if (change.type === 'select') {
                updatedNodes = updatedNodes.map(n =>
                    n.id === change.id
                        ? { ...n, selected: change.selected }
                        : n
                )
            } else if (change.type === 'remove') {
                updatedNodes = updatedNodes.filter(n => n.id !== change.id)
                shouldMarkDirty = true
            }
        })

        if (shouldMarkDirty) {
            dispatch(setNodes(updatedNodes))
        } else {
            dispatch(updateNodesWithoutDirty(updatedNodes))
        }
    }, [editorNodes, dispatch])

    const handleEdgesChange = useCallback((changes: any) => {
        let updatedEdges = [...editorEdges]
        let shouldMarkDirty = false

        changes.forEach((change: any) => {
            if (change.type === 'remove') {
                updatedEdges = updatedEdges.filter(e => e.id !== change.id)
                shouldMarkDirty = true
            } else if (change.type === 'select') {
                updatedEdges = updatedEdges.map(e =>
                    e.id === change.id
                        ? { ...e, selected: change.selected }
                        : e
                )
            }
        })

        if (shouldMarkDirty) {
            dispatch(setEdges(updatedEdges))
        } else {
            dispatch(updateEdgesWithoutDirty(updatedEdges))
        }
    }, [editorEdges, dispatch])

    const { execute: executeWithWebSocket, isExecuting: isWebSocketExecuting } = useExecutionWebSocket(
        (updater: any) => {
            const newNodes = typeof updater === 'function' ? updater(editorNodes) : updater
            dispatch(updateNodesWithoutDirty(newNodes))
        }
    )

    const selectedNode = useMemo(() =>
        editorNodes.find((n: Node) => n.id === selectedNodeId) || null
        , [editorNodes, selectedNodeId])

    const onConnect = useCallback(
        (params: Edge | Connection) => {
            const newEdge = addEdge(params, editorEdges)
            dispatch(setEdges(newEdge))
        },
        [editorEdges, dispatch]
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
                    nodeType: nodeType.id,
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
                nodeType: nodeType.id,
                config: {}
            }
        }

        dispatch(addNodeAction(newNode))
    }, [dispatch])

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        if (node.data?.executionStatus) {
            const cleanNode = {
                ...node,
                data: {
                    ...node.data,
                    executionStatus: undefined,
                    executionError: undefined
                }
            }
            const cleanNodes = editorNodes.map((n: Node) => n.id === node.id ? cleanNode : n)
            dispatch(updateNodesWithoutDirty(cleanNodes))
        }

        dispatch(setSelectedNodeId(node.id))
        setShowProperties(true)
        setShowTestPanel(false)
    }, [editorNodes, dispatch])

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
        const nodeToDuplicate = editorNodes.find((n: Node) => n.id === contextMenu?.nodeId)
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
        }
    }, [editorNodes, contextMenu, dispatch])

    const handleContextMenuDelete = useCallback(() => {
        if (contextMenu?.nodeId) {
            const newNodes = editorNodes.filter((n: Node) => n.id !== contextMenu.nodeId)
            const newEdges = editorEdges.filter((e: Edge) => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId)

            dispatch(setNodes(newNodes))
            dispatch(setEdges(newEdges))
            setShowProperties(false)
            setShowTestPanel(false)
            dispatch(setSelectedNodeId(null))
        }
    }, [contextMenu, editorNodes, editorEdges, dispatch])

    const handleNodeUpdate = useCallback((updatedNode: Node) => {
        dispatch(updateNodeAction({ id: updatedNode.id, data: updatedNode.data }))
    }, [dispatch])

    const handleSave = async () => {
        const savePromise = (async () => {
            setIsSaving(true)

            // Convert ReactFlow nodes to backend format
            const backendNodes = editorNodes.map((node: any) => {
                const nodeType = node.data?.type || node.data?.nodeType || node.type
                return {
                    id: node.id,
                    type: nodeType === 'custom' ? (node.data?.type || node.data?.nodeType) : nodeType,
                    position: node.position,
                    data: node.data?.config || {}
                }
            })

            const backendEdges = editorEdges.map((edge: any) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle
            }))

            const flowData = {
                name: workflowName,
                description: flow?.description || '',
                channelId: selectedChannelId,
                nodes: backendNodes,
                edges: backendEdges
            }

            console.log('[Save] Flow data to send:', flowData)

            let result: any
            if (params.id === 'new') {
                // Create new flow
                result = await axiosClient.post('/flows/', flowData)

                if (!result || !result.id) {
                    throw new Error('Failed to create flow: No ID returned')
                }

                console.log('[Save] Created new flow:', result)
                setFlow(result)
                router.replace(`/flows/${result.id}?mode=edit`)
            } else {
                // Update existing flow
                console.log('[Save] Updating flow:', params.id)
                result = await axiosClient.patch(`/flows/${params.id}`, flowData)

                console.log('[Save] Update result:', result)
                setFlow(result)
                // DO NOT redirect on update - stay on same page
            }

            const cleanNodes = editorNodes.map((node: any) => {
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
                edges: editorEdges
            })
            setSavedState(newState)
            dispatch(setHasUnsavedChanges(false))

            return result
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

    const handleTestRun = async () => {
        if (editorNodes.length === 0) {
            toast.error('Add some nodes first!')
            return
        }

        if (hasUnsavedChanges) {
            toast.error('Please save your changes before testing')
            return
        }

        if (editorNodes.length > 1 && editorEdges.length === 0) {
            toast.error('Please connect your nodes before testing')
            return
        }

        dispatch(setIsTesting(true))
        try {
            await executeWithWebSocket(params.id, {})
            toast.success('Test run completed!')
        } catch (error: any) {
            toast.error(`Test run failed: ${error.message}`)
        } finally {
            dispatch(setIsTesting(false))
        }
    }

    const handleExecute = () => {
        if (editorNodes.length === 0) {
            toast.error('Add some nodes first!')
            return
        }

        if (hasUnsavedChanges) {
            toast.error('Please save your changes before executing')
            return
        }

        if (editorNodes.length > 1 && editorEdges.length === 0) {
            toast.error('Please connect your nodes before executing')
            return
        }

        setShowExecuteModal(true)
    }

    const handleExecuteWithData = async (inputData: Record<string, any>) => {
        dispatch(setIsExecuting(true))
        setShowExecuteModal(false)

        try {
            await executeWithWebSocket(params.id, inputData)
            toast.success('Workflow executed successfully!')
        } catch (error: any) {
            toast.error(`Execution failed: ${error.message}`)
        } finally {
            dispatch(setIsExecuting(false))
        }
    }

    const toggleEditMode = () => {
        if (isEditMode && hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to exit edit mode?')) {
                return
            }
        }
        const newMode = !isEditMode
        setIsEditMode(newMode)
        router.push(`/flows/${params.id}${newMode ? '?mode=edit' : ''}`)
    }

    const handleDuplicate = async () => {
        const duplicatePromise = axiosClient.post(`/flows/${params.id}/duplicate`)
            .then((dup: any) => {
                router.push(`/flows/${dup.id}?mode=edit`)
                return dup
            })

        toast.promise(duplicatePromise, {
            loading: 'Duplicating workflow...',
            success: 'Workflow duplicated successfully!',
            error: (err) => `Failed to duplicate: ${err.message}`,
        })
    }

    const handleDelete = () => {
        setShowDeleteDialog(true)
    }

    const confirmDelete = async () => {
        const deletePromise = axiosClient.delete(`/flows/${params.id}`)
            .then(() => {
                router.push('/flows')
            })

        toast.promise(deletePromise, {
            loading: 'Deleting workflow...',
            success: 'Workflow deleted successfully!',
            error: (err) => `Failed to delete: ${err.message}`,
        })
    }

    const handleArchive = async () => {
        const archivePromise = axiosClient.post(`/flows/${params.id}/archive`)
            .then(() => {
                router.push('/flows')
            })

        toast.promise(archivePromise, {
            loading: 'Archiving workflow...',
            success: 'Workflow archived successfully!',
            error: (err) => `Failed to archive: ${err.message}`,
        })
    }

    const handleExport = () => {
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flow, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `${flow.name.replace(/\s+/g, '_')}_workflow.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            toast.success('Workflow exported!')
        } catch (e: any) {
            toast.error('Failed to export: ' + e.message)
        }
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Workflow link copied to clipboard!')
    }

    const [recentExecutions, setRecentExecutions] = useState<any[]>([])
    const [executionsLoading, setExecutionsLoading] = useState(false)
    const [stats, setStats] = useState({
        totalExecutions: 0,
        successRate: 0,
        avgDuration: 0
    })

    useEffect(() => {
        if (flow) {
            loadRecentExecutions()
            loadStats()
        }
    }, [flow])

    const loadRecentExecutions = async () => {
        try {
            setExecutionsLoading(true)
            const data = await (await axiosClient.get(`/executions/?flow_id=${params.id}&limit=5`))
            setRecentExecutions(data)
        } catch (e: any) {

        } finally {
            setExecutionsLoading(false)
        }
    }

    const loadStats = async () => {
        try {
            const allExecutions = await axiosClient.get(`/executions/?flow_id=${params.id}&limit=100`)

            const totalExecutions = allExecutions.length
            const completedExecutions = allExecutions.filter((e: any) => e.status === 'completed')
            const successRate = totalExecutions > 0
                ? (completedExecutions.length / totalExecutions) * 100
                : 0

            const durations = allExecutions
                .filter((e: any) => e.duration_ms)
                .map((e: any) => e.duration_ms)
            const avgDuration = durations.length > 0
                ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
                : 0

            setStats({
                totalExecutions,
                successRate,
                avgDuration
            })
        } catch (e: any) {

        }
    }

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
        return `${(ms / 60000).toFixed(1)}m`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="text-muted-foreground">Loading workflow...</div>
            </div>
        )
    }

    if (error || !flow) {
        return (
            <div className="p-8">
                <Card className="p-6 text-center">
                    <p className="text-red-500 mb-4">{error || 'Flow not found'}</p>
                    <Link href="/flows">
                        <Button>Back to Flows</Button>
                    </Link>
                </Card>
            </div>
        )
    }

    // Render edit mode
    if (isEditMode) {
        return (
            <div className="h-screen flex flex-col">
                {/* Editor Header */}
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
                    </div>

                    <div className="flex items-center gap-2">
                        {hasUnsavedChanges && (
                            <span className="text-sm text-amber-500 flex items-center gap-1">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                Unsaved changes
                            </span>
                        )}

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

                        <Button
                            onClick={handleExecute}
                            disabled={isExecuting}
                            title="Execute with input data"
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
                    </div>
                </div>

                {/* Editor Canvas */}
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 relative" ref={reactFlowWrapper}>
                        <ReactFlow
                            nodes={editorNodes}
                            edges={editorEdges}
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
                                    canTest={true}
                                />
                            )}
                        </ReactFlow>
                    </div>

                    {/* Properties Panel */}
                    {showProperties && selectedNode && !showTestPanel && (
                        <div className="w-80 border-l border-border/40 bg-background flex flex-col h-full z-10">
                            <div className="p-4 border-b border-border/40 flex items-center justify-between">
                                <h3 className="font-semibold">Node Properties</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowProperties(false)}
                                >
                                    <FiX className="w-4 h-4" />
                                </Button>
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

                {/* Execute Modal */}
                <ExecuteFlowModal
                    isOpen={showExecuteModal}
                    onClose={() => setShowExecuteModal(false)}
                    onExecute={handleExecuteWithData}
                    nodes={editorNodes}
                    isExecuting={isExecuting}
                />
            </div>
        )
    }

    return (
        <div className="h-full">
            {/* View Header */}
            <div className="page-header">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">{flow.name}</h1>
                        <p className="text-muted-foreground">{flow.description || 'No description'}</p>
                    </div>

                    {/* Status Badge */}
                    <div>
                        {flow.status === 'published' ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                <FiCheckCircle className="w-4 h-4 mr-2" />
                                Published
                            </span>
                        ) : flow.status === 'archived' ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                Archived
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground border border-border">
                                Draft
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button onClick={toggleEditMode}>
                        <FiEdit className="w-4 h-4 mr-2" />
                        Edit Workflow
                    </Button>
                    <Button variant="outline" onClick={handleDuplicate}>
                        <FiCopy className="w-4 h-4 mr-2" />
                        Duplicate
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <FiDownload className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline" onClick={handleShare}>
                        <FiShare2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Button variant="ghost" onClick={handleDelete}>
                        <FiTrash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            { }
            <div className="content-section">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FiActivity className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats.totalExecutions}</h3>
                        <p className="text-sm text-muted-foreground">Total Executions</p>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FiCheckCircle className="w-8 h-8 text-slate-400" />
                            {stats.successRate > 0 && (
                                <span className={`text-sm font-medium ${stats.successRate >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                                    {stats.successRate.toFixed(0)}%
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats.successRate.toFixed(0)}%</h3>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FiClock className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-1">
                            {stats.avgDuration > 0 ? formatDuration(stats.avgDuration) : '0s'}
                        </h3>
                        <p className="text-sm text-muted-foreground">Avg Duration</p>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FiActivity className="w-8 h-8 text-stone-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-1">v{flow.version || 1}</h3>
                        <p className="text-sm text-muted-foreground">Current Version</p>
                    </Card>
                </div>
            </div>

            { }
            <div className="content-section">
                <Card className="flex items-center gap-1 p-1 w-fit">
                    {(['overview', 'executions', 'versions', 'settings'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab
                                ? 'bg-primary text-white'
                                : 'text-muted-foreground hover:bg-accent'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </Card>
            </div>

            { }
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    { }
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Workflow Diagram</h3>
                        {flow.nodes && flow.nodes.length > 0 ? (
                            <FlowPreview nodes={flow.nodes} edges={flow.edges || []} allNodeTypes={allNodeTypes} />
                        ) : (
                            <div className="h-96 bg-muted/20 rounded-lg flex items-center justify-center border border-border/40">
                                <p className="text-muted-foreground">No diagram data available</p>
                            </div>
                        )}
                    </Card>

                    { }
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Recent Executions</h3>
                            <button onClick={() => setActiveTab('executions')}>
                                <Button size="sm" variant="ghost">
                                    View All
                                </Button>
                            </button>
                        </div>
                        {executionsLoading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Loading executions...
                            </div>
                        ) : recentExecutions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FiActivity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No executions yet</p>
                                <p className="text-sm mt-1">Run this workflow to see execution history</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentExecutions.map((execution) => (
                                    <Link
                                        key={execution.id}
                                        href={`/flows/${flow.id}/executions/${execution.id}`}
                                        className="block p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {execution.status === 'completed' ? (
                                                    <FiCheckCircle className="w-5 h-5 text-green-500" />
                                                ) : execution.status === 'failed' ? (
                                                    <FiActivity className="w-5 h-5 text-red-500" />
                                                ) : (
                                                    <FiClock className="w-5 h-5 text-yellow-500" />
                                                )}
                                                <div>
                                                    <p className="font-medium">{getExecutionReference(flow.id, execution.id)}</p>
                                                    <p className="text-sm text-muted-foreground capitalize flex items-center gap-1.5">
                                                        <span>{execution.status}</span>
                                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                                        <span>{execution.completed_nodes}/{execution.total_nodes} nodes</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {execution.duration_ms && (
                                                    <p className="text-sm font-medium">{formatDuration(execution.duration_ms)}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(execution.started_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'executions' && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">All Executions</h3>
                        <Button size="sm" onClick={toggleEditMode}>
                            <FiPlay className="w-4 h-4 mr-2" />
                            Run Workflow
                        </Button>
                    </div>

                    {executionsLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Loading executions...
                        </div>
                    ) : recentExecutions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FiActivity className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-2">No executions yet</p>
                            <p className="text-sm mb-4">Run this workflow to see execution history</p>
                            <Button onClick={toggleEditMode}>
                                <FiPlay className="w-4 h-4 mr-2" />
                                Run Workflow
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentExecutions.map((execution) => (
                                <Link
                                    key={execution.id}
                                    href={`/flows/${flow.id}/executions/${execution.id}`}
                                    className="block p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {execution.status === 'completed' ? (
                                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                                    <FiCheckCircle className="w-5 h-5 text-green-500" />
                                                </div>
                                            ) : execution.status === 'failed' ? (
                                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                                    <FiActivity className="w-5 h-5 text-red-500" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                                    <FiClock className="w-5 h-5 text-yellow-500" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium">{getExecutionReference(flow.id, execution.id)}</p>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {execution.status}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {execution.duration_ms && (
                                                <p className="text-sm font-medium">{formatDuration(execution.duration_ms)}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(execution.started_at)}
                                            </p>
                                        </div>
                                    </div>

                                    { }
                                    <div className="mb-2">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                            <span>Progress</span>
                                            <span>{execution.completed_nodes}/{execution.total_nodes} nodes</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${execution.status === 'completed' ? 'bg-green-500' :
                                                    execution.status === 'failed' ? 'bg-red-500' :
                                                        'bg-yellow-500'
                                                    }`}
                                                style={{
                                                    width: `${(execution.completed_nodes / execution.total_nodes) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {execution.error_message && (
                                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-500">
                                            {execution.error_message}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {activeTab === 'versions' && (
                <VersionsTab flowId={flow.id} onUpdate={loadFlow} />
            )}

            {activeTab === 'settings' && (
                <SettingsTab
                    flow={flow}
                    onUpdate={loadFlow}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                />
            )}

            <AlertDialogConfirm
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete this workflow?"
                description="This workflow will be permanently deleted. This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    )
}

// Wrapper component with ReactFlowProvider
export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
    return (
        <ReactFlowProvider>
            <WorkflowDetailPageInner params={params} />
        </ReactFlowProvider>
    )
}
