'use client'

import { useCallback } from 'react'
import { FiPlay, FiEdit, FiCopy, FiArchive, FiTrash2, FiClock } from 'react-icons/fi'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useWorkflowsData } from '@/lib/hooks/useWorkflows/useWorkflowsData'
import type { Flow } from '@/lib/types/flow'

interface FlowDropdownMenuProps {
    flowId: string
    flowName: string
    flowStatus: string
    onDeleteClick: (id: string, name: string) => void
}

function FlowDropdownMenu({ flowId, flowName, flowStatus, onDeleteClick }: FlowDropdownMenuProps) {
    const { canUpdate, canDelete, isLoading } = usePermissions()
    const {
        handleEdit,
        handleDuplicate,
        handleArchive,
        handlePublish,
        fetchCurrentFlows
    } = useWorkflowsData()

    if (isLoading) {
        return (
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <FiEdit className="w-4 h-4" />
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-muted/80 rounded-full"
                >
                    <FiEdit className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1.5">
                {canUpdate('flow') && (
                    <>
                        <DropdownMenuItem onClick={() => handleEdit(flowId)} className="gap-2 cursor-pointer">
                            <FiEdit className="w-4 h-4" />
                            <span>Edit Schema</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => handlePublish(flowId, flowStatus)}
                            className={`gap-2 cursor-pointer ${flowStatus === 'draft' ? 'text-success' : ''}`}
                        >
                            <FiPlay className="w-4 h-4" />
                            <span>{flowStatus === 'published' ? 'Unpublish' : 'Publish'}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleDuplicate(flowId)} className="gap-2 cursor-pointer">
                            <FiCopy className="w-4 h-4" />
                            <span>Duplicate</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleArchive(flowId, flowStatus)} className="gap-2 cursor-pointer">
                            <FiArchive className="w-4 h-4" />
                            <span>{flowStatus === 'archived' ? 'Restore' : 'Archive'}</span>
                        </DropdownMenuItem>
                    </>
                )}

                {canDelete('flow') && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDeleteClick(flowId, flowName)}
                            className="gap-2 cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

interface WorkflowsListProps {
    onRunClick: (flowId: string) => void
    onDeleteClick: (id: string, name: string) => void
    className?: string
}

export function WorkflowsList({ onRunClick, onDeleteClick, className }: WorkflowsListProps) {
    const {
        flows,
        loading,
        error,
        pagination,
        sorting,
        updatePagination,
        updateSorting,
        handleRun
    } = useWorkflowsData()

    const handleRunWorkflow = useCallback((flowId: string) => {
        handleRun(flowId, (flow, inputFields) => {
            // This would open the run modal - for now just run directly
            onRunClick(flowId)
        })
    }, [handleRun, onRunClick])

    const tableColumns: Column<Flow>[] = [
        {
            key: 'name',
            label: 'Workflow Name',
            sortable: true,
            className: "min-w-[250px]",
            render: (value: string, row: Flow) => (
                <div className="flex items-center gap-3 group">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <FiPlay className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {value}
                        </div>
                        {row.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                {row.description}
                            </div>
                        )}
                    </div>
                </div>
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
                    <Badge
                        variant={getStatusVariant(value) as any}
                        className="capitalize px-3 py-1 font-medium"
                    >
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
                    <span>
                        {value ? new Date(value).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        }) : '-'}
                    </span>
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
                        onClick={() => handleRunWorkflow(row.id)}
                        title="Run Workflow"
                    >
                        <FiPlay className="w-4 h-4 fill-current" />
                    </Button>
                    <FlowDropdownMenu
                        flowId={row.id}
                        flowName={row.name}
                        flowStatus={row.status}
                        onDeleteClick={onDeleteClick}
                    />
                </div>
            )
        }
    ]

    // Create proper pagination object for DataTable
    const tablePagination = {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total || 0,
        hasNextPage: pagination.hasNextPage || false,
        totalPages: pagination.totalPages || 0
    }

    return (
        <div className={`glass rounded-2xl overflow-hidden border border-border/40 shadow-2xl ${className}`}>
            <DataTable
                data={flows}
                columns={tableColumns}
                loading={loading}
                error={error}
                sortable={true}
                sortColumn={sorting.orderBy}
                sortDirection={sorting.order || undefined}
                onSort={(col, dir) => {
                    updateSorting({ orderBy: col, order: dir })
                }}
                pagination={tablePagination}
                onPageChange={(page) => updatePagination({ page })}
                onPageSizeChange={(pageSize) => updatePagination({ limit: pageSize })}
            />
        </div>
    )
}
