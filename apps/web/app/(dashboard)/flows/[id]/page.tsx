'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@wataomi/ui'
import {
    FiEdit,
    FiPlay,
    FiCopy,
    FiTrash2,
    FiDownload,
    FiShare2,
    FiClock,
    FiCheckCircle,
    FiTrendingUp,
    FiActivity
} from 'react-icons/fi'

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
    const [activeTab, setActiveTab] = useState<'overview' | 'executions' | 'versions' | 'settings'>('overview')

    // Mock data
    const workflow = {
        id: parseInt(params.id),
        name: 'Customer Support Flow',
        description: 'Automated customer support workflow with AI responses and human handover capabilities',
        tags: ['support', 'ai', 'automation'],
        version: 3,
        is_published: true,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T14:22:00Z',
        execution_count: 245,
        success_rate: 94,
        avg_duration: 2340,
        last_execution: '2024-01-20T16:45:00Z'
    }

    const recentExecutions = [
        {
            id: 1,
            status: 'completed' as const,
            started_at: '2024-01-20T16:45:00Z',
            duration: 2100,
            trigger: 'WhatsApp Message'
        },
        {
            id: 2,
            status: 'completed' as const,
            started_at: '2024-01-20T15:30:00Z',
            duration: 2450,
            trigger: 'Messenger'
        },
        {
            id: 3,
            status: 'failed' as const,
            started_at: '2024-01-20T14:15:00Z',
            duration: 1200,
            trigger: 'Instagram DM'
        }
    ]

    const versions = [
        { version: 3, date: '2024-01-20T14:22:00Z', changes: 'Added AI response node', is_current: true },
        { version: 2, date: '2024-01-18T10:15:00Z', changes: 'Updated message templates', is_current: false },
        { version: 1, date: '2024-01-15T10:30:00Z', changes: 'Initial version', is_current: false }
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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">{workflow.name}</h1>
                        <p className="text-muted-foreground">{workflow.description}</p>
                    </div>

                    {/* Status Badge */}
                    <div>
                        {workflow.is_published ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                <FiCheckCircle className="w-4 h-4 mr-2" />
                                Published
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground border border-border">
                                Draft
                            </span>
                        )}
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {workflow.tags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <Link href={`/flows/${workflow.id}/edit`}>
                        <Button>
                            <FiEdit className="w-4 h-4 mr-2" />
                            Edit Workflow
                        </Button>
                    </Link>
                    <Button variant="outline">
                        <FiPlay className="w-4 h-4 mr-2" />
                        Test Run
                    </Button>
                    <Button variant="outline">
                        <FiCopy className="w-4 h-4 mr-2" />
                        Duplicate
                    </Button>
                    <Button variant="outline">
                        <FiDownload className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline">
                        <FiShare2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Button variant="ghost">
                        <FiTrash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <FiActivity className="w-8 h-8 text-wata-purple" />
                        <FiTrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{workflow.execution_count}</h3>
                    <p className="text-sm text-muted-foreground">Total Executions</p>
                </div>

                <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <FiCheckCircle className="w-8 h-8 text-wata-blue" />
                        <span className="text-sm font-medium text-green-500">+3%</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{workflow.success_rate}%</h3>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>

                <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <FiClock className="w-8 h-8 text-wata-cyan" />
                        <span className="text-sm font-medium text-green-500">-5%</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{formatDuration(workflow.avg_duration)}</h3>
                    <p className="text-sm text-muted-foreground">Avg Duration</p>
                </div>

                <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <FiActivity className="w-8 h-8 text-wata-pink" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">v{workflow.version}</h3>
                    <p className="text-sm text-muted-foreground">Current Version</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="flex items-center gap-1 glass rounded-lg p-1 w-fit">
                    {(['overview', 'executions', 'versions', 'settings'] as const).map((tab) => (
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
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Workflow Canvas Preview */}
                    <div className="glass rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Workflow Diagram</h3>
                        <div className="h-96 bg-muted/20 rounded-lg flex items-center justify-center border border-border/40">
                            <p className="text-muted-foreground">Workflow canvas preview (ReactFlow integration)</p>
                        </div>
                    </div>

                    {/* Recent Executions */}
                    <div className="glass rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Recent Executions</h3>
                            <Link href={`/flows/${workflow.id}/executions`}>
                                <Button size="sm" variant="ghost">
                                    View All
                                </Button>
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recentExecutions.map((execution) => (
                                <Link
                                    key={execution.id}
                                    href={`/flows/${workflow.id}/executions/${execution.id}`}
                                    className="block p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {execution.status === 'completed' ? (
                                                <FiCheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <FiActivity className="w-5 h-5 text-red-500" />
                                            )}
                                            <div>
                                                <p className="font-medium">Execution #{execution.id}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Triggered by {execution.trigger}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{formatDuration(execution.duration)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(execution.started_at)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'executions' && (
                <div className="glass rounded-xl p-6">
                    <p className="text-muted-foreground text-center py-8">
                        Redirecting to executions page...
                    </p>
                </div>
            )}

            {activeTab === 'versions' && (
                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Version History</h3>
                    <div className="space-y-4">
                        {versions.map((v) => (
                            <div
                                key={v.version}
                                className={`p-4 rounded-lg border ${v.is_current
                                    ? 'border-primary/40 bg-primary/5'
                                    : 'border-border/40 bg-muted/20'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold">Version {v.version}</h4>
                                            {v.is_current && (
                                                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary text-white">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{v.changes}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDate(v.date)}
                                        </p>
                                    </div>
                                    {!v.is_current && (
                                        <Button size="sm" variant="outline">
                                            Restore
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Workflow Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Workflow Name</label>
                            <input
                                type="text"
                                defaultValue={workflow.name}
                                className="w-full glass rounded-lg px-4 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <textarea
                                defaultValue={workflow.description}
                                rows={3}
                                className="w-full glass rounded-lg px-4 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-border/40">
                            <div>
                                <h4 className="font-medium mb-1">Publish Workflow</h4>
                                <p className="text-sm text-muted-foreground">
                                    Make this workflow active and available for execution
                                </p>
                            </div>
                            <Button>
                                {workflow.is_published ? 'Unpublish' : 'Publish'}
                            </Button>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-border/40">
                            <div>
                                <h4 className="font-medium mb-1 text-red-500">Delete Workflow</h4>
                                <p className="text-sm text-muted-foreground">
                                    Permanently delete this workflow and all its data
                                </p>
                            </div>
                            <Button variant="ghost" className="text-red-500 hover:bg-red-500/10">
                                <FiTrash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
