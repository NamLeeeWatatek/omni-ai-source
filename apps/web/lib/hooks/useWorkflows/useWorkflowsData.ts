import { useCallback, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import {
    fetchFlows,
    updateFlow,
    deleteFlow,
    duplicateFlow,
    archiveFlow,
    fetchFlowsStats,
    executeFlow
} from '@/lib/store/slices/flowsSlice'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import type { Flow, FlowNode, NodeProperty } from '@/lib/types/flow'

export interface WorkflowsFilters {
    search?: string
    status?: 'all' | 'draft' | 'published' | 'archived'
}

export interface WorkflowsPagination {
    page: number
    limit: number
    total?: number
    hasNextPage?: boolean
    totalPages?: number
}

export interface WorkflowsSorting {
    orderBy: string
    order: 'asc' | 'desc' | null
}

export function useWorkflowsData() {
    const dispatch = useAppDispatch()
    const router = useRouter()

    // Redux state
    const flowsData = useAppSelector((state) => state.flows)

    // Local state for UI
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(12)
    const [searchValue, setSearchValue] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
    const [sortColumn, setSortColumn] = useState('updatedAt')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc')
    const [workspaceId, setWorkspaceId] = useState<string>('')

    // Debounced search
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
                const { WorkspaceService } = await import('@/lib/services/api.service')
                const workspace = await WorkspaceService.getCurrentWorkspace() as any
                setWorkspaceId(workspace.id)
            } catch (error) {
                console.error('Failed to fetch workspace:', error)
            }
        }
        fetchWorkspace()
    }, [])

    // Build filters and params
    const filters = useMemo((): WorkflowsFilters => ({
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
    }), [debouncedSearch, statusFilter])

    const sorting = useMemo((): WorkflowsSorting => ({
        orderBy: sortColumn,
        order: sortDirection,
    }), [sortColumn, sortDirection])

    const pagination = useMemo((): WorkflowsPagination => ({
        page: currentPage,
        limit: pageSize,
        total: flowsData.total,
        hasNextPage: flowsData.hasNext,
        totalPages: flowsData.totalPages,
    }), [currentPage, pageSize, flowsData.total, flowsData.hasNext, flowsData.totalPages])

    // Fetch flows function
    const fetchCurrentFlows = useCallback(() => {
        dispatch(fetchFlowsStats())

        const params: any = {
            page: currentPage,
            limit: pageSize,
            filters: JSON.stringify(filters)
        }

        if (sorting) {
            params.sort = JSON.stringify([sorting])
        }

        dispatch(fetchFlows(params))
    }, [currentPage, pageSize, filters, sorting, dispatch])

    // Auto-fetch when dependencies change
    useEffect(() => {
        fetchCurrentFlows()
    }, [fetchCurrentFlows])

    // Actions
    const updateFilters = useCallback((newFilters: Partial<WorkflowsFilters>) => {
        if (newFilters.search !== undefined) {
            setSearchValue(newFilters.search)
            setCurrentPage(1) // Reset to first page on search
        }
        if (newFilters.status !== undefined) {
            setStatusFilter(newFilters.status)
            setCurrentPage(1) // Reset to first page on filter change
        }
    }, [])

    const updatePagination = useCallback((newPagination: Partial<WorkflowsPagination>) => {
        if (newPagination.page !== undefined) {
            setCurrentPage(newPagination.page)
        }
        if (newPagination.limit !== undefined) {
            setPageSize(newPagination.limit)
            setCurrentPage(1) // Reset to first page on page size change
        }
    }, [])

    const updateSorting = useCallback((newSorting: Partial<WorkflowsSorting>) => {
        if (newSorting.orderBy !== undefined) {
            setSortColumn(newSorting.orderBy)
        }
        if (newSorting.order !== undefined) {
            setSortDirection(newSorting.order)
        }
        setCurrentPage(1) // Reset to first page on sort change
    }, [])

    // Workflow actions
    const handleEdit = useCallback((flowId: string) => {
        router.push(`/flows/${flowId}?mode=edit`)
    }, [router])

    const handleDuplicate = useCallback(async (flowId: string) => {
        try {
            await dispatch(duplicateFlow(flowId)).unwrap()
            toast.success('Workflow duplicated successfully')
            fetchCurrentFlows()
        } catch (error) {
            toast.error('Failed to duplicate workflow')
        }
    }, [dispatch, fetchCurrentFlows])

    const handleArchive = useCallback(async (flowId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'archived' ? 'draft' : 'archived'
            await dispatch(archiveFlow(flowId)).unwrap()
            toast.success(`Workflow ${newStatus === 'archived' ? 'archived' : 'restored'} successfully`)
            fetchCurrentFlows()
        } catch (error) {
            toast.error('Operation failed')
        }
    }, [dispatch, fetchCurrentFlows])

    const handlePublish = useCallback(async (flowId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published'
        try {
            await dispatch(updateFlow({ id: flowId, data: { status: newStatus } })).unwrap()
            toast.success(`Workflow ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`)
            fetchCurrentFlows()
        } catch (error) {
            toast.error('Failed to update status')
        }
    }, [dispatch, fetchCurrentFlows])

    const executeWorkflow = useCallback(async (workflowId: string, data: Record<string, unknown>) => {
        try {
            await dispatch(executeFlow({
                id: workflowId,
                input: {
                    ...data,
                    workspaceId: workspaceId || undefined
                }
            })).unwrap()
            toast.success('Workflow started successfully!')
        } catch (error: any) {
            toast.error(`Failed to start: ${error?.message || 'Unknown error'}`)
        }
    }, [dispatch, workspaceId])

    const handleRun = useCallback(async (
        flowId: string,
        onRunModalOpen: (flow: Flow, inputFields: NodeProperty[]) => void
    ) => {
        try {
            // Get flow details first to check for input fields
            const response = await axiosClient.get(`/flows/${flowId}`) as any
            const fullWorkflow = response.data?.data || response.data || response

            // Logic to find inputs in the Start/Manual Trigger node
            const nodes: FlowNode[] = fullWorkflow.nodes || fullWorkflow.data?.nodes || []

            // Look for input configuration in start nodes
            const startNode = nodes.find((n) => n.type === 'start' || n.type === 'trigger-manual')

            // Check if there are any configured inputFields in the start node's data.config
            const inputFields = startNode?.data?.config?.inputFields

            if (inputFields && Array.isArray(inputFields) && inputFields.length > 0) {
                onRunModalOpen(fullWorkflow as Flow, inputFields)
            } else {
                await executeWorkflow(flowId, {})
            }
        } catch (error) {
            toast.error('Failed to load workflow details')
        }
    }, [executeWorkflow])

    // Computed values
    const flows = flowsData.items as Flow[] || []
    const loading = flowsData.loading
    const error = flowsData.error

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

    return {
        // Data
        flows,
        loading,
        error,
        stats,

        // Filters & pagination & sorting
        filters,
        pagination,
        sorting,

        // Actions
        updateFilters,
        updatePagination,
        updateSorting,
        handleEdit,
        handleDuplicate,
        handleArchive,
        handlePublish,
        handleRun,
        executeWorkflow,
        fetchCurrentFlows,

        // Local state for UI
        searchValue,
        setSearchValue,
        workspaceId,
    }
}
