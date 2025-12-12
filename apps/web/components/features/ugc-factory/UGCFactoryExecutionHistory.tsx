'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import axiosClient from '@/lib/axios-client'
import {
    FiActivity,
    FiCheckCircle,
    FiClock
} from 'react-icons/fi'

interface Execution {
    id: string
    flow_id: string
    status: 'completed' | 'failed' | 'running' | 'pending'
    started_at: string
    completed_at?: string
    duration_ms?: number
    error_message?: string
    total_nodes: number
    completed_nodes: number
}

interface UGCFactoryExecutionHistoryProps {
    flowId: string
    executionStatus: 'idle' | 'running' | 'completed' | 'failed'
    executionId: string | null
    result: any
    error: string | null
    onStartNew: () => void
}

export function UGCFactoryExecutionHistory({
    flowId,
    executionStatus,
    executionId,
    result,
    error,
    onStartNew
}: UGCFactoryExecutionHistoryProps) {
    const [executions, setExecutions] = useState<Execution[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalExecutions: 0,
        successRate: 0,
        avgDuration: 0
    })

    useEffect(() => {
        loadExecutions()
    }, [flowId])

    const loadExecutions = async () => {
        try {
            setLoading(true)
            const data = await axiosClient.get(`/executions/?flow_id=${flowId}&limit=100`)
            setExecutions(data)

            // Calculate stats
            const totalExecutions = data.length
            const completedExecutions = data.filter((e: Execution) => e.status === 'completed')
            const successRate = totalExecutions > 0
                ? (completedExecutions.length / totalExecutions) * 100
                : 0

            const durations = data
                .filter((e: Execution) => e.duration_ms)
                .map((e: Execution) => e.duration_ms!)
            const avgDuration = durations.length > 0
                ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
                : 0

            setStats({
                totalExecutions,
                successRate,
                avgDuration
            })
        } catch (err) {
            console.error('Failed to load executions:', err)
            setExecutions([])
        } finally {
            setLoading(false)
        }
    }

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
        return `${(ms / 60000).toFixed(1)}m`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <Card className="p-6">
                <div className="text-center text-muted-foreground">
                    Loading execution history...
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Execution History</h3>
                <Button size="sm" onClick={onStartNew}>
                    Run New Execution
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Spinner className="w-8 h-8 mx-auto mb-4" />
                    Loading executions...
                </div>
            ) : executions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <FiActivity className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No executions yet</p>
                    <p className="text-sm mb-4">Execute this workflow to see execution history</p>
                    <Button onClick={onStartNew}>
                        Run First Execution
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {executions.map((execution, index) => (
                        <div
                            key={execution.id}
                            className={`p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors ${index === 0 && execution.id === executionId ? 'ring-2 ring-primary/40' : ''
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    {execution.status === 'completed' ? (
                                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <FiCheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                    ) : execution.status === 'failed' ? (
                                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                            <FiActivity className="w-5 h-5 text-red-500" />
                                        </div>
                                    ) : execution.status === 'running' ? (
                                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                            <Spinner className="w-5 h-5 text-yellow-500" />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                            <FiClock className="w-5 h-5 text-yellow-500" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium">
                                            Execution #{executions.length - index}
                                            {index === 0 && execution.id === executionId && (
                                                <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-primary text-white">
                                                    Current
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm text-muted-foreground capitalize flex items-center gap-1.5">
                                            <span>{execution.status}</span>
                                            {execution.total_nodes > 0 && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                                    <span>{execution.completed_nodes}/{execution.total_nodes} nodes</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {execution.duration_ms && (
                                        <p className="text-sm font-medium">{formatDuration(execution.duration_ms)}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(execution.started_at)}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {execution.total_nodes > 0 && (
                                <div className="mb-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                        <span>Progress</span>
                                        <span>{execution.completed_nodes}/{execution.total_nodes} nodes</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${execution.status === 'completed' ? 'bg-green-500' :
                                                execution.status === 'failed' ? 'bg-red-500' :
                                                    execution.status === 'running' ? 'bg-yellow-500' :
                                                        'bg-gray-400'
                                                }`}
                                            style={{
                                                width: `${(execution.completed_nodes / execution.total_nodes) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {execution.error_message && (
                                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-500">
                                    {execution.error_message}
                                </div>
                            )}

                            {/* Execution Output Preview (for current execution) */}
                            {index === 0 && execution.id === executionId && result && (
                                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded">
                                    <p className="text-xs font-medium text-green-700 mb-2">Execution Output:</p>
                                    <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                                        <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
