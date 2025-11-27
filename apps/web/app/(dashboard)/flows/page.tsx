'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    FiPlus,
    FiGrid,
    FiList,
    FiLoader,
    FiPlay,
    FiMoreVertical,
    FiEdit,
    FiCopy,
    FiArchive,
    FiTrash2
} from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WorkflowCard } from '@/components/features/workflow/workflow-card'
import { SearchBar } from '@/components/features/workflow/search-bar'
import { WorkflowStats } from '@/components/features/workflow/workflow-stats'
import { fetchAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { TemplateSelector } from '@/components/features/templates/template-selector'
import { WorkflowRunModal } from '@/components/features/workflow/workflow-run-modal'

interface Flow {
    id: number
    name: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
    user_id: string
    flow_data: Record<string, unknown>
    status: string
    executions?: number
    successRate?: number
    version?: number
}

interface ApiFlow {
    id: number
    name: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
    user_id: string
    flow_data: Record<string, unknown>
    status?: string
    version?: number
}

interface WorkflowNode {
    type: string
    data?: {
        config?: {
            inputFields?: InputField[]
        }
    }
}

interface InputField {
    id: string
    label: string
    key: string
    type: 'text' | 'number' | 'boolean' | 'file'
    required: boolean
}

interface WorkflowWithNodes extends Flow {
    flow_data: {
        nodes?: WorkflowNode[]
        edges?: unknown[]
    }
}

// Dropdown Menu Component
function FlowDropdownMenu({ flow, onAction }: { flow: Flow; onAction: () => void }) {
    const router = useRouter()

    const handleEdit = () => {
        router.push(`/flows/${flow.id}/edit`)
    }

    const handleDuplicate = async () => {
        const duplicatePromise = fetchAPI(`/flows/${flow.id}/duplicate`, { method: 'POST' })
            .then((dup) => {
                router.push(`/flows/${dup.id}/edit`)
                return dup
            })

        toast.promise(duplicatePromise, {
            loading: 'Duplicating workflow...',
            success: 'Workflow duplicated successfully!',
            error: (err) => `Failed to duplicate: ${err.message}`,
        })
    }

    const handlePublish = async () => {
        const publishPromise = fetchAPI(`/flows/${flow.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'published' })
        }).then(() => {
            onAction()
        })

        toast.promise(publishPromise, {
            loading: 'Publishing workflow...',
            success: 'Workflow published successfully!',
            error: (err) => `Failed to publish: ${err.message}`,
        })
    }

    const handleUnpublish = async () => {
        const unpublishPromise = fetchAPI(`/flows/${flow.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'draft' })
        }).then(() => {
            onAction()
        })

        toast.promise(unpublishPromise, {
            loading: 'Unpublishing workflow...',
            success: 'Workflow unpublished successfully!',
            error: (err) => `Failed to unpublish: ${err.message}`,
        })
    }

    const handleArchive = async () => {
        const archivePromise = fetchAPI(`/flows/${flow.id}/archive`, { method: 'POST' })
            .then(() => {
                onAction()
            })

        toast.promise(archivePromise, {
            loading: 'Archiving workflow...',
            success: 'Workflow archived successfully!',
            error: (err) => `Failed to archive: ${err.message}`,
        })
    }

    const handleUnarchive = async () => {
        const unarchivePromise = fetchAPI(`/flows/${flow.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'draft' })
        }).then(() => {
            onAction()
        })

        toast.promise(unarchivePromise, {
            loading: 'Unarchiving workflow...',
            success: 'Workflow unarchived successfully!',
            error: (err) => `Failed to unarchive: ${err.message}`,
        })
    }

    const handleDelete = async () => {
        // Custom confirmation toast
        toast((t) => (
            <div className="flex flex-col gap-3">
                <div>
                    <p className="font-semibold">Delete &quot;{flow.name}&quot;?</p>
                    <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600"
                        onClick={async () => {
                            toast.dismiss(t.id)
                            const deletePromise = fetchAPI(`/flows/${flow.id}`, { method: 'DELETE' })
                                .then(() => {
                                    onAction()
                                })

                            toast.promise(deletePromise, {
                                loading: 'Deleting workflow...',
                                success: 'Workflow deleted successfully!',
                                error: (err) => `Failed to delete: ${err.message}`,
                            })
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        ), {
            duration: Infinity,
        })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    <FiMoreVertical className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                    <FiEdit className="w-4 h-4 mr-2" />
                    Edit
                </DropdownMenuItem>

                {flow.status === 'draft' && (
                    <DropdownMenuItem onClick={handlePublish} className="text-green-500">
                        <FiPlay className="w-4 h-4 mr-2" />
                        Publish
                    </DropdownMenuItem>
                )}
                {flow.status === 'published' && (
                    <DropdownMenuItem onClick={handleUnpublish}>
                        <FiEdit className="w-4 h-4 mr-2" />
                        Unpublish
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={handleDuplicate}>
                    <FiCopy className="w-4 h-4 mr-2" />
                    Duplicate
                </DropdownMenuItem>

                {flow.status !== 'archived' ? (
                    <DropdownMenuItem onClick={handleArchive}>
                        <FiArchive className="w-4 h-4 mr-2" />
                        Archive
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={handleUnarchive} className="text-green-500">
                        <FiArchive className="w-4 h-4 mr-2" />
                        Unarchive
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <FiTrash2 className="w-4 h-4 mr-2" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function WorkflowsPage() {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
    const [flows, setFlows] = useState<Flow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showTemplateSelector, setShowTemplateSelector] = useState(false)

    // Run Modal State
    const [runModalOpen, setRunModalOpen] = useState(false)
    const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowWithNodes | null>(null)
    const [workflowInputFields, setWorkflowInputFields] = useState<InputField[]>([])

    const loadFlows = useCallback(async () => {
        try {
            setLoading(true)
            const data = await fetchAPI('/flows/')
            const mappedData = (data as ApiFlow[]).map((flow) => ({
                ...flow,
                // Use status from API if available, otherwise derive from is_active
                status: flow.status || (flow.is_active ? 'published' : 'draft'),
                executions: 0,
                successRate: 0,
                version: flow.version || 1
            }))
            setFlows(mappedData)
            setError(null)
        } catch (err: unknown) {
            console.error('Failed to load flows:', err)
            setError('Failed to load workflows. Please check your connection.')
            setFlows([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadFlows()
    }, [loadFlows])

    const handleRunClick = async (workflow: Flow) => {
        try {
            // Fetch full workflow data to get nodes
            const fullWorkflow = await fetchAPI(`/flows/${workflow.id}`) as WorkflowWithNodes

            // Find Start Node
            const nodes = fullWorkflow.flow_data?.nodes || []
            const startNode = nodes.find((n: WorkflowNode) => n.type === 'start' || n.type === 'trigger-manual')

            if (startNode && startNode.data?.config?.inputFields?.length && startNode.data.config.inputFields.length > 0) {
                setSelectedWorkflow(fullWorkflow)
                setWorkflowInputFields(startNode.data.config.inputFields)
                setRunModalOpen(true)
            } else {
                // No inputs needed, just run
                executeWorkflow(fullWorkflow.id, {})
            }
        } catch (error) {
            console.error('Failed to prepare run:', error)
            toast.error('Failed to load workflow details')
        }
    }

    const executeWorkflow = async (workflowId: number, data: Record<string, unknown>) => {
        const promise = fetchAPI('/executions/', {
            method: 'POST',
            body: JSON.stringify({
                flow_id: workflowId,
                input_data: data
            })
        })

        toast.promise(promise, {
            loading: 'Starting workflow...',
            success: 'Workflow started successfully!',
            error: (err) => `Failed to start: ${err.message}`
        })
    }

    const filteredFlows = flows.filter(flow => {
        // Search filter
        const matchesSearch = flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (flow.description && flow.description.toLowerCase().includes(searchQuery.toLowerCase()))

        // Status filter
        const matchesStatus = statusFilter === 'all' || flow.status === statusFilter

        return matchesSearch && matchesStatus
    })

    // Calculate stats
    const stats = {
        total: flows.length,
        active: flows.filter(f => f.status === 'published').length,
        draft: flows.filter(f => f.status === 'draft').length,
        archived: flows.filter(f => f.status === 'archived').length,
        successRate: 0,
        avgDuration: 0
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Workflows</h1>
                    <p className="text-muted-foreground">
                        Manage and monitor your automation workflows
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            console.log('Opening Templates modal')
                            setShowTemplateSelector(true)
                        }}
                    >
                        <FiGrid className="w-4 h-4 mr-2" />
                        Use Template
                    </Button>
                    <Link href="/flows/new/edit">
                        <Button>
                            <FiPlus className="w-4 h-4 mr-2" />
                            Create from Scratch
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <WorkflowStats stats={stats} />

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <SearchBar onSearch={setSearchQuery} />
                </div>
                <div className="flex items-center gap-2">
                    {/* Status Filter */}
                    <div className="glass rounded-lg p-1 flex items-center gap-1">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'all'
                                ? 'bg-primary text-white'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            onClick={() => setStatusFilter('draft')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'draft'
                                ? 'bg-yellow-500 text-white'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Draft ({stats.draft})
                        </button>
                        <button
                            onClick={() => setStatusFilter('published')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'published'
                                ? 'bg-green-500 text-white'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Published ({stats.active})
                        </button>
                        <button
                            onClick={() => setStatusFilter('archived')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'archived'
                                ? 'bg-orange-500 text-white'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Archived ({stats.archived})
                        </button>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="glass p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <FiGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <FiList className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner className="size-8 text-primary" />
                </div>
            ) : error ? (
                <div className="text-center py-20 text-red-500">
                    {error}
                    <Button variant="outline" onClick={loadFlows} className="ml-4">Retry</Button>
                </div>
            ) : filteredFlows.length === 0 ? (
                <Card className="text-center py-20">
                    <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery ? 'Try adjusting your search terms' : 'Create your first workflow to get started'}
                    </p>
                    {!searchQuery && (
                        <Link href="/flows/new/edit">
                            <Button>Create Workflow</Button>
                        </Link>
                    )}
                </Card>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredFlows.map((flow) => (
                                <WorkflowCard
                                    key={flow.id}
                                    workflow={flow}
                                    onUpdate={loadFlows}
                                    onRun={handleRunClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Last Run</th>
                                        <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFlows.map((flow) => (
                                        <tr key={flow.id} className="border-t border-border/40 hover:bg-muted/20">
                                            <td className="p-4">
                                                <Link href={`/flows/${flow.id}`} className="block">
                                                    <div className="font-medium">{flow.name}</div>
                                                    <div className="text-sm text-muted-foreground">{flow.description}</div>
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={
                                                    flow.status === 'published' ? 'success' :
                                                        flow.status === 'archived' ? 'warning' : 'default'
                                                } className="capitalize">
                                                    {flow.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {flow.updated_at ? new Date(flow.updated_at).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleRunClick(flow)}
                                                    >
                                                        <FiPlay className="w-4 h-4" />
                                                    </Button>
                                                    <FlowDropdownMenu flow={flow} onAction={loadFlows} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    )}
                </>
            )}

            {/* Template Selector */}
            {showTemplateSelector && (
                <TemplateSelector
                    onSelect={async (templateData) => {
                        console.log('Template selected:', templateData)

                        // Close modal
                        setShowTemplateSelector(false)

                        // Create flow directly from template
                        const createPromise = (async () => {
                            const flowData = {
                                name: templateData.name,
                                description: templateData.description,
                                template_id: templateData.id,
                                status: 'draft',
                                data: {
                                    nodes: templateData.nodes || [],
                                    edges: templateData.edges || []
                                }
                            }

                            const created = await fetchAPI('/flows/', {
                                method: 'POST',
                                body: JSON.stringify(flowData)
                            })

                            // Reload flows list
                            await loadFlows()

                            // Navigate to edit the new flow
                            router.push(`/flows/${created.id}/edit`)

                            return created
                        })()

                        toast.promise(createPromise, {
                            loading: 'Creating workflow from template...',
                            success: 'Workflow created! Opening editor...',
                            error: (err) => `Failed to create: ${err.message}`
                        })
                    }}
                    onClose={() => setShowTemplateSelector(false)}
                />
            )}

            {/* Run Modal */}
            <WorkflowRunModal
                isOpen={runModalOpen}
                onClose={() => setRunModalOpen(false)}
                onSubmit={(data) => {
                    setRunModalOpen(false)
                    if (selectedWorkflow) {
                        executeWorkflow(selectedWorkflow.id, data)
                    }
                }}
                inputFields={workflowInputFields}
                workflowName={selectedWorkflow?.name || ''}
            />
        </div>
    )
}
