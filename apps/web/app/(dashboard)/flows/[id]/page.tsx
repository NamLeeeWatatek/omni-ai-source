'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant } from 'reactflow'
import 'reactflow/dist/style.css'
import { useAppSelector } from '@/lib/store/hooks'
import CustomNode from '@/components/features/workflow/custom-node'
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
    FiActivity,
    FiLoader,
    FiSave
} from 'react-icons/fi'
import { getExecutionReference } from '@/lib/utils/execution'

function FlowPreview({ nodes, edges }: { nodes: any[], edges: any[] }) {
    const { items: allNodeTypes = [] } = useAppSelector((state: any) => state.nodeTypes || {})

    const nodeTypes = useMemo(() => {
        const types: Record<string, any> = { custom: CustomNode }
        allNodeTypes.forEach((t: any) => {
            types[t.id] = CustomNode
        })
        return types
    }, [allNodeTypes])

    const safeNodes = useMemo(() => {
        return nodes.map(node => {
            const originalType = node.data?.type || node.type

            return {
                ...node,
                type: 'custom',
                data: {
                    ...node.data,
                    type: originalType,
                    label: node.data?.label || node.data?.name || originalType
                }
            }
        })
    }, [nodes])

    return (
        <div className="h-[600px] bg-background rounded-lg border border-border overflow-hidden relative shadow-sm group">
            <ReactFlow
                nodes={safeNodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                proOptions={{ hideAttribution: true }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                zoomOnScroll={true}
                panOnScroll={true}
                minZoom={0.1}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                <Controls />
                <MiniMap className="!bg-background/90 !border-border" />
            </ReactFlow>
            <div className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-background/80 backdrop-blur rounded-full text-xs font-medium text-muted-foreground border border-border shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Read Only Preview
            </div>
        </div>
    )
}

function VersionsTab({ flowId, onUpdate }: { flowId: number, onUpdate: () => void }) {
    const [versions, setVersions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadVersions()
    }, [flowId])

    const loadVersions = async () => {
        try {
            setLoading(true)
            const data = await (await axiosClient.get(`/flows/${flowId}/versions`)).data
            setVersions(data)
        } catch (e: any) {

            toast.error('Failed to load versions')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateVersion = async () => {
        const createPromise = (await axiosClient.post(`/flows/${flowId}/versions`, {
            name: `Version ${versions.length + 1}`,
            description: 'Manual version snapshot'
        })).data.then(() => {
            loadVersions()
            onUpdate()
        })

        toast.promise(createPromise, {
            loading: 'Creating version...',
            success: 'Version created successfully!',
            error: (err) => `Failed to create version: ${err.message}`
        })
    }

    const handleRestore = async (version: number) => {
        toast.error('Version restore coming soon!')
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
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Version History</h3>
                <Button size="sm" onClick={handleCreateVersion}>
                    <FiClock className="w-4 h-4 mr-2" />
                    Create Version
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading versions...
                </div>
            ) : versions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <FiClock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No versions yet</p>
                    <p className="text-sm mb-4">
                        Create version snapshots to track changes over time
                    </p>
                    <Button onClick={handleCreateVersion}>
                        Create First Version
                    </Button>
                </div>
            ) : (
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
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold">Version {v.version}</h4>
                                        {v.is_current && (
                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary text-white">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        {v.description || v.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(v.created_at)}
                                    </p>
                                </div>
                                {!v.is_current && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRestore(v.version)}
                                    >
                                        Restore
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}

function SettingsTab({
    flow,
    onUpdate,
    onArchive,
    onDelete
}: {
    flow: any
    onUpdate: () => void
    onArchive: () => void
    onDelete: () => void
}) {
    const [name, setName] = useState(flow.name)
    const [description, setDescription] = useState(flow.description || '')
    const [status, setStatus] = useState(flow.status)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        const savePromise = (async () => {
            setSaving(true)
            await axiosClient.patch(`/flows/${flow.id}`, {
                name,
                description,
                status
            })
            onUpdate()
        })()

        toast.promise(savePromise, {
            loading: 'Saving settings...',
            success: 'Settings saved successfully!',
            error: (err) => `Failed to save: ${err.message}`
        })

        savePromise.finally(() => setSaving(false))
    }

    const hasChanges = name !== flow.name ||
        description !== (flow.description || '') ||
        status !== flow.status

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Workflow Settings</h3>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2">Workflow Name</label>
                    <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter workflow name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Describe what this workflow does"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {hasChanges && (
                    <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <span className="text-sm text-amber-500">You have unsaved changes</span>
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <FiSave className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                )}

                <div className="pt-6 border-t border-border/40 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium mb-1">Archive Workflow</h4>
                            <p className="text-sm text-muted-foreground">
                                Archive this workflow (can be restored later)
                            </p>
                        </div>
                        <Button variant="outline" onClick={onArchive}>
                            Archive
                        </Button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <div>
                            <h4 className="font-medium mb-1 text-red-500">Delete Workflow</h4>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete this workflow and all its data
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            className="text-red-500 hover:bg-red-500/10"
                            onClick={onDelete}
                        >
                            <FiTrash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'overview' | 'executions' | 'versions' | 'settings'>('overview')
    const [flow, setFlow] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    const { items: nodeTypes = [] } = useAppSelector((state: any) => state.nodeTypes || {})

    useEffect(() => {
        loadFlow()
    }, [params.id])

    const loadFlow = async () => {
        try {
            setLoading(true)
            const data = await (await axiosClient.get(`/flows/${params.id}`)).data
            setFlow(data)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDuplicate = async () => {
        const duplicatePromise = axiosClient.post(`/flows/${params.id}/duplicate`)
            .then((response) => {
                const dup = response.data || response
                router.push(`/flows/${dup.id}/edit`)
                return dup
            })

        toast.promise(duplicatePromise, {
            loading: 'Duplicating workflow...',
            success: 'Workflow duplicated successfully!',
            error: (err) => `Failed to duplicate: ${err.message}`,
        })
    }

    const handleDelete = () => {
        setShowDeleteDialog(true)
    }

    const confirmDelete = async () => {
        const deletePromise = axiosClient.delete(`/flows/${params.id}`)
            .then(() => {
                router.push('/flows')
            })

        toast.promise(deletePromise, {
            loading: 'Deleting workflow...',
            success: 'Workflow deleted successfully!',
            error: (err) => `Failed to delete: ${err.message}`,
        })
    }

    const handleArchive = async () => {
        const archivePromise = axiosClient.post(`/flows/${params.id}/archive`)
            .then(() => {
                router.push('/flows')
            })

        toast.promise(archivePromise, {
            loading: 'Archiving workflow...',
            success: 'Workflow archived successfully!',
            error: (err) => `Failed to archive: ${err.message}`,
        })
    }

    const handleExport = () => {
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flow, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `${flow.name.replace(/\s+/g, '_')}_workflow.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            toast.success('Workflow exported!')
        } catch (e: any) {
            toast.error('Failed to export: ' + e.message)
        }
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Workflow link copied to clipboard!')
    }

    const [recentExecutions, setRecentExecutions] = useState<any[]>([])
    const [executionsLoading, setExecutionsLoading] = useState(false)
    const [stats, setStats] = useState({
        totalExecutions: 0,
        successRate: 0,
        avgDuration: 0
    })

    useEffect(() => {
        if (flow) {
            loadRecentExecutions()
            loadStats()
        }
    }, [flow])

    const loadRecentExecutions = async () => {
        try {
            setExecutionsLoading(true)
            const data = await (await axiosClient.get(`/executions/?flow_id=${params.id}&limit=5`)).data
            setRecentExecutions(data)
        } catch (e: any) {

        } finally {
            setExecutionsLoading(false)
        }
    }

    const loadStats = async () => {
        try {
            const allExecutions = await (await axiosClient.get(`/executions/?flow_id=${params.id}&limit=100`)).data

            const totalExecutions = allExecutions.length
            const completedExecutions = allExecutions.filter((e: any) => e.status === 'completed')
            const successRate = totalExecutions > 0
                ? (completedExecutions.length / totalExecutions) * 100
                : 0

            const durations = allExecutions
                .filter((e: any) => e.duration_ms)
                .map((e: any) => e.duration_ms)
            const avgDuration = durations.length > 0
                ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
                : 0

            setStats({
                totalExecutions,
                successRate,
                avgDuration
            })
        } catch (e: any) {

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
            <div className="p-8 flex items-center justify-center">
                <div className="text-muted-foreground">Loading workflow...</div>
            </div>
        )
    }

    if (error || !flow) {
        return (
            <div className="p-8">
                <Card className="p-6 text-center">
                    <p className="text-red-500 mb-4">{error || 'Flow not found'}</p>
                    <Link href="/flows">
                        <Button>Back to Flows</Button>
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="h-full">
            {}
            <div className="page-header">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">{flow.name}</h1>
                        <p className="text-muted-foreground">{flow.description || 'No description'}</p>
                    </div>

                    {}
                    <div>
                        {flow.status === 'published' ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                <FiCheckCircle className="w-4 h-4 mr-2" />
                                Published
                            </span>
                        ) : flow.status === 'archived' ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                Archived
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground border border-border">
                                Draft
                            </span>
                        )}
                    </div>
                </div>

                {}
                <div className="flex items-center gap-3">
                    <Link href={`/flows/${flow.id}/edit`}>
                        <Button>
                            <FiEdit className="w-4 h-4 mr-2" />
                            Edit Workflow
                        </Button>
                    </Link>
                    <Link href={`/flows/${flow.id}/edit`}>
                        <Button variant="outline">
                            <FiPlay className="w-4 h-4 mr-2" />
                            Test Run
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={handleDuplicate}>
                        <FiCopy className="w-4 h-4 mr-2" />
                        Duplicate
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <FiDownload className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline" onClick={handleShare}>
                        <FiShare2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Button variant="ghost" onClick={handleDelete}>
                        <FiTrash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {}
            <div className="content-section">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FiActivity className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats.totalExecutions}</h3>
                        <p className="text-sm text-muted-foreground">Total Executions</p>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FiCheckCircle className="w-8 h-8 text-slate-400" />
                            {stats.successRate > 0 && (
                                <span className={`text-sm font-medium ${stats.successRate >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                                    {stats.successRate.toFixed(0)}%
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats.successRate.toFixed(0)}%</h3>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FiClock className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-1">
                            {stats.avgDuration > 0 ? formatDuration(stats.avgDuration) : '0s'}
                        </h3>
                        <p className="text-sm text-muted-foreground">Avg Duration</p>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FiActivity className="w-8 h-8 text-stone-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-1">v{flow.version || 1}</h3>
                        <p className="text-sm text-muted-foreground">Current Version</p>
                    </Card>
                </div>
            </div>

            {}
            <div className="content-section">
                <Card className="flex items-center gap-1 p-1 w-fit">
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
                </Card>
            </div>

            {}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Workflow Diagram</h3>
                        {flow.data?.nodes ? (
                            <FlowPreview nodes={flow.data.nodes} edges={flow.data.edges || []} />
                        ) : (
                            <div className="h-96 bg-muted/20 rounded-lg flex items-center justify-center border border-border/40">
                                <p className="text-muted-foreground">No diagram data available</p>
                            </div>
                        )}
                    </Card>

                    {}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Recent Executions</h3>
                            <button onClick={() => setActiveTab('executions')}>
                                <Button size="sm" variant="ghost">
                                    View All
                                </Button>
                            </button>
                        </div>
                        {executionsLoading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Loading executions...
                            </div>
                        ) : recentExecutions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FiActivity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No executions yet</p>
                                <p className="text-sm mt-1">Run this workflow to see execution history</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentExecutions.map((execution) => (
                                    <Link
                                        key={execution.id}
                                        href={`/flows/${flow.id}/executions/${execution.id}`}
                                        className="block p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {execution.status === 'completed' ? (
                                                    <FiCheckCircle className="w-5 h-5 text-green-500" />
                                                ) : execution.status === 'failed' ? (
                                                    <FiActivity className="w-5 h-5 text-red-500" />
                                                ) : (
                                                    <FiClock className="w-5 h-5 text-yellow-500" />
                                                )}
                                                <div>
                                                    <p className="font-medium">{getExecutionReference(flow.id, execution.id)}</p>
                                                    <p className="text-sm text-muted-foreground capitalize flex items-center gap-1.5">
                                                        <span>{execution.status}</span>
                                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                                        <span>{execution.completed_nodes}/{execution.total_nodes} nodes</span>
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
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'executions' && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">All Executions</h3>
                        <Link href={`/flows/${flow.id}/edit`}>
                            <Button size="sm">
                                <FiPlay className="w-4 h-4 mr-2" />
                                Run Workflow
                            </Button>
                        </Link>
                    </div>

                    {executionsLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Loading executions...
                        </div>
                    ) : recentExecutions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FiActivity className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-2">No executions yet</p>
                            <p className="text-sm mb-4">Run this workflow to see execution history</p>
                            <Link href={`/flows/${flow.id}/edit`}>
                                <Button>
                                    <FiPlay className="w-4 h-4 mr-2" />
                                    Run Workflow
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentExecutions.map((execution) => (
                                <Link
                                    key={execution.id}
                                    href={`/flows/${flow.id}/executions/${execution.id}`}
                                    className="block p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
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
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                                    <FiClock className="w-5 h-5 text-yellow-500" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium">{getExecutionReference(flow.id, execution.id)}</p>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {execution.status}
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

                                    {}
                                    <div className="mb-2">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                            <span>Progress</span>
                                            <span>{execution.completed_nodes}/{execution.total_nodes} nodes</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${execution.status === 'completed' ? 'bg-green-500' :
                                                    execution.status === 'failed' ? 'bg-red-500' :
                                                        'bg-yellow-500'
                                                    }`}
                                                style={{
                                                    width: `${(execution.completed_nodes / execution.total_nodes) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {execution.error_message && (
                                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-500">
                                            {execution.error_message}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {activeTab === 'versions' && (
                <VersionsTab flowId={flow.id} onUpdate={loadFlow} />
            )}

            {activeTab === 'settings' && (
                <SettingsTab
                    flow={flow}
                    onUpdate={loadFlow}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                />
            )}

            {}
            <AlertDialogConfirm
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete this workflow?"
                description="This workflow will be permanently deleted. This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    )
}
