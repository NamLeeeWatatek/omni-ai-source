'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@wataomi/ui'
import {
    FiRefreshCw,
    FiDownload,
    FiClock,
    FiCheckCircle
} from 'react-icons/fi'
import { ExecutionStatusBadge } from '@/components/workflows/execution-status-badge'
import { ExecutionTimeline } from '@/components/workflows/execution-timeline'
import { NodeExecutionCard } from '@/components/workflows/node-execution-card'

export default function ExecutionDetailPage({
    params
}: {
    params: { id: string; executionId: string }
}) {
    const [activeTab, setActiveTab] = useState<'timeline' | 'nodes' | 'logs'>('timeline')

    // Mock data
    const execution = {
        id: parseInt(params.executionId),
        flow_version_id: parseInt(params.id),
        status: 'completed' as const,
        started_at: '2024-01-20T16:45:00Z',
        completed_at: '2024-01-20T16:45:02Z',
        duration: 2100,
        trigger: 'WhatsApp Message',
        total_nodes: 7,
        completed_nodes: 7,
        input_data: {
            message: 'Hello, I need help',
            from: '+1234567890',
            channel: 'whatsapp'
        },
        output_data: {
            response: 'Support ticket created',
            ticket_id: 'TKT-12345'
        }
    }

    const nodeExecutions = [
        {
            id: 1,
            node_id: '1',
            node_label: 'Start',
            node_type: 'start',
            status: 'completed' as const,
            started_at: '2024-01-20T16:45:00Z',
            completed_at: '2024-01-20T16:45:00Z',
            execution_time_ms: 10,
            input_data: execution.input_data,
            output_data: execution.input_data,
            error_message: null
        },
        {
            id: 2,
            node_id: '2',
            node_label: 'Receive Message',
            node_type: 'message',
            status: 'completed' as const,
            started_at: '2024-01-20T16:45:00Z',
            completed_at: '2024-01-20T16:45:00Z',
            execution_time_ms: 150,
            input_data: execution.input_data,
            output_data: { message_received: true },
            error_message: null
        },
        {
            id: 3,
            node_id: '3',
            node_label: 'AI Analysis',
            node_type: 'ai-reply',
            status: 'completed' as const,
            started_at: '2024-01-20T16:45:00Z',
            completed_at: '2024-01-20T16:45:01Z',
            execution_time_ms: 850,
            input_data: { message: 'Hello, I need help' },
            output_data: {
                intent: 'support_request',
                confidence: 0.95,
                suggested_response: 'I can help you with that'
            },
            error_message: null
        },
        {
            id: 4,
            node_id: '4',
            node_label: 'Create Ticket',
            node_type: 'n8n-trigger',
            status: 'completed' as const,
            started_at: '2024-01-20T16:45:01Z',
            completed_at: '2024-01-20T16:45:02Z',
            execution_time_ms: 920,
            input_data: { intent: 'support_request' },
            output_data: { ticket_id: 'TKT-12345' },
            error_message: null
        },
        {
            id: 5,
            node_id: '5',
            node_label: 'Send Response',
            node_type: 'message',
            status: 'completed' as const,
            started_at: '2024-01-20T16:45:02Z',
            completed_at: '2024-01-20T16:45:02Z',
            execution_time_ms: 120,
            input_data: { ticket_id: 'TKT-12345' },
            output_data: { message_sent: true },
            error_message: null
        },
        {
            id: 6,
            node_id: '6',
            node_label: 'End',
            node_type: 'end',
            status: 'completed' as const,
            started_at: '2024-01-20T16:45:02Z',
            completed_at: '2024-01-20T16:45:02Z',
            execution_time_ms: 5,
            input_data: execution.output_data,
            output_data: execution.output_data,
            error_message: null
        }
    ]

    const logs = [
        { timestamp: '2024-01-20T16:45:00.010Z', level: 'info', message: 'Workflow execution started' },
        { timestamp: '2024-01-20T16:45:00.150Z', level: 'info', message: 'Message received from WhatsApp' },
        { timestamp: '2024-01-20T16:45:01.000Z', level: 'info', message: 'AI analysis completed with 95% confidence' },
        { timestamp: '2024-01-20T16:45:01.920Z', level: 'info', message: 'Support ticket TKT-12345 created' },
        { timestamp: '2024-01-20T16:45:02.040Z', level: 'info', message: 'Response sent to customer' },
        { timestamp: '2024-01-20T16:45:02.100Z', level: 'info', message: 'Workflow execution completed successfully' }
    ]

    const formatDuration = (ms: number) => {
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

    const formatLogTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        })
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href={`/flows/${params.id}/executions`}
                    className="text-sm text-primary hover:underline mb-2 inline-block"
                >
                    ← Back to Executions
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Execution #{execution.id}</h1>
                        <p className="text-muted-foreground">
                            Triggered by {execution.trigger}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ExecutionStatusBadge status={execution.status} />
                        <Button variant="outline" size="sm">
                            <FiRefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                        <Button variant="outline" size="sm">
                            <FiDownload className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiClock className="w-5 h-5 text-wata-purple" />
                        <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
                    </div>
                    <p className="text-2xl font-bold">{formatDuration(execution.duration)}</p>
                </div>

                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiCheckCircle className="w-5 h-5 text-wata-blue" />
                        <h3 className="text-sm font-medium text-muted-foreground">Progress</h3>
                    </div>
                    <p className="text-2xl font-bold">
                        {execution.completed_nodes}/{execution.total_nodes}
                    </p>
                </div>

                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiClock className="w-5 h-5 text-wata-cyan" />
                        <h3 className="text-sm font-medium text-muted-foreground">Started</h3>
                    </div>
                    <p className="text-sm font-semibold">{formatDate(execution.started_at)}</p>
                </div>

                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiCheckCircle className="w-5 h-5 text-wata-pink" />
                        <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
                    </div>
                    <p className="text-sm font-semibold">
                        {execution.completed_at ? formatDate(execution.completed_at) : '-'}
                    </p>
                </div>
            </div>

            {/* Input/Output Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Input Data</h3>
                    <pre className="text-xs bg-card p-4 rounded-lg border border-border overflow-x-auto">
                        {JSON.stringify(execution.input_data, null, 2)}
                    </pre>
                </div>
                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Output Data</h3>
                    <pre className="text-xs bg-card p-4 rounded-lg border border-border overflow-x-auto">
                        {JSON.stringify(execution.output_data, null, 2)}
                    </pre>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="flex items-center gap-1 glass rounded-lg p-1 w-fit">
                    {(['timeline', 'nodes', 'logs'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab
                                ? 'bg-primary text-white'
                                : 'text-muted-foreground hover:bg-accent'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'timeline' && (
                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-6">Execution Timeline</h3>
                    <ExecutionTimeline events={nodeExecutions.map(e => ({
                        id: e.id.toString(),
                        status: e.status,
                        timestamp: e.started_at,
                        label: e.node_label,
                        description: e.error_message || undefined
                    }))} />
                </div>
            )}

            {activeTab === 'nodes' && (
                <div className="space-y-4">
                    {nodeExecutions.map((node) => (
                        <NodeExecutionCard key={node.id} execution={{
                            id: node.id.toString(),
                            nodeLabel: node.node_label,
                            nodeType: node.node_type,
                            status: node.status,
                            duration: node.execution_time_ms,
                            startedAt: node.started_at,
                            input: node.input_data,
                            output: node.output_data,
                            error: node.error_message || undefined
                        }} />
                    ))}
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Execution Logs</h3>
                    <div className="space-y-2">
                        {logs.map((log, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 font-mono text-xs"
                            >
                                <span className="text-muted-foreground whitespace-nowrap">
                                    {formatLogTime(log.timestamp)}
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded-md font-semibold uppercase ${log.level === 'error'
                                        ? 'bg-status-error/20 text-status-error'
                                        : log.level === 'warn'
                                            ? 'bg-yellow-500/20 text-yellow-500'
                                            : 'bg-status-success/20 text-status-success'
                                        }`}
                                >
                                    {log.level}
                                </span>
                                <span className="flex-1">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
