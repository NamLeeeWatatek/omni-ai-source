import React, { useState, useEffect } from 'react'
import { FiChevronDown, FiChevronRight, FiRefreshCw } from 'react-icons/fi'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { fetchNodeTypes, fetchNodeCategories, type NodeType } from '@/lib/store/slices/nodeTypesSlice'
import { getNodeIcon } from '@/lib/icon-resolver'
import toast from '@/lib/toast'

interface NodePaletteProps {
    onAddNode: (nodeType: NodeType) => void
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
    const dispatch = useAppDispatch()
    const { items: nodeTypes = [], categories = [], loading } = useAppSelector((state: any) => state.nodeTypes || {})
    const [expandedCategories, setExpandedCategories] = useState<string[]>([])
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        dispatch(fetchNodeTypes())
        dispatch(fetchNodeCategories())
    }, [dispatch])

    const getNodesByCategory = (categoryId: string) => {
        return nodeTypes.filter((node: any) => node.category === categoryId)
    }

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        )
    }

    const handleDragStart = (event: React.DragEvent, nodeType: NodeType) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType))
        event.dataTransfer.effectAllowed = 'move'
    }

    const handleAddNode = (nodeType: NodeType) => {
        onAddNode(nodeType)
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        try {
            await dispatch(fetchNodeTypes()).unwrap()
            await dispatch(fetchNodeCategories()).unwrap()
            toast.success('Node types refreshed!')
        } catch (error) {
            toast.error('Failed to refresh node types')
        } finally {
            setRefreshing(false)
        }
    }

    return (
        <div className="w-64 border-r border-border/40 bg-background flex flex-col h-full">
            <div className="p-4 border-b border-border/40 flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Add Node
                </h3>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    className="p-1.5 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
                    title="Reload node types from backend"
                >
                    <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Node Categories */}
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        Loading nodes...
                    </div>
                ) : categories.map((category: any) => {
                    const isExpanded = expandedCategories.includes(category.id)
                    const nodes = getNodesByCategory(category.id)

                    return (
                        <div key={category.id} className="mb-2">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span className="text-sm font-medium">
                                        {category.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        ({nodes.length})
                                    </span>
                                </div>
                                {isExpanded ? (
                                    <FiChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <FiChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                            </button>

                            {/* Nodes List */}
                            {isExpanded && (
                                <div className="mt-1 space-y-1 pl-2">
                                    {nodes.map((nodeType: any) => {
                                        return (
                                            <div
                                                key={nodeType.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, nodeType)}
                                                onClick={() => handleAddNode(nodeType)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent cursor-move transition-all group border border-transparent hover:border-border/40"
                                                title={nodeType.description}
                                            >
                                                <div
                                                    className="p-1.5 rounded flex items-center justify-center"
                                                    style={{
                                                        backgroundColor: nodeType.color ? `${nodeType.color}20` : undefined,
                                                        color: nodeType.color
                                                    }}
                                                >
                                                    {(() => {
                                                        const Icon = getNodeIcon(nodeType)
                                                        return <Icon className="w-4 h-4" />
                                                    })()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">
                                                        {nodeType.label}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {nodeType.description}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer Hint */}
            <div className="p-4 border-t border-border/40 bg-muted/20 flex-shrink-0">
                <p className="text-xs text-muted-foreground text-center">
                    Drag & drop nodes to canvas
                </p>
            </div>
        </div>
    )
}
