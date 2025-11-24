'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@wataomi/ui'
import {
    FiArrowLeft,
    FiSave,
    FiPlay,
    FiCornerUpLeft,
    FiCornerUpRight,
    FiZoomIn,
    FiZoomOut,
    FiMaximize,
    FiPlus
} from 'react-icons/fi'
import { MdAutoAwesome } from 'react-icons/md'
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    BackgroundVariant,
    type Connection,
    type Edge,
    type Node
} from 'reactflow'
import 'reactflow/dist/style.css'
import { fetchAPI } from '@/lib/api'

// Import custom nodes (we'll use the existing ones from flow-builder)
const nodeTypes = {
    // We can add custom node types here
}

export default function WorkflowEditorPage({ params }: { params: { id: string } }) {
    const [isSaving, setIsSaving] = useState(false)
    const [showNodePalette, setShowNodePalette] = useState(true)
    const [showProperties, setShowProperties] = useState(false)
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)
    const [workflowName, setWorkflowName] = useState('New Workflow')
    const [workflowVersion, setWorkflowVersion] = useState(1)

    // Initial nodes and edges
    const initialNodes = [
        {
            id: '1',
            type: 'input',
            data: { label: 'Start' },
            position: { x: 250, y: 50 },
            style: {
                background: '#8B5CF6',
                color: 'white',
                border: '2px solid #7C3AED',
                borderRadius: '8px',
                padding: '10px'
            }
        }
    ]

    const initialEdges: Edge[] = []

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    )

    const loadFlow = useCallback(async (id: string) => {
        try {
            const data = await fetchAPI(`/flows/${id}`)
            if (data) {
                setWorkflowName(data.name)
                setWorkflowVersion(data.version)
                if (data.data) {
                    setNodes(data.data.nodes || [])
                    setEdges(data.data.edges || [])
                }
            }
        } catch (error) {
            console.error('Failed to load flow', error)
            // alert('Failed to load flow')
        }
    }, [setNodes, setEdges])

    useEffect(() => {
        if (params.id !== 'new') {
            loadFlow(params.id)
        }
    }, [params.id, loadFlow])

    const nodeCategories = [
        {
            name: 'Triggers',
            nodes: [
                { type: 'start', label: 'Start', icon: '▶️', color: '#8B5CF6' },
                { type: 'webhook', label: 'Webhook', icon: '🔗', color: '#8B5CF6' },
                { type: 'schedule', label: 'Schedule', icon: '⏰', color: '#8B5CF6' }
            ]
        },
        {
            name: 'Messages',
            nodes: [
                { type: 'message', label: 'Send Message', icon: '💬', color: '#3B82F6' },
                { type: 'receive', label: 'Receive Message', icon: '📨', color: '#3B82F6' },
                { type: 'template', label: 'Message Template', icon: '📝', color: '#3B82F6' }
            ]
        },
        {
            name: 'AI & Logic',
            nodes: [
                { type: 'ai-reply', label: 'AI Reply', icon: '🤖', color: '#06B6D4' },
                { type: 'condition', label: 'Condition', icon: '🔀', color: '#F59E0B' },
                { type: 'function', label: 'Function', icon: '⚡', color: '#06B6D4' }
            ]
        },
        {
            name: 'Actions',
            nodes: [
                { type: 'n8n-trigger', label: 'n8n Workflow', icon: '🔄', color: '#EC4899' },
                { type: 'api-call', label: 'API Call', icon: '🌐', color: '#EC4899' },
                { type: 'database', label: 'Database', icon: '💾', color: '#EC4899' }
            ]
        },
        {
            name: 'Human',
            nodes: [
                { type: 'human-handover', label: 'Human Handover', icon: '👤', color: '#10B981' },
                { type: 'approval', label: 'Approval', icon: '✅', color: '#10B981' }
            ]
        }
    ]

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const flowData = {
                nodes,
                edges,
            }

            if (params.id === 'new') {
                // Create new
                await fetchAPI('/flows/', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: workflowName,
                        description: 'Created via Editor',
                        data: flowData
                    })
                })
            } else {
                // Update existing
                await fetchAPI(`/flows/${params.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: workflowName,
                        data: flowData
                    })
                })
            }
            // alert('Flow saved successfully')
        } catch (error) {
            console.error(error)
            alert('Failed to save flow')
        } finally {
            setIsSaving(false)
        }
    }

    const handleTest = async () => {
        if (params.id === 'new') {
            alert('Please save the flow first')
            return
        }
        try {
            await fetchAPI(`/flows/${params.id}/execute`, {
                method: 'POST',
                body: JSON.stringify({ input: {} })
            })
            alert('Execution started! Check Executions tab.')
        } catch (error) {
            console.error(error)
            alert('Failed to start execution')
        }
    }

    const handleAISuggest = () => {
        alert('AI Suggest - would suggest next nodes based on current flow')
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Top Toolbar */}
            <div className="h-16 border-b border-border/40 flex items-center justify-between px-6 glass">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/flows/${params.id === 'new' ? '' : params.id}`}
                        className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                    <div className="h-6 w-px bg-border" />
                    <div>
                        <input
                            type="text"
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                            className="font-semibold bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                        />
                        <p className="text-xs text-muted-foreground">v{workflowVersion}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                        <FiCornerUpLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <FiCornerUpRight className="w-4 h-4" />
                    </Button>
                    <div className="h-6 w-px bg-border mx-2" />
                    <Button variant="ghost" size="sm">
                        <FiZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <FiZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <FiMaximize className="w-4 h-4" />
                    </Button>
                    <div className="h-6 w-px bg-border mx-2" />
                    <Button variant="outline" size="sm" onClick={handleAISuggest}>
                        <MdAutoAwesome className="w-4 h-4 mr-2" />
                        AI Suggest
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleTest}>
                        <FiPlay className="w-4 h-4 mr-2" />
                        Test
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        <FiSave className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Node Palette */}
                {showNodePalette && (
                    <div className="w-64 border-r border-border/40 glass overflow-y-auto">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold">Add Node</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowNodePalette(false)}
                                >
                                    ✕
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {nodeCategories.map((category) => (
                                    <div key={category.name}>
                                        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                                            {category.name}
                                        </h3>
                                        <div className="space-y-1">
                                            {category.nodes.map((node) => (
                                                <button
                                                    key={node.type}
                                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('application/reactflow', node.type)
                                                        e.dataTransfer.effectAllowed = 'move'
                                                    }}
                                                >
                                                    <span className="text-xl">{node.icon}</span>
                                                    <span className="text-sm font-medium">{node.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Canvas */}
                <div className="flex-1 relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={(event, node) => {
                            setSelectedNode(node)
                            setShowProperties(true)
                        }}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-background"
                    >
                        <Controls className="glass" />
                        <MiniMap
                            className="glass"
                            nodeColor={(node) => {
                                return node.style?.background as string || '#8B5CF6'
                            }}
                        />
                        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                    </ReactFlow>

                    {/* Toggle Node Palette Button */}
                    {!showNodePalette && (
                        <button
                            onClick={() => setShowNodePalette(true)}
                            className="absolute top-4 left-4 glass rounded-lg p-2 hover:bg-accent transition-colors"
                        >
                            <FiPlus className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Properties Panel */}
                {showProperties && selectedNode && (
                    <div className="w-80 border-l border-border/40 glass overflow-y-auto">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold">Node Properties</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowProperties(false)}
                                >
                                    ✕
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Node ID</label>
                                    <input
                                        type="text"
                                        value={selectedNode.id}
                                        disabled
                                        className="w-full glass rounded-lg px-3 py-2 text-sm border border-border/40 bg-muted/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Label</label>
                                    <input
                                        type="text"
                                        value={selectedNode.data.label}
                                        onChange={(e) => {
                                            setNodes((nds) =>
                                                nds.map((node) => {
                                                    if (node.id === selectedNode.id) {
                                                        return {
                                                            ...node,
                                                            data: { ...node.data, label: e.target.value }
                                                        }
                                                    }
                                                    return node
                                                })
                                            )
                                        }}
                                        className="w-full glass rounded-lg px-3 py-2 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Description</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Add a description..."
                                        className="w-full glass rounded-lg px-3 py-2 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                    />
                                </div>

                                <div className="pt-4 border-t border-border/40">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-status-error hover:bg-status-error/10"
                                        onClick={() => {
                                            setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
                                            setShowProperties(false)
                                        }}
                                    >
                                        Delete Node
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
