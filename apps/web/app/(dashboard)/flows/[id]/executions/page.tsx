'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@wataomi/ui'
import {
    FiFilter,
    FiDownload,
    FiRefreshCw,
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiPlay
} from 'react-icons/fi'
import { ExecutionStatusBadge } from '@/components/workflows/execution-status-badge'

export default function ExecutionHistoryPage({ params }: { params: { id: string } }) {
    const [statusFilter, setStatusFilter] = useState<string>('all')

    // Mock data
    const executions = [
        {
            id: 1,
            status: 'completed' as const,
            started_at: '2024-01-20T16:45:00Z',
            completed_at: '2024-01-20T16:45:02Z',
            duration: 2100,
            trigger: 'WhatsApp Message',
            total_nodes: 7,
            completed_nodes: 7
        },
        {
            id: 2,
            status: 'completed' as const,
            started_at: '2024-01-20T15:30:00Z',
            completed_at: '2024-01-20T15:30:02Z',
            duration: 2450,
            trigger: 'Messenger',
            total_nodes: 7,
            completed_nodes: 7
        },
        {
            id: 3,
            status: 'failed' as const,
            started_at: '2024-01-20T14:15:00Z',
            completed_at: '2024-01-20T14:15:01Z',
            duration: 1200,
            trigger: 'Instagram DM',
            total_nodes: 7,
            completed_nodes: 3
        },
        {
            id: 4,
            status: 'running' as const,
            started_at: '2024-01-20T17:00:00Z',
            completed_at: null,
            duration: null,
            trigger: 'Manual Test',
            total_nodes: 7,
            completed_nodes: 4
        }
    ]

    const formatDuration = (ms: number | null) => {
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
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <FiCheckCircle className="w-5 h-5 text-status-success" />
            case 'failed':
                return <FiXCircle className="w-5 h-5 text-status-error" />
            case 'running':
                return <FiPlay className="w-5 h-5 text-status-running animate-pulse" />
            default:
                return <FiClock className="w-5 h-5 text-muted-foreground" />
        }
    }

    const filteredExecutions = statusFilter === 'all'
        ? executions
        : executions.filter(e => e.status === statusFilter)

    const stats = {
        total: executions.length,
        completed: executions.filter(e => e.status === 'completed').length,
        failed: executions.filter(e => e.status === 'failed').length,
        running: executions.filter(e => e.status === 'running').length
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link
                        href={`/flows/${params.id}`}
                        className="text-sm text-primary hover:underline mb-2 inline-block"
                    >
                        ← Back to Workflow
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">Execution History</h1>
                    <p className="text-muted-foreground">
                        View and analyze all workflow executions
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline">
                        <FiRefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline">
                        <FiDownload className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="glass rounded-xl p-6">
                    <h3 className="text-2xl font-bold mb-1">{stats.total}</h3>
                    <p className="text-sm text-muted-foreground">Total Executions</p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <FiCheckCircle className="w-5 h-5 text-status-success" />
                        <h3 className="text-2xl font-bold">{stats.completed}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <FiXCircle className="w-5 h-5 text-status-error" />
                        <h3 className="text-2xl font-bold">{stats.failed}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <FiPlay className="w-5 h-5 text-status-running" />
                        <h3 className="text-2xl font-bold">{stats.running}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Running</p>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <FiFilter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filter by status:</span>
                    <div className="flex items-center gap-2">
                        {['all', 'completed', 'failed', 'running'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${statusFilter === status
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground hover:bg-accent'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Executions List */}
            <div className="space-y-4">
                {filteredExecutions.map((execution) => (
                    <Link
                        key={execution.id}
                        href={`/flows/${params.id}/executions/${execution.id}`}
                        className="block glass rounded-xl p-6 hover:border-primary/40 transition-all duration-200"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                {/* Status Icon */}
                                <div className="mt-1">
                                    {getStatusIcon(execution.status)}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">
                                            Execution #{execution.id}
                                        </h3>
                                        <ExecutionStatusBadge status={execution.status} />
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground mb-1">Trigger</p>
                                            <p className="font-medium">{execution.trigger}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground mb-1">Duration</p>
                                            <p className="font-medium">{formatDuration(execution.duration)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground mb-1">Progress</p>
                                            <p className="font-medium">
                                                {execution.completed_nodes}/{execution.total_nodes} nodes
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground mb-1">Started</p>
                                            <p className="font-medium">{formatDate(execution.started_at)}</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${execution.status === 'completed'
                                                    ? 'bg-status-success'
                                                    : execution.status === 'failed'
                                                        ? 'bg-status-error'
                                                        : 'bg-status-running'
                                                    }`}
                                                style={{
                                                    width: `${(execution.completed_nodes / execution.total_nodes) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Empty State */}
            {filteredExecutions.length === 0 && (
                <div className="text-center py-16 glass rounded-xl">
                    <FiClock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No executions found</h3>
                    <p className="text-muted-foreground mb-6">
                        {statusFilter === 'all'
                            ? 'This workflow has not been executed yet'
                            : `No ${statusFilter} executions found`}
                    </p>
                    <Link href={`/flows/${params.id}/edit`}>
                        <Button>
                            <FiPlay className="w-4 h-4 mr-2" />
                            Test Workflow
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}
