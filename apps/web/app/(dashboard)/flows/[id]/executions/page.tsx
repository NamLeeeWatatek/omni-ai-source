'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import toast from 'react-hot-toast'
import {
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiEye,
    FiTrash2,
    FiRefreshCw
} from 'react-icons/fi'
import { fetchAPI } from '@/lib/api'

interface Execution {
    id: number
    flow_version_id: number
    status: string
    started_at: string
    completed_at?: string
    total_nodes: number
    completed_nodes: number
    duration_ms?: number
    success_rate?: number
    error_message?: string
}

export default function ExecutionsPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [executions, setExecutions] = useState<Execution[]>([])
    const [loading, setLoading] = useState(true)
    const [flowName, setFlowName] = useState('')

    useEffect(() => {
        loadExecutions()
        loadFlow()
    }, [params.id])

    const loadFlow = async () => {
        try {
            const data = await fetchAPI(`/flows/${params.id}`)
            setFlowName(data.name)
        } catch (e: any) {
            toast.error('Failed to load flow')
        }
    }

    const loadExecutions = async () => {
        try {
            setLoading(true)
            const data = await fetchAPI(`/executions/?flow_id=${params.id}`)
            setExecutions(data)
        } catch (e: any) {
            toast.error('Failed to load executions')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (executionId: number) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <div>
                    <p className="font-semibold">Delete this execution?</p>
                    <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => toast.dismiss(t.id)}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600"
                        onClick={async () => {
                            toast.dismiss(t.id)
                            const deletePromise = fetchAPI(`/executions/${executionId}`, {
                                method: 'DELETE'
                            }).then(() => loadExecutions())

                            toast.promise(deletePromise, {
                                loading: 'Deleting execution...',
                                success: 'Execution deleted!',
                                error: (err) => `Failed: ${err.message}`
                            })
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        ), { duration: Infinity })
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

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Executions</h1>
                        <p className="text-muted-foreground">
                            {flowName || 'Loading...'} • {executions.length} total runs
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={loadExecutions}>
                            <FiRefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Link href={`/flows/${params.id}`}>
                            <Button variant="outline">Back to Flow</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <FiCheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">
                        {executions.filter(e => e.status === 'completed').length}
                    </h3>
                    <p className="text-sm text-muted-foreground">Completed</p>
                </div>

                <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <FiXCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">
                        {executions.filter(e => e.status === 'failed').length}
                    </h3>
                    <p className="text-sm text-muted-foreground">Failed</p>
                </div>

                <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <FiClock className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">
                        {executions.filter(e => e.status === 'running').length}
                    </h3>
                    <p className="text-sm text-muted-foreground">Running</p>
                </div>

                <div className="glass rounded-xl p-6">
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
                </div>
            </div>

            {/* Executions List */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner className="size-8 text-primary" />
                </div>
            ) : executions.length === 0 ? (
                <div className="text-center py-20 glass rounded-xl">
                    <h3 className="text-lg font-semibold mb-2">No executions yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Run this workflow to see execution history
                    </p>
                    <Link href={`/flows/${params.id}/edit`}>
                        <Button>Open Editor</Button>
                    </Link>
                </div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Started</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Duration</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Progress</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Success Rate</th>
                                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {executions.map((execution) => (
                                <tr
                                    key={execution.id}
                                    className="border-t border-border/40 hover:bg-muted/20"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(execution.status)}
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                    execution.status
                                                )}`}
                                            >
                                                {execution.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {formatDate(execution.started_at)}
                                    </td>
                                    <td className="p-4 text-sm font-medium">
                                        {formatDuration(execution.duration_ms)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{
                                                        width: `${(execution.completed_nodes /
                                                                execution.total_nodes) *
                                                            100
                                                            }%`
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {execution.completed_nodes}/{execution.total_nodes}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm font-medium">
                                            {execution.success_rate?.toFixed(0) || 0}%
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/flows/${params.id}/executions/${execution.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <FiEye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                                onClick={() => handleDelete(execution.id)}
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
