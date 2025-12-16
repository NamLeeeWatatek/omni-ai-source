'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import toast from '@/lib/toast'
import {
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiEye,
    FiTrash2,
    FiRefreshCw,
    FiActivity
} from 'react-icons/fi'
import axiosClient from '@/lib/axios-client'
import { useSocketConnection } from '@/lib/hooks/use-socket-connection'
import type { Execution } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'
import { Spinner } from '@/components/ui/Spinner'
import { DataTable, Column } from '@/components/ui/Table'

export default function ExecutionsPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [executions, setExecutions] = useState<Execution[]>([])
    const [filteredExecutions, setFilteredExecutions] = useState<Execution[]>([])
    const [loading, setLoading] = useState(true)
    const [flowName, setFlowName] = useState('')
    const [deleteExecutionId, setDeleteExecutionId] = useState<number | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [dateRange, setDateRange] = useState<string>('all')

    const { isConnected, on } = useSocketConnection({
        namespace: 'executions',
        enabled: true,
    })

    useEffect(() => {
        loadExecutions()
        loadFlow()
    }, [params.id])

    // Listen for execution updates
    useEffect(() => {
        if (!isConnected) return

        const unsubscribeUpdate = on('execution:progress', (update) => {
            setExecutions((prev) =>
                prev.map((exec) =>
                    exec.id.toString() === update.executionId
                        ? { ...exec, status: update.status }
                        : exec
                )
            )
        })

        const unsubscribeComplete = on('execution:complete', (update) => {
            loadExecutions()
        })

        const unsubscribeError = on('execution:error', (update) => {
            // Handle execution error
            loadExecutions()
        })

        return () => {
            unsubscribeUpdate()
            unsubscribeComplete()
            unsubscribeError()
        }
    }, [isConnected, on])

    const loadFlow = async () => {
        try {
            const data = await axiosClient.get(`/flows/${params.id}`)
            setFlowName(data.name)
        } catch (e: any) {
            toast.error('Failed to load flow')
        }
    }

    const loadExecutions = async () => {
        try {
            setLoading(true)
            const data = await axiosClient.get(`/executions/?flow_id=${params.id}`)
            setExecutions(data)
        } catch (e: any) {
            toast.error('Failed to load executions')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (executionId: number) => {
        setDeleteExecutionId(executionId)
    }

    const confirmDelete = async () => {
        if (!deleteExecutionId) return

        const deletePromise = axiosClient.delete(`/executions/${deleteExecutionId}`).then(() => loadExecutions())

        toast.promise(deletePromise, {
            loading: 'Deleting execution...',
            success: 'Execution deleted!',
            error: (err) => `Failed: ${err.message}`
        })
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <FiCheckCircle className="w-5 h-5 text-green-500" />
            case 'failed':
                return <FiXCircle className="w-5 h-5 text-red-500" />
            case 'running':
                return <Spinner className="size-5 text-blue-500" />
            default:
                return <FiClock className="w-5 h-5 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'failed':
                return 'bg-red-500/10 text-red-500 border-red-500/20'
            case 'running':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }

    const formatDuration = (ms?: number) => {
        if (!ms) return '-'
        if (ms < 1000) return `${ms}ms`
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
        return `${(ms / 60000).toFixed(1)}m`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Define columns for DataTable
    const columns: Column<Execution>[] = [
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    {getStatusIcon(value)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(value)}`}>
                        {value}
                    </span>
                </div>
            ),
        },
        {
            key: 'startedAt',
            label: 'Started',
            sortable: true,
            render: (value) => <span className="text-sm">{formatDate(value)}</span>,
        },
        {
            key: 'duration',
            label: 'Duration',
            sortable: true,
            render: (value) => <span className="text-sm font-medium">{formatDuration(value)}</span>,
        },
        {
            key: 'progress',
            label: 'Progress',
            sortable: false,
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden min-w-24">
                        <div
                            className="h-full bg-primary transition-all"
                            style={{
                                width: `${((row.completed_nodes ?? 0) /
                                    (row.total_nodes ?? 1)) * 100}%`
                            }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {row.completed_nodes ?? 0}/{row.total_nodes ?? 0}
                    </span>
                </div>
            ),
        },
        {
            key: 'success_rate',
            label: 'Success Rate',
            sortable: true,
            render: (value) => <span className="text-sm font-medium">{value ?? 0}%</span>,
        },
        {
            key: 'actions',
            label: 'Actions',
            sortable: false,
            className: 'text-right',
            render: (_, row) => (
                <div className="flex items-center justify-end gap-2">
                    <Link href={`/flows/${params.id}/executions/${String(row.id)}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <FiEye className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDelete(typeof row.id === 'number' ? row.id : parseInt(String(row.id)))}
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </Button>
                </div>
            ),
        },
    ]

    return (
        <div className="p-8">
            { }
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Executions</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <span>{flowName || 'Loading...'}</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <span>{executions.length} total runs</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={loadExecutions} disabled={loading}>
                            <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Link href={`/flows/${params.id}`}>
                            <Button variant="outline">Back to Flow</Button>
                        </Link>
                    </div>
                </div>
            </div>

            { }
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <FiCheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">
                        {executions.filter(e => e.status === 'completed').length}
                    </h3>
                    <p className="text-sm text-muted-foreground">Completed</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <FiXCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">
                        {executions.filter(e => e.status === 'failed').length}
                    </h3>
                    <p className="text-sm text-muted-foreground">Failed</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <FiClock className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">
                        {executions.filter(e => e.status === 'running').length}
                    </h3>
                    <p className="text-sm text-muted-foreground">Running</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <FiClock className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">
                        {executions.length > 0
                            ? formatDuration(
                                executions.reduce((sum, e) => sum + (e.duration_ms || 0), 0) /
                                executions.filter(e => e.duration_ms).length
                            )
                            : '-'}
                    </h3>
                    <p className="text-sm text-muted-foreground">Avg Duration</p>
                </Card>
            </div>

            { }
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner className="size-8 text-primary" />
                </div>
            ) : executions.length === 0 ? (
                <Card className="text-center py-20">
                    <h3 className="text-lg font-semibold mb-2">No executions yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Run this workflow to see execution history
                    </p>
                    <Link href={`/flows/${params.id}?mode=edit`}>
                        <Button>Open Editor</Button>
                    </Link>
                </Card>
            ) : (
                <DataTable
                    data={executions}
                    columns={columns}
                    loading={loading}
                    actions={
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={loadExecutions} disabled={loading}>
                                <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Link href={`/flows/${params.id}`}>
                                <Button variant="outline">Back to Flow</Button>
                            </Link>
                        </div>
                    }
                />
            )}

            { }
            <AlertDialogConfirm
                open={deleteExecutionId !== null}
                onOpenChange={(open) => !open && setDeleteExecutionId(null)}
                title="Delete this execution?"
                description="This execution record will be permanently deleted. This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    )
}
