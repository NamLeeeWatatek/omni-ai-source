'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { PageLoading } from '@/components/ui/PageLoading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import toast from '@/lib/toast'
import {
    FiArrowLeft,
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiAlertCircle,
    FiRefreshCw,
    FiDownload
} from 'react-icons/fi'
import axiosClient from '@/lib/axios-client'
import { useAppSelector } from '@/lib/store/hooks'
import { getExecutionReference } from '@/lib/utils/execution'

interface NodeExecution {
    id: number
    node_id: string
    node_type: string
    node_label: string
    status: string
    started_at?: string
    completed_at?: string
    execution_time_ms?: number
    input_data: any
    output_data?: any
    error_message?: string
}

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
    input_data: any
    output_data?: any
    error_message?: string
    node_executions: NodeExecution[]
}

export default function ExecutionDetailPage({
    params
}: {
    params: { id: string; executionId: string }
}) {
    const { items: nodeTypes = [] } = useAppSelector((state: any) => state.nodeTypes || {})

    const getNodeType = (typeId: string) => {
        return nodeTypes.find((nt: any) => nt.id === typeId)
    }

    const [execution, setExecution] = useState<Execution | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedNode, setSelectedNode] = useState<NodeExecution | null>(null)

    useEffect(() => {
        loadExecution()
    }, [params.executionId])

    const loadExecution = async () => {
        try {
            setLoading(true)
            const data: any = await axiosClient.get(`/executions/${params.executionId}`)
            setExecution(data)
        } catch {
            toast.error('Failed to load execution details')
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <FiCheckCircle className="w-5 h-5 text-green-500" />
            case 'failed':
                return <FiXCircle className="w-5 h-5 text-red-500" />
            case 'running':
                return <LoadingLogo size="sm" className="inline-flex" />
            case 'skipped':
                return <FiAlertCircle className="w-5 h-5 text-yellow-500" />
            default:
                return <FiClock className="w-5 h-5 text-gray-500" />
        }
    }

    const renderOutputData = (data: any, isFinalResult: boolean = false) => {
        // Handle text responses
        if (data.response && typeof data.response === 'string') {
            return (
                <Card className="border-border/40">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <FiCheckCircle className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                        {data.response}
                                    </p>
                                </div>

                                {/* AI Model info */}
                                {(data.model || data.tokens_used || data.provider) && (
                                    <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                                        {data.model && (
                                            <span className="px-2 py-1 bg-muted rounded">
                                                🤖 {data.model}
                                            </span>
                                        )}
                                        {data.provider && (
                                            <span className="px-2 py-1 bg-muted rounded">
                                                🏢 {data.provider}
                                            </span>
                                        )}
                                        {data.tokens_used && (
                                            <span className="px-2 py-1 bg-muted rounded">
                                                🎫 {data.tokens_used} tokens
                                            </span>
                                        )}
                                        {data.cost && (
                                            <span className="px-2 py-1 bg-muted rounded">
                                                💰 ${data.cost}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Raw JSON toggle */}
                                <details className="mt-3">
                                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                        View Raw JSON
                                    </summary>
                                    <pre className="mt-2 text-xs overflow-auto max-h-32 p-2 bg-muted/30 rounded">
                                        {JSON.stringify(data, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )
        }

        // Enhanced product detection
        const isProduct = data.image || data.image_url || data.thumbnail || data.photo ||
            (data.name && (data.description || data.caption)) ||
            (data.title && (data.image || data.url || data.price)) ||
            data.product || data.item ||
            (data.brand && data.model) ||
            (data.sku && data.price)

        if (isProduct) {
            const imageUrl = data.image || data.image_url || data.thumbnail || data.photo || data.url
            const name = data.name || data.title || data.product || data.item || data.brand || 'Product'
            const description = data.description || data.caption || data.summary || data.details || ''
            const price = data.price || data.cost || data.amount
            const category = data.category || data.type || data.classification
            const brand = data.brand || data.manufacturer
            const sku = data.sku || data.id || data.product_id
            const rating = data.rating || data.stars
            const availability = data.availability || data.stock_status || data.in_stock

            return (
                <Card className="overflow-hidden border-border/40 hover:shadow-md transition-shadow">
                    {/* Product Image */}
                    {imageUrl && (
                        <div className="relative w-full h-48 bg-muted">
                            <img
                                src={imageUrl}
                                alt={name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
                                }}
                            />
                            {isFinalResult && (
                                <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                                    ✓ Generated
                                </div>
                            )}
                        </div>
                    )}

                    {/* Product Details */}
                    <CardContent className="p-4 space-y-3">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-base line-clamp-2">{name}</h4>

                            {description && (
                                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Product Meta */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {price && (
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                                    {typeof price === 'number' ? `$${price.toFixed(2)}` : price}
                                </span>
                            )}
                            {category && (
                                <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                                    📁 {category}
                                </span>
                            )}
                            {brand && (
                                <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                                    🏷️ {brand}
                                </span>
                            )}
                            {rating && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                    ⭐ {rating}/5
                                </span>
                            )}
                            {availability && (
                                <span className={`px-2 py-1 rounded text-xs ${availability === 'in_stock' || availability === true
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {availability === 'in_stock' || availability === true ? '✅ In Stock' : '❌ Out of Stock'}
                                </span>
                            )}
                        </div>

                        {/* Additional product info */}
                        {(sku || data.url) && (
                            <div className="pt-2 border-t border-border/40 space-y-1">
                                {sku && (
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-medium">SKU:</span> {sku}
                                    </div>
                                )}
                                {data.url && (
                                    <div className="text-xs">
                                        <a href={data.url} target="_blank" rel="noopener noreferrer"
                                            className="text-primary hover:underline">
                                            🔗 View Product
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Raw JSON toggle */}
                        <details className="mt-3">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                View Raw JSON
                            </summary>
                            <pre className="mt-2 text-xs overflow-auto max-h-32 p-2 bg-muted/30 rounded">
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </details>
                    </CardContent>
                </Card>
            )
        }

        // Handle arrays of products/results
        if (Array.isArray(data) && data.length > 0) {
            const firstItem = data[0];
            const isProductArray = data.every(item =>
                item.image || item.name || item.title || item.product ||
                item.price || item.category
            );

            if (isProductArray) {
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FiCheckCircle className="w-4 h-4" />
                            Generated {data.length} product{data.length > 1 ? 's' : ''}
                        </div>
                        <div className="grid gap-4">
                            {data.map((item, index) => (
                                <div key={index}>
                                    {renderOutputData(item, false)}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
        }

        // Default JSON display with better formatting
        return (
            <Card className="border-border/40">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FiCheckCircle className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium mb-2">Execution Result</div>
                            <pre className="text-xs overflow-auto max-h-40 p-3 bg-muted/30 rounded-lg border border-border/40 whitespace-pre-wrap">
                                {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
                            </pre>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'failed':
                return 'bg-red-500/10 text-red-500 border-red-500/20'
            case 'running':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case 'skipped':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
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

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const exportExecution = () => {
        if (!execution) return

        const dataStr = JSON.stringify(execution, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `execution-${execution.id}.json`
        link.click()
        URL.revokeObjectURL(url)

        toast.success('Execution data exported')
    }

    if (loading) {
        return <PageLoading message="Loading execution details..." />
    }

    if (!execution) {
        return (
            <div className="p-8">
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-red-500 mb-4">Execution not found</p>
                        <Link href={`/flows/${params.id}/executions`}>
                            <Button>Back to Executions</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6">
            { }
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Link href={`/flows/${params.id}/executions`}>
                            <Button variant="ghost" size="icon">
                                <FiArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{getExecutionReference(parseInt(params.id), execution.id)}</h1>
                            <p className="text-muted-foreground">
                                Started {formatDate(execution.started_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={loadExecution}>
                            <FiRefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button variant="outline" onClick={exportExecution}>
                            <FiDownload className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            { }
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(execution.status)}
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                    execution.status
                                )}`}
                            >
                                {execution.status}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Status</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-2xl font-bold mb-1">{formatDuration(execution.duration_ms)}</h3>
                        <p className="text-sm text-muted-foreground">Duration</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-2xl font-bold mb-1">
                            {execution.completed_nodes}/{execution.total_nodes}
                        </h3>
                        <p className="text-sm text-muted-foreground">Nodes Executed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-2xl font-bold mb-1">{execution.success_rate?.toFixed(0) || 0}%</h3>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-2xl font-bold mb-1">
                            {execution.node_executions?.filter((n) => n.status === 'failed').length || 0}
                        </h3>
                        <p className="text-sm text-muted-foreground">Failed Nodes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Final Execution Result */}
            {execution.output_data && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FiCheckCircle className="w-5 h-5 text-green-500" />
                            Final Result
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderOutputData(execution.output_data, true)}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                { }
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Execution Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {execution.node_executions?.map((nodeExec, index) => {
                                    const nodeType = getNodeType(nodeExec.node_type)
                                    const Icon = nodeType?.icon

                                    return (
                                        <div
                                            key={nodeExec.id}
                                            onClick={() => setSelectedNode(nodeExec)}
                                            className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedNode?.id === nodeExec.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border/40 hover:bg-muted/20'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    { }
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                                        {index + 1}
                                                    </div>

                                                    { }
                                                    {Icon && nodeType && (
                                                        <div
                                                            className="p-2 rounded-lg"
                                                            style={{
                                                                backgroundColor: `${nodeType.bgColor}20`,
                                                                color: nodeType.color
                                                            }}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                    )}

                                                    { }
                                                    <div className="flex-1">
                                                        <div className="font-medium">{nodeExec.node_label}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {nodeExec.node_type}
                                                        </div>
                                                    </div>

                                                    { }
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(nodeExec.status)}
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDuration(nodeExec.execution_time_ms)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            { }
                                            {nodeExec.error_message && (
                                                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                                    <p className="text-sm text-red-500">{nodeExec.error_message}</p>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                { }
                <div className="lg:col-span-1">
                    <Card className="sticky top-8">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {selectedNode ? 'Node Details' : 'Select a Node'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedNode ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Label</label>
                                        <div className="p-3 bg-muted/30 rounded-lg border border-border/40 text-sm">
                                            {selectedNode.node_label}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Type</label>
                                        <div className="p-3 bg-muted/30 rounded-lg border border-border/40 text-sm">
                                            {selectedNode.node_type}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Status</label>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(selectedNode.status)}
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                    selectedNode.status
                                                )}`}
                                            >
                                                {selectedNode.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Execution Time</label>
                                        <div className="p-3 bg-muted/30 rounded-lg border border-border/40 text-sm">
                                            {formatDuration(selectedNode.execution_time_ms)}
                                        </div>
                                    </div>

                                    {selectedNode.input_data && Object.keys(selectedNode.input_data).length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Input Data</label>
                                            <pre className="text-xs overflow-auto max-h-40 p-3 bg-muted/30 rounded-lg border border-border/40">
                                                {JSON.stringify(selectedNode.input_data, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {selectedNode.output_data && Object.keys(selectedNode.output_data).length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Output Data</label>
                                            {renderOutputData(selectedNode.output_data)}
                                        </div>
                                    )}

                                    {selectedNode.error_message && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-red-500">
                                                Error
                                            </label>
                                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
                                                {selectedNode.error_message}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Click on a node in the timeline to view its details
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
