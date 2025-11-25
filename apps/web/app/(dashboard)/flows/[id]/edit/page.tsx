'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@wataomi/ui'
import toast from 'react-hot-toast'
import {
    FiArrowLeft,
    FiSave,
    FiPlay,
    FiX
} from 'react-icons/fi'
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    BackgroundVariant,
    useReactFlow,
    type Connection,
    type Edge,
    type Node,
    Panel
} from 'reactflow'
import 'reactflow/dist/style.css'
import { fetchAPI } from '@/lib/api'
import { NodePalette } from '@/components/workflow/NodePalette'
import { NodeProperties } from '@/components/workflow/NodeProperties'
import CustomNode from '@/components/workflow/CustomNode'
import { NodeType } from '@/lib/nodeTypes'

const nodeTypes = {
    custom: CustomNode
}

export default function WorkflowEditorPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const { screenToFlowPosition } = useReactFlow()

    const [isSaving, setIsSaving] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)
    const [showProperties, setShowProperties] = useState(false)
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)
    const [workflowName, setWorkflowName] = useState('Untitled Workflow')
    const [flow, setFlow] = useState<any>(null)
    const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null)
    const [channels, setChannels] = useState<any[]>([])
    
    // Track changes for save button
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [savedState, setSavedState] = useState<string>('')
    
    // Execution results
    const [executionResults, setExecutionResults] = useState<Record<string, any> | null>(null)
    const [showExecutionResults, setShowExecutionResults] = useState(false)
    const [lastExecution, setLastExecution] = useState<any>(null)

    const initialNodes: Node[] = []
    const initialEdges: Edge[] = []

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

    // Load channels
    useEffect(() => {
        loadChannels()
    }, [])

    // Load flow data
    useEffect(() => {
        if (params.id !== 'new') {
            loadFlow()
        } else {
            // Check if there's an AI-generated workflow in localStorage
            const aiWorkflow = localStorage.getItem('ai_suggested_workflow')
            if (aiWorkflow) {
                try {
                    const workflow = JSON.parse(aiWorkflow)
                    if (workflow.nodes && workflow.nodes.length > 0) {
                        setNodes(workflow.nodes)
                        setEdges(workflow.edges || [])
                        if (workflow.suggested_name) {
                            setWorkflowName(workflow.suggested_name)
                        }
                        toast.success('AI-generated workflow loaded!')
                    }
                    // Clear localStorage after loading
                    localStorage.removeItem('ai_suggested_workflow')
                } catch (e) {
                    console.error('Failed to load AI workflow:', e)
                }
            }
            
            // Check if there's a template to load
            const templateData = localStorage.getItem('n8n_template_data')
            console.log('Checking for template data:', templateData)
            if (templateData) {
                try {
                    const template = JSON.parse(templateData)
                    console.log('Parsed template:', template)
                    if (template.nodes && template.nodes.length > 0) {
                        console.log('Loading template nodes:', template.nodes.length, 'nodes')
                        console.log('Loading template edges:', template.edges?.length || 0, 'edges')
                        
                        // IMPORTANT: Set nodes and edges immediately
                        // Use functional updates to ensure state is set correctly
                        setNodes(() => template.nodes)
                        setEdges(() => template.edges || [])
                        setWorkflowName(template.name || 'Untitled Workflow')
                        
                        // Mark as having unsaved changes
                        setHasUnsavedChanges(true)
                        
                        toast.success(`Template "${template.name}" loaded with ${template.nodes.length} nodes! Click Save to create workflow.`, {
                            duration: 5000
                        })
                    }
                    // Clear localStorage after loading
                    localStorage.removeItem('n8n_template_data')
                } catch (e) {
                    console.error('Failed to load template:', e)
                    toast.error('Failed to load template')
                }
            }
        }
    }, [params.id])

    const loadChannels = async () => {
        try {
            const data = await fetchAPI('/channels/')
            setChannels(data)
        } catch (e: any) {
            console.error('Failed to load channels:', e)
        }
    }

    const loadFlow = async () => {
        try {
            const data = await fetchAPI(`/flows/${params.id}`)
            setFlow(data)
            setWorkflowName(data.name)
            setSelectedChannelId(data.channel_id || null)

            if (data.data?.nodes) {
                setNodes(data.data.nodes)
            }
            if (data.data?.edges) {
                setEdges(data.data.edges)
            }
            
            // Save initial state
            const initialState = JSON.stringify({
                name: data.name,
                channel_id: data.channel_id,
                nodes: data.data?.nodes || [],
                edges: data.data?.edges || []
            })
            setSavedState(initialState)
            setHasUnsavedChanges(false)
        } catch (e: any) {
            toast.error('Failed to load workflow')
        }
    }
    
    // Track changes to nodes, edges, name, and channel
    useEffect(() => {
        const currentState = JSON.stringify({
            name: workflowName,
            channel_id: selectedChannelId,
            nodes,
            edges
        })
        
        // Only mark as changed if we have a saved state to compare against
        if (savedState) {
            setHasUnsavedChanges(currentState !== savedState)
        }
    }, [nodes, edges, workflowName, selectedChannelId, savedState])

    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
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

            setNodes((nds) => nds.concat(newNode))
        },
        [screenToFlowPosition, setNodes]
    )

    const handleAddNode = (nodeType: NodeType) => {
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

        setNodes((nds) => nds.concat(newNode))
    }

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node)
        setShowProperties(true)
    }, [])

    const handleSave = async () => {
        const savePromise = (async () => {
            setIsSaving(true)
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
                const created = await fetchAPI('/flows/', {
                    method: 'POST',
                    body: JSON.stringify(flowData)
                })
                
                // Update saved state after successful save
                const newState = JSON.stringify({
                    name: workflowName,
                    channel_id: selectedChannelId,
                    nodes,
                    edges
                })
                setSavedState(newState)
                setHasUnsavedChanges(false)
                
                router.push(`/flows/${created.id}/edit`)
                return created
            } else {
                const updated = await fetchAPI(`/flows/${params.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(flowData)
                })
                setFlow(updated)
                
                // Update saved state after successful save
                const newState = JSON.stringify({
                    name: workflowName,
                    channel_id: selectedChannelId,
                    nodes,
                    edges
                })
                setSavedState(newState)
                setHasUnsavedChanges(false)
                
                return updated
            }
        })()

        toast.promise(savePromise, {
            loading: 'Saving workflow...',
            success: 'Workflow saved successfully!',
            error: (err) => `Failed to save: ${err.message}`
        }).finally(() => setIsSaving(false))
    }

    const handleExecute = async () => {
        if (nodes.length === 0) {
            toast.error('Add some nodes first!')
            return
        }

        // Must save first if there are unsaved changes
        if (hasUnsavedChanges) {
            toast.error('Please save the workflow first!')
            return
        }

        const executePromise = (async () => {
            setIsExecuting(true)

            // Get flow ID
            const flowId = params.id === 'new' ? null : parseInt(params.id)
            if (!flowId) {
                throw new Error('Please save the workflow before executing')
            }

            // Call backend API to execute workflow
            const execution = await fetchAPI('/executions/', {
                method: 'POST',
                body: JSON.stringify({
                    flow_id: flowId,
                    input_data: {}
                })
            })
            
            // Convert node_executions to results format
            const results: Record<string, any> = {}
            execution.node_executions.forEach((nodeExec: any) => {
                results[nodeExec.node_id] = {
                    ...nodeExec.output_data,
                    status: nodeExec.status,
                    execution_time_ms: nodeExec.execution_time_ms,
                    error: nodeExec.error_message
                }
            })
            
            // Store results and show panel
            setExecutionResults(results)
            setShowExecutionResults(true)
            setLastExecution(execution)

            return {
                nodesExecuted: execution.completed_nodes,
                totalNodes: execution.total_nodes,
                execution
            }
        })()

        toast.promise(executePromise, {
            loading: 'Executing workflow...',
            success: (result) => `Workflow executed! ${result.nodesExecuted}/${result.totalNodes} nodes completed`,
            error: (err) => `Execution failed: ${err.message}`
        }).finally(() => setIsExecuting(false))
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
                        onChange={(e) => setWorkflowName(e.target.value)}
                        className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 max-w-md"
                        placeholder="Workflow name"
                    />
                    
                    {/* Channel Selector */}
                    <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-muted-foreground">Channel:</span>
                        <select
                            value={selectedChannelId || ''}
                            onChange={(e) => setSelectedChannelId(e.target.value ? Number(e.target.value) : null)}
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
                    <Button
                        variant="outline"
                        onClick={handleExecute}
                        disabled={isExecuting}
                    >
                        <FiPlay className="w-4 h-4 mr-2" />
                        {isExecuting ? 'Executing...' : 'Test Run'}
                    </Button>
                    {hasUnsavedChanges && (
                        <Button onClick={handleSave} disabled={isSaving}>
                            <FiSave className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Node Palette */}
                <NodePalette onAddNode={handleAddNode} />

                {/* Canvas */}
                <div className="flex-1 relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-background"
                    >
                        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
                        <Controls />
                        <MiniMap
                            nodeColor={(node) => {
                                const nodeData = node.data as any
                                return nodeData.type ? '#8B5CF6' : '#64748b'
                            }}
                            className="!bg-background !border-border/40"
                        />

                        <Panel position="top-center" className="!m-0">
                            <div className="glass px-4 py-2 rounded-lg border border-border/40">
                                <p className="text-sm text-muted-foreground">
                                    {nodes.length} nodes • {edges.length} connections
                                </p>
                            </div>
                        </Panel>
                    </ReactFlow>
                </div>

                {/* Execution Results Panel */}
                {showExecutionResults && executionResults && (
                    <div className="w-96 border-l border-border/40 bg-background flex flex-col">
                        <div className="p-4 border-b border-border/40">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold">Execution Results</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowExecutionResults(false)}
                                >
                                    <FiX className="w-4 h-4" />
                                </Button>
                            </div>
                            {lastExecution && (
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <span className={`px-2 py-0.5 rounded ${
                                            lastExecution.status === 'completed' 
                                                ? 'bg-green-500/10 text-green-500'
                                                : lastExecution.status === 'failed'
                                                ? 'bg-red-500/10 text-red-500'
                                                : 'bg-yellow-500/10 text-yellow-500'
                                        }`}>
                                            {lastExecution.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Nodes:</span>
                                        <span>{lastExecution.completed_nodes}/{lastExecution.total_nodes}</span>
                                    </div>
                                    {lastExecution.duration_ms && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Duration:</span>
                                            <span>{lastExecution.duration_ms}ms</span>
                                        </div>
                                    )}
                                    {lastExecution.success_rate !== undefined && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Success Rate:</span>
                                            <span>{lastExecution.success_rate.toFixed(1)}%</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {Object.entries(executionResults).map(([nodeId, result]) => {
                                const node = nodes.find(n => n.id === nodeId)
                                const nodeData = node?.data as any
                                
                                return (
                                    <div key={nodeId} className="glass rounded-lg p-3 border border-border/40">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-sm truncate flex-1">{nodeData?.label || nodeId}</h4>
                                            <div className="flex items-center gap-2">
                                                {result.execution_time_ms && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {result.execution_time_ms}ms
                                                    </span>
                                                )}
                                                {result.error || result.status === 'failed' ? (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500">
                                                        Error
                                                    </span>
                                                ) : (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-500">
                                                        Success
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            {result.error ? (
                                                <div className="text-red-500 bg-red-500/5 p-2 rounded">
                                                    <div className="font-medium mb-1">Error:</div>
                                                    <div className="whitespace-pre-wrap">{result.error}</div>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {Object.entries(result).filter(([key]) => 
                                                        !['status', 'execution_time_ms', 'error'].includes(key)
                                                    ).map(([key, value]) => (
                                                        <div key={key} className="flex gap-2">
                                                            <span className="font-medium text-foreground min-w-[80px]">{key}:</span>
                                                            <span className="flex-1 break-words">
                                                                {typeof value === 'object' 
                                                                    ? JSON.stringify(value, null, 2)
                                                                    : String(value)
                                                                }
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Properties Panel */}
                {showProperties && selectedNode && !showExecutionResults && (
                    <div className="w-80 border-l border-border/40 bg-background flex flex-col">
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
                                onUpdate={(updatedNode) => {
                                    setNodes((nds) =>
                                        nds.map((n) => (n.id === updatedNode.id ? updatedNode : n))
                                    )
                                    setSelectedNode(updatedNode)
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Workflow execution logic
async function executeWorkflow(nodes: Node[], edges: Edge[]) {
    // Find trigger nodes (nodes with no incoming edges)
    const triggerNodes = nodes.filter(node => {
        return !edges.some(edge => edge.target === node.id)
    })

    if (triggerNodes.length === 0) {
        throw new Error('No trigger node found')
    }

    let nodesExecuted = 0
    const executionResults: Record<string, any> = {}

    // Execute nodes in order (simple BFS)
    const queue = [...triggerNodes]
    const visited = new Set<string>()

    while (queue.length > 0) {
        const currentNode = queue.shift()!
        if (visited.has(currentNode.id)) continue

        visited.add(currentNode.id)

        // Execute node
        const result = await executeNode(currentNode, executionResults)
        executionResults[currentNode.id] = result
        nodesExecuted++

        // Find next nodes
        const nextEdges = edges.filter(edge => edge.source === currentNode.id)
        const nextNodes = nextEdges.map(edge => nodes.find(n => n.id === edge.target)!).filter(Boolean)
        queue.push(...nextNodes)
    }

    return { nodesExecuted, results: executionResults }
}

async function executeNode(node: Node, previousResults: Record<string, any>) {
    const nodeData = node.data as any
    const nodeType = nodeData.type
    const config = nodeData.config || {}

    console.log(`Executing node: ${nodeType}`, config)

    // Trigger nodes
    if (nodeType === 'trigger-message') {
        return { 
            triggered: true, 
            message: 'Message received',
            timestamp: new Date().toISOString()
        }
    }

    if (nodeType === 'trigger-schedule') {
        return { 
            triggered: true, 
            schedule: config.schedule || 'manual',
            timestamp: new Date().toISOString()
        }
    }

    if (nodeType === 'trigger-webhook') {
        return { 
            triggered: true, 
            webhook_url: config.webhook_url || 'Not configured',
            timestamp: new Date().toISOString()
        }
    }

    // AI nodes
    if (nodeType === 'ai-suggest') {
        const prompt = config.prompt || 'Generate a helpful response'
        try {
            const response = await fetchAPI('/ai/suggest', {
                method: 'POST',
                body: JSON.stringify({ prompt, context: previousResults })
            })
            return { ...response, executed: true }
        } catch (e: any) {
            return { error: 'AI suggest failed', message: e.message }
        }
    }

    if (nodeType === 'ai-openai') {
        const prompt = config.prompt || 'Hello'
        const model = config.model || 'gpt-4'
        const temperature = config.temperature || 0.7
        const max_tokens = config.max_tokens || 150
        
        try {
            const response = await fetchAPI('/ai/openai', {
                method: 'POST',
                body: JSON.stringify({ 
                    prompt, 
                    context: previousResults,
                    model,
                    temperature,
                    max_tokens
                })
            })
            return { ...response, executed: true }
        } catch (e: any) {
            return { error: 'OpenAI call failed', message: e.message }
        }
    }

    if (nodeType === 'ai-gemini') {
        const prompt = config.prompt || 'Hello'
        const model = config.model || 'gemini-pro'
        
        try {
            const response = await fetchAPI('/ai/gemini', {
                method: 'POST',
                body: JSON.stringify({ 
                    prompt, 
                    context: previousResults,
                    model
                })
            })
            return { ...response, executed: true }
        } catch (e: any) {
            return { error: 'Gemini call failed', message: e.message }
        }
    }

    if (nodeType === 'ai-classify') {
        const categories = config.categories || []
        const text = config.text || previousResults[Object.keys(previousResults)[0]]?.suggestion || 'Sample text'
        
        try {
            const response = await fetchAPI('/ai/classify', {
                method: 'POST',
                body: JSON.stringify({ text, categories })
            })
            return { ...response, executed: true }
        } catch (e: any) {
            return { error: 'Classification failed', message: e.message }
        }
    }

    // Message nodes
    if (nodeType?.startsWith('send-')) {
        const platform = nodeType.replace('send-', '')
        const message = config.message || 'Hello!'
        const channel_id = config.channel_id
        
        if (!channel_id) {
            return { 
                error: 'No channel selected',
                platform,
                message 
            }
        }

        // TODO: Implement actual message sending via channels API
        return {
            sent: true,
            platform,
            channel_id,
            message,
            timestamp: new Date().toISOString()
        }
    }

    // Media nodes
    if (nodeType === 'media-upload-image' || nodeType === 'media-upload-file') {
        const media_url = config.media_url
        const media_file = config.media_file
        
        if (!media_url && !media_file) {
            return { error: 'No media uploaded' }
        }

        return {
            uploaded: true,
            media_url: media_url || media_file?.url,
            filename: media_file?.filename || 'file',
            type: nodeType.includes('image') ? 'image' : 'file'
        }
    }

    if (nodeType === 'media-send-image') {
        const media_url = config.media_url
        const caption = config.caption || ''
        
        if (!media_url) {
            return { error: 'No image to send' }
        }

        return {
            sent: true,
            media_url,
            caption,
            timestamp: new Date().toISOString()
        }
    }

    // Action nodes
    if (nodeType === 'action-http') {
        const url = config.url
        const method = config.method || 'GET'
        const headers = config.headers ? JSON.parse(config.headers) : {}
        const body = config.body ? JSON.parse(config.body) : null
        
        if (!url) {
            return { error: 'No URL configured' }
        }

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                ...(body && { body: JSON.stringify(body) })
            })
            
            const data = await response.json()
            return { 
                executed: true, 
                status: response.status,
                data 
            }
        } catch (e: any) {
            return { error: 'HTTP request failed', message: e.message }
        }
    }

    if (nodeType === 'action-code') {
        const code = config.code
        
        if (!code) {
            return { error: 'No code configured' }
        }

        try {
            // Execute JavaScript code in a safe context
            const func = new Function('input', 'previousResults', code)
            const result = func({}, previousResults)
            return { executed: true, result }
        } catch (e: any) {
            return { error: 'Code execution failed', message: e.message }
        }
    }

    // Logic nodes
    if (nodeType === 'logic-condition') {
        const operator = config.operator || 'equals'
        const value = config.value || ''
        const inputValue = previousResults[Object.keys(previousResults)[0]]?.suggestion || ''
        
        let conditionMet = false
        
        switch (operator) {
            case 'equals':
                conditionMet = inputValue === value
                break
            case 'not_equals':
                conditionMet = inputValue !== value
                break
            case 'contains':
                conditionMet = String(inputValue).includes(value)
                break
            case 'not_contains':
                conditionMet = !String(inputValue).includes(value)
                break
            case 'greater_than':
                conditionMet = Number(inputValue) > Number(value)
                break
            case 'less_than':
                conditionMet = Number(inputValue) < Number(value)
                break
        }
        
        return { 
            executed: true, 
            conditionMet,
            operator,
            inputValue,
            compareValue: value
        }
    }

    // Default
    return { executed: true, nodeType, message: 'Node executed successfully' }
}
