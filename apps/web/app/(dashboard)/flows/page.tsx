'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    FiPlus,
    FiGrid,
    FiList,
    FiPlay,
    FiMoreVertical,
    FiEdit,
    FiCopy,
    FiArchive,
    FiTrash2
} from 'react-icons/fi'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { PermissionGate, CanCreate, CanDelete } from '@/components/auth/PermissionGate'
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { WorkflowCard } from '@/components/features/workflow/workflow-card'
import { FlowsTable } from '@/components/features/workflow/flows-table'
import { SearchBar } from '@/components/features/workflow/search-bar'
import { WorkflowStats } from '@/components/features/workflow/workflow-stats'
import { Pagination } from '@/components/ui/pagination'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { usePagination } from '@/lib/hooks/use-pagination'
import { fetchFlows, createFlow, updateFlow, deleteFlow, duplicateFlow, archiveFlow } from '@/lib/store/slices/flowsSlice'
import { setDraftTemplate } from '@/lib/store/slices/workflowEditorSlice'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import { TemplateSelector } from '@/components/features/templates/template-selector'
import { WorkflowRunModal } from '@/components/features/workflow/workflow-run-modal'
import type { WorkflowNode, InputField } from '@/lib/types'

interface WorkflowWithNodes {
    id: number
    name: string
    flow_data: {
        nodes?: WorkflowNode[]
        edges?: unknown[]
    }
}

function FlowDropdownMenu({
    flowId,
    flowName,
    flowStatus,
    onDeleteClick
}: {
    flowId: number
    flowName: string
    flowStatus: string
    onDeleteClick: (id: number, name: string) => void
}) {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { canUpdate, canDelete, isLoading } = usePermissions()

    if (isLoading) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <FiMoreVertical className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    const handleEdit = () => {
        router.push(`/flows/${flowId}/edit`)
    }

    const handleDuplicate = async () => {
        try {
            const duplicated = await dispatch(duplicateFlow(flowId)).unwrap()
            router.push(`/flows/${duplicated.id}/edit`)
        } catch (error) {
            toast.error('Failed to duplicate')
        }
    }

    const handlePublish = async () => {
        try {
            await dispatch(updateFlow({ id: flowId, data: { status: 'published' } })).unwrap()
        } catch (error) {
            toast.error('Failed to publish')
        }
    }

    const handleUnpublish = async () => {
        try {
            await dispatch(updateFlow({ id: flowId, data: { status: 'draft' } })).unwrap()
        } catch (error) {
            toast.error('Failed to unpublish')
        }
    }

    const handleArchive = async () => {
        try {
            await dispatch(archiveFlow(flowId)).unwrap()
        } catch (error) {
            toast.error('Failed to archive')
        }
    }

    const handleUnarchive = async () => {
        try {
            await dispatch(updateFlow({ id: flowId, data: { status: 'draft' } })).unwrap()
        } catch (error) {
            toast.error('Failed to unarchive')
        }
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
                {canUpdate('flow') && (
                    <>
                        <DropdownMenuItem onClick={handleEdit}>
                            <FiEdit className="w-4 h-4 mr-2" />
                            Edit
                        </DropdownMenuItem>

                        {flowStatus === 'draft' && (
                            <DropdownMenuItem onClick={handlePublish} className="text-success">
                                <FiPlay className="w-4 h-4 mr-2" />
                                Publish
                            </DropdownMenuItem>
                        )}
                        {flowStatus === 'published' && (
                            <DropdownMenuItem onClick={handleUnpublish}>
                                <FiEdit className="w-4 h-4 mr-2" />
                                Unpublish
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={handleDuplicate}>
                            <FiCopy className="w-4 h-4 mr-2" />
                            Duplicate
                        </DropdownMenuItem>

                        {flowStatus !== 'archived' ? (
                            <DropdownMenuItem onClick={handleArchive}>
                                <FiArchive className="w-4 h-4 mr-2" />
                                Archive
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={handleUnarchive} className="text-success">
                                <FiArchive className="w-4 h-4 mr-2" />
                                Unarchive
                            </DropdownMenuItem>
                        )}
                    </>
                )}

                {canDelete('flow') && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDeleteClick(flowId, flowName)} className="text-destructive">
                            <FiTrash2 className="w-4 h-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function WorkflowsPage() {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const {
        items: flows = [],
        loading,
        error,
        total,
        page,
        pageSize,
        totalPages,
        stats: backendStats,
    } = useAppSelector((state: any) => state.flows || {})

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
    const [showTemplateSelector, setShowTemplateSelector] = useState(false)

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [flowToDelete, setFlowToDelete] = useState<{ id: number; name: string } | null>(null)

    const [runModalOpen, setRunModalOpen] = useState(false)
    const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowWithNodes | null>(null)
    const [workflowInputFields, setWorkflowInputFields] = useState<InputField[]>([])

    const pagination = usePagination({
        initialPage: 1,
        initialPageSize: 25,
        onParamsChange: (params) => {
            dispatch(fetchFlows({
                ...params,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            }))
        }
    })

    useEffect(() => {
        dispatch(fetchFlows({
            page: pagination.page,
            page_size: pagination.pageSize,
            search: pagination.search || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
        }))
    }, [dispatch, pagination.page, pagination.pageSize, pagination.search, statusFilter])

    const handleRunClick = async (workflowId: string) => {
        try {
            const fullWorkflow = await axiosClient.get(`/flows/${workflowId}`) as any

            const flowData = fullWorkflow.data || fullWorkflow.flow_data || {}
            const nodes = flowData.nodes || []

            const startNode = nodes.find((n: WorkflowNode) => n.type === 'start' || n.type === 'trigger-manual')

            if (startNode && startNode.data?.config?.inputFields?.length && startNode.data.config.inputFields.length > 0) {
                setSelectedWorkflow({ ...fullWorkflow, flow_data: flowData })
                setWorkflowInputFields(startNode.data.config.inputFields)
                setRunModalOpen(true)
            } else {
                executeWorkflow(fullWorkflow.id, {})
            }
        } catch (error) {

            toast.error('Failed to load workflow details')
        }
    }

    const executeWorkflow = async (workflowId: number, data: Record<string, unknown>) => {
        const promise = axiosClient.post('/executions/', {
            flow_id: workflowId,
            input_data: data
        })

        toast.promise(promise, {
            loading: 'Starting workflow...',
            success: 'Workflow started successfully!',
            error: (err: any) => `Failed to start: ${err.message}`
        })
    }

    const handleDeleteClick = (id: number, name: string) => {
        setFlowToDelete({ id, name })
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!flowToDelete) return

        setDeleteDialogOpen(false)
        const flowId = flowToDelete.id
        setFlowToDelete(null)

        try {
            await dispatch(deleteFlow(flowId)).unwrap()
        } catch (error) {
            toast.error('Failed to delete')
        }
    }

    const displayFlows = Array.isArray(flows) ? flows : []

    const stats = backendStats || {
        total: total || 0,
        active: 0,
        draft: 0,
        archived: 0,
        successRate: 0,
        avgDuration: 0
    }

    return (
        <div className="h-full">
            {}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Workflows</h1>
                    <p className="text-muted-foreground">
                        Manage and monitor your automation workflows
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <CanCreate resource="flow">
                        <Button
                            variant="outline"
                            onClick={() => setShowTemplateSelector(true)}
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
                    </CanCreate>
                </div>
            </div>

            {}
            <WorkflowStats stats={stats} />

            {}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <SearchBar onSearch={pagination.handleSearchChange} />
                </div>
                <div className="flex items-center gap-2">
                    {}
                    <Card className="p-1 flex items-center gap-1">
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
                                ? 'bg-warning text-warning-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Draft ({stats.draft})
                        </button>
                        <button
                            onClick={() => setStatusFilter('published')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'published'
                                ? 'bg-success text-success-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Published ({stats.active})
                        </button>
                        <button
                            onClick={() => setStatusFilter('archived')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'archived'
                                ? 'bg-destructive text-destructive-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Archived ({stats.archived})
                        </button>
                    </Card>

                    {}
                    <Card className="p-1 flex items-center">
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
                    </Card>
                </div >
            </div >

            {}
            {
                loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner className="size-8 text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-destructive">
                        {error}
                        <Button variant="outline" onClick={() => dispatch(fetchFlows())} className="ml-4">Retry</Button>
                    </div>
                ) : displayFlows.length === 0 ? (
                    <Card className="text-center py-20">
                        <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
                        <p className="text-muted-foreground mb-4">
                            {pagination.search ? 'Try adjusting your search terms' : 'Create your first workflow to get started'}
                        </p>
                        {!pagination.search && (
                            <Link href="/flows/new/edit">
                                <Button>Create Workflow</Button>
                            </Link>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayFlows.map((flow: any) => (
                                    <WorkflowCard
                                        key={flow.id}
                                        workflow={flow}
                                        onUpdate={() => dispatch(fetchFlows(pagination.buildParams()))}
                                        onRun={() => handleRunClick(flow.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <FlowsTable
                                flows={displayFlows}
                                onUpdate={() => dispatch(fetchFlows(pagination.buildParams()))}
                                onRun={handleRunClick}
                            />
                        )}

                        {}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={page || pagination.page}
                                totalPages={totalPages || 1}
                                pageSize={pageSize || pagination.pageSize}
                                total={total || 0}
                                onPageChange={pagination.handlePageChange}
                                onPageSizeChange={pagination.handlePageSizeChange}
                            />
                        )}
                    </div>
                )
            }

            {}
            {
                showTemplateSelector && (
                    <TemplateSelector
                        onSelect={async (templateData) => {
                            setShowTemplateSelector(false)

                            dispatch(setDraftTemplate({
                                name: templateData.name,
                                nodes: templateData.nodes || [],
                                edges: templateData.edges || []
                            }))

                            router.push('/flows/new/edit')
                        }}
                        onClose={() => setShowTemplateSelector(false)}
                    />
                )
            }

            {}
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

            {}
            <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
                setDeleteDialogOpen(open)
                if (!open) setFlowToDelete(null)
            }}>
                <AlertDialogContent>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
