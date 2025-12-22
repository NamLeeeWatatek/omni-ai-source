'use client'

import * as React from 'react'
import { useState, useCallback, useEffect, useMemo } from 'react'
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
    FiTrash2,
    FiSearch,
    FiZap,
    FiClock
} from 'react-icons/fi'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useAuth } from '@/lib/hooks/useAuth'
import { CanCreate } from '@/components/auth/PermissionGate'
import { WorkspaceService } from '@/lib/services/api.service'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { DataTable, type Column, type SortDirection } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { fetchFlows, updateFlow, deleteFlow, duplicateFlow, archiveFlow, fetchFlowsStats } from '@/lib/store/slices/flowsSlice'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import type { FlowNode, NodeProperty, Flow } from '@/lib/types/flow'
import { WorkflowCard } from '@/components/features/workflow/WorkflowCard'
import { WorkflowRunModal } from '@/components/features/workflow/WorkflowRunModal'
import { WorkflowStats } from '@/components/features/workflow/WorkflowStats'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter } from '@/components/ui/AlertDialog'
import { Badge } from '@/components/ui/Badge'

function FlowDropdownMenu({
    flowId,
    flowName,
    flowStatus,
    onDeleteClick,
    onRefresh
}: {
    flowId: string
    flowName: string
    flowStatus: string
    onDeleteClick: (id: string, name: string) => void
    onRefresh: () => void
}) {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { canUpdate, canDelete, isLoading } = usePermissions()

    if (isLoading) {
        return (
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <FiMoreVertical className="w-4 h-4" />
            </Button>
        )
    }

    const handleEdit = () => {
        router.push(`/flows/${flowId}?mode=edit`)
    }

    const handleDuplicate = async () => {
        try {
            await dispatch(duplicateFlow(flowId)).unwrap()
            toast.success('Workflow duplicated successfully')
            onRefresh()
        } catch (error) {
            toast.error('Failed to duplicate workflow')
        }
    }

    const handleArchiveToggle = async () => {
        try {
            if (flowStatus === 'archived') {
                await dispatch(updateFlow({ id: flowId, data: { status: 'draft' } })).unwrap()
                toast.success('Workflow restored from archive')
            } else {
                await dispatch(archiveFlow(flowId)).unwrap()
                toast.success('Workflow archived successfully')
            }
            onRefresh()
        } catch (error) {
            toast.error('Operation failed')
        }
    }

    const handlePublishToggle = async () => {
        const newStatus = flowStatus === 'published' ? 'draft' : 'published'
        try {
            await dispatch(updateFlow({ id: flowId, data: { status: newStatus } })).unwrap()
            toast.success(`Workflow ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`)
            onRefresh()
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-muted/80 rounded-full"
                    onClick={(e) => e.stopPropagation()}
                >
                    <FiMoreVertical className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1.5">
                {canUpdate('flow') && (
                    <>
                        <DropdownMenuItem onClick={handleEdit} className="gap-2 cursor-pointer">
                            <FiEdit className="w-4 h-4" />
                            <span>Edit Schema</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={handlePublishToggle} className={`gap-2 cursor-pointer ${flowStatus === 'draft' ? 'text-success' : ''}`}>
                            <FiPlay className="w-4 h-4" />
                            <span>{flowStatus === 'published' ? 'Unpublish' : 'Publish'}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={handleDuplicate} className="gap-2 cursor-pointer">
                            <FiCopy className="w-4 h-4" />
                            <span>Duplicate</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={handleArchiveToggle} className="gap-2 cursor-pointer">
                            <FiArchive className="w-4 h-4" />
                            <span>{flowStatus === 'archived' ? 'Restore' : 'Archive'}</span>
                        </DropdownMenuItem>
                    </>
                )}

                {canDelete('flow') && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDeleteClick(flowId, flowName)} className="gap-2 cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground">
                            <FiTrash2 className="w-4 h-4" />
                            <span>Delete</span>
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
    const { user } = useAuth()

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [flowToDelete, setFlowToDelete] = useState<{ id: string; name: string } | null>(null)
    const [runModalOpen, setRunModalOpen] = useState(false)
    const [selectedWorkflow, setSelectedWorkflow] = useState<Flow | null>(null)
    const [workflowInputFields, setWorkflowInputFields] = useState<NodeProperty[]>([])
    const [workspaceId, setWorkspaceId] = useState<string>('')

    // Pagination & Sorting state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(12)
    const [searchValue, setSearchValue] = useState('')
    const [sortColumn, setSortColumn] = useState('updatedAt')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    // Get flows from Redux
    const flowsData = useAppSelector((state) => state.flows)

    // Search debounce
    const [debouncedSearch, setDebouncedSearch] = useState(searchValue)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchValue)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchValue])

    // Fetch workspace on mount
    useEffect(() => {
        const fetchWorkspace = async () => {
            try {
                const workspace = await WorkspaceService.getCurrentWorkspace() as any
                setWorkspaceId(workspace.id)
            } catch (error) {
                console.error('Failed to fetch workspace:', error)
            }
        }
        fetchWorkspace()
    }, [])

    const fetchCurrentFlows = useCallback(() => {
        dispatch(fetchFlowsStats())
        const filters: any = {
            search: debouncedSearch || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
        }

        const params: any = {
            page: currentPage,
            limit: pageSize,
            filters: JSON.stringify(filters)
        }

        if (sortColumn && sortDirection) {
            params.sort = JSON.stringify([{
                orderBy: sortColumn,
                order: sortDirection.toUpperCase()
            }])
        }

        dispatch(fetchFlows(params))
    }, [currentPage, pageSize, debouncedSearch, statusFilter, sortColumn, sortDirection, dispatch])

    useEffect(() => {
        fetchCurrentFlows()
    }, [fetchCurrentFlows])

    const flows = (flowsData.items || []) as Flow[]
    const loading = flowsData.loading
    const error = flowsData.error

    const handleRunClick = async (workflowId: string) => {
        try {
            const response = await axiosClient.get(`/flows/${workflowId}`) as any
            const fullWorkflow = response.data?.data || response.data || response // Fallback chain

            // Logic to find inputs in the Start/Manual Trigger node
            const nodes: FlowNode[] = fullWorkflow.nodes || fullWorkflow.data?.nodes || []

            // Look for input configuration in start nodes
            const startNode = nodes.find((n) => n.type === 'start' || n.type === 'trigger-manual')

            // Check if there are any configured inputFields in the start node's data.config
            const inputFields = startNode?.data?.config?.inputFields

            if (inputFields && Array.isArray(inputFields) && inputFields.length > 0) {
                setSelectedWorkflow(fullWorkflow as Flow)
                setWorkflowInputFields(inputFields)
                setRunModalOpen(true)
            } else {
                executeWorkflow(fullWorkflow.id, {})
            }
        } catch (error) {
            toast.error('Failed to load workflow details')
        }
    }

    const executeWorkflow = async (workflowId: string, data: Record<string, unknown>) => {
        const promise = axiosClient.post(`/flows/${workflowId}/execute`, {
            ...data,
            // Add workspace context for backend
            workspaceId: workspaceId || undefined
        })

        toast.promise(promise, {
            loading: 'Starting workflow...',
            success: 'Workflow started successfully!',
            error: (err: any) => `Failed to start: ${err.response?.data?.message || err.message}`
        })
    }

    const handleDeleteClick = (id: string, name: string) => {
        setFlowToDelete({ id, name })
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!flowToDelete) return

        const flowId = flowToDelete.id
        setDeleteDialogOpen(false)
        setFlowToDelete(null)

        try {
            await dispatch(deleteFlow(flowId)).unwrap()
            toast.success('Flow deleted successfully')
            fetchCurrentFlows()
        } catch (error) {
            toast.error('Failed to delete')
        }
    }

    const stats = useMemo(() => {
        const s = flowsData.stats
        return {
            total: s?.total || 0,
            active: s?.published || 0,
            draft: s?.draft || 0,
            successRate: s?.successRate || 100,
            avgDuration: s?.avgDuration || 0
        }
    }, [flowsData.stats])

    const tableColumns: Column<Flow>[] = [
        {
            key: 'name',
            label: 'Workflow Name',
            sortable: true,
            className: "min-w-[250px]",
            render: (value: string, row: Flow) => (
                <Link href={`/flows/${row.id}`} className="flex items-center gap-3 group">
                    <div className={`p-2 rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground`}>
                        <FiZap className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{value}</div>
                        {row.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                {row.description}
                            </div>
                        )}
                    </div>
                </Link>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (value: string) => {
                const getStatusVariant = (status: string) => {
                    switch (status) {
                        case 'published': return 'success'
                        case 'draft': return 'warning'
                        case 'archived': return 'destructive'
                        default: return 'outline'
                    }
                }
                return (
                    <Badge variant={getStatusVariant(value) as any} className="capitalize px-3 py-1 font-medium">
                        {value}
                    </Badge>
                )
            }
        },
        {
            key: 'updatedAt',
            label: 'Last Modified',
            sortable: true,
            render: (value: string) => (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <FiClock className="w-3.5 h-3.5" />
                    <span>{value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</span>
                </div>
            )
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            className: "text-right",
            render: (_: any, row: Flow) => (
                <div className="flex items-center justify-end gap-1.5 px-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-success hover:bg-success/10 rounded-full transition-all"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleRunClick(row.id)
                        }}
                        title="Run Workflow"
                    >
                        <FiPlay className="w-4 h-4 fill-current" />
                    </Button>
                    <FlowDropdownMenu
                        flowId={row.id}
                        flowName={row.name}
                        flowStatus={row.status}
                        onDeleteClick={handleDeleteClick}
                        onRefresh={fetchCurrentFlows}
                    />
                </div>
            )
        }
    ]

    return (
        <div className="page-container space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                        <FiZap className="w-4 h-4" />
                        Automation Engine
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Workflows
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Design, deploy and monitor your intelligent AI agents and automation flows.
                    </p>
                </div>
                <CanCreate resource="flow">
                    <Button
                        size="lg"
                        onClick={() => router.push('/flows/new?mode=edit')}
                        className="shadow-xl bg-stripe-gradient hover:opacity-90 transition-all border-none font-bold px-8 h-12"
                    >
                        <FiPlus className="w-5 h-5 mr-2 stroke-[3]" />
                        New Workflow
                    </Button>
                </CanCreate>
            </div>

            {/* Stats Dashboard */}
            <WorkflowStats stats={stats} />

            {/* Filter & View Controls */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-y border-border/10">
                <div className="flex-1 w-full lg:max-w-md relative group">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                        type="text"
                        placeholder="Search system workflows..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        value={searchValue}
                        onChange={(e) => {
                            setSearchValue(e.target.value)
                            setCurrentPage(1)
                        }}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-muted/50 p-1.5 rounded-xl flex items-center gap-1 border border-border/40 shadow-inner">
                        {(['all', 'published', 'draft', 'archived'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    setStatusFilter(status)
                                    setCurrentPage(1)
                                }}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${statusFilter === status
                                    ? 'bg-background text-primary shadow-sm border border-border/20 translate-y-0'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                                    }`}
                            >
                                <span className="capitalize">{status}</span>
                            </button>
                        ))}
                    </div>

                    <div className="h-10 w-px bg-border/40 mx-1 hidden sm:block" />

                    <div className="bg-muted/50 p-1.5 rounded-xl flex items-center shadow-inner border border-border/40">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
                            title="Grid View"
                        >
                            <FiGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
                            title="List View"
                        >
                            <FiList className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading && flows.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                    {[...Array(pageSize)].map((_, i) => (
                        <div key={i} className="glass rounded-2xl p-6 h-[280px] space-y-4">
                            <div className="flex justify-between">
                                <Skeleton className="w-12 h-12 rounded-xl" />
                                <Skeleton className="w-16 h-6 rounded-full" />
                            </div>
                            <Skeleton className="w-3/4 h-8" />
                            <Skeleton className="w-full h-12" />
                            <div className="pt-4 border-t border-border/20 flex justify-between">
                                <Skeleton className="w-24 h-4" />
                                <Skeleton className="w-20 h-9 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <Card className="p-12 text-center border-destructive/20 bg-destructive/5 glass">
                    <div className="max-w-md mx-auto space-y-6">
                        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                            <FiTrash2 className="w-8 h-8 text-destructive" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-destructive">System Connection Error</h3>
                            <p className="text-muted-foreground">{error}</p>
                        </div>
                        <Button variant="outline" onClick={fetchCurrentFlows} className="border-destructive/30 hover:bg-destructive/10">
                            Re-establish Connection
                        </Button>
                    </div>
                </Card>
            ) : flows.length === 0 ? (
                <div
                    className="p-24 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/10 glass"
                >
                    <div className="max-w-md mx-auto space-y-8">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto group">
                            <FiZap className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold tracking-tight">Zero Workflows Identified</h3>
                            <p className="text-muted-foreground text-lg">
                                {searchValue ? 'Adjust your search parameters to locate specific workflows' : 'Ready to automate? Initialize your first intelligent workflow engine.'}
                            </p>
                        </div>
                        {!searchValue ? (
                            <Button
                                onClick={() => router.push('/flows/new?mode=edit')}
                                size="lg"
                                className="bg-stripe-gradient px-10 h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
                            >
                                <FiPlus className="w-5 h-5 mr-3" />
                                Launch First Engine
                            </Button>
                        ) : (
                            <Button variant="ghost" onClick={() => setSearchValue('')}>Clear Search Filter</Button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-8 pb-12">
                    {viewMode === 'grid' ? (
                        <>
                            <div
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"
                            >
                                {flows.map((flow) => (
                                    <div key={flow.id}>
                                        <WorkflowCard
                                            workflow={{
                                                ...flow,
                                                // Fallback for missing stats in list view
                                                stats: flow.stats || { executions: 0, successRate: 0 }
                                            }}
                                            onUpdate={fetchCurrentFlows}
                                            onRun={() => handleRunClick(flow.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div
                            className="glass rounded-2xl overflow-hidden border border-border/40 shadow-2xl"
                        >
                            <DataTable
                                data={flows}
                                columns={tableColumns}
                                loading={loading}
                                error={error}
                                searchable={false}
                                sortable={true}
                                sortColumn={sortColumn}
                                sortDirection={sortDirection}
                                onSort={(col, dir) => {
                                    setSortColumn(col)
                                    setSortDirection(dir)
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {
                flowsData.total > 0 && (
                    <div className="pt-8 border-t border-border/40 flex items-center justify-between animate-in fade-in duration-500 delay-150">
                        <p className="text-sm text-muted-foreground font-medium">
                            Showing <span className="text-foreground">{Math.min(currentPage * pageSize, flowsData.total || 0)}</span> of <span className="text-foreground">{flowsData.total || 0}</span> system workflows
                        </p>
                        <Pagination
                            pagination={{
                                page: currentPage,
                                limit: pageSize,
                                total: flowsData.total || 0,
                                hasNextPage: flowsData.hasNext || false,
                                totalPages: flowsData.totalPages || 0
                            }}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                        />
                    </div>
                )
            }

            {runModalOpen && (
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
                )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="glass border-destructive/20 sm:max-w-md rounded-2xl">
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-3 text-destructive">
                            <div className="p-2 bg-destructive/10 rounded-lg">
                                <FiTrash2 className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Terminate Workflow?</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Are you absolutely sure you want to terminate <span className="font-bold text-foreground">"{flowToDelete?.name}"</span>?
                            This action is irreversible and will purge all historical execution logs.
                        </p>
                    </div>
                    <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
                        <AlertDialogCancel onClick={() => setFlowToDelete(null)} className="rounded-xl font-semibold">Keep Workflow</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold shadow-lg shadow-destructive/20 border-none px-6">
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
