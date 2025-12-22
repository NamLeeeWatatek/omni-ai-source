'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/DataTable'
import {
    FiDownload,
    FiImage,
    FiVideo,
    FiFile,
    FiMusic,
    FiFileText,
    FiTrash2,
    FiExternalLink,
    FiAlertTriangle
} from 'react-icons/fi'
import { UGCFactoryService, useAsyncState } from '@/lib/services/api.service'
import { Execution } from '@/lib/types'
import { useAppDispatch } from '@/lib/store/hooks'
import { deleteArtifact } from '@/lib/store/slices/ugcFactorySlice'
import { toast } from '@/lib/toast'
import { NoDataEmptyState, ErrorEmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/LoadingSkeleton'

interface ExecutionArtifact {
    id: string
    execution_id: string
    file_id: string
    artifact_type: 'image' | 'video' | 'audio' | 'document' | 'text' | 'other'
    name: string
    description?: string
    metadata?: Record<string, any>
    size?: number
    mime_type?: string
    download_url: string
    created_at: string
    updated_at: string
}

interface UGCFactoryArtifactsProps {
    flowId: string
    executionId?: string | null
    onStartNew: () => void
}

export function UGCFactoryArtifacts({
    flowId,
    executionId,
    onStartNew
}: UGCFactoryArtifactsProps) {
    const dispatch = useAppDispatch()
    const [artifacts, setArtifacts] = useState<ExecutionArtifact[]>([])
    const [loading, setLoading] = useState(true)
    const [allArtifacts, setAllArtifacts] = useState<ExecutionArtifact[]>([])
    const { execute } = useAsyncState()

    useEffect(() => {
        if (executionId) {
            loadExecutionArtifacts(executionId)
        } else {
            loadAllArtifacts()
        }
    }, [flowId, executionId])

    const loadExecutionArtifacts = async (execId: string) => {
        await execute(
            () => UGCFactoryService.getExecutionArtifacts(execId),
            (data: ExecutionArtifact[]) => {
                setArtifacts(data)
            },
            (err) => {
                console.error('Failed to load execution artifacts:', err)
                setArtifacts([])
            }
        )
    }

    const loadAllArtifacts = async () => {
        await execute(
            async () => {
                // Load all executions for this flow and get their artifacts
                const executions = await UGCFactoryService.getExecutions(flowId, 100)

                const allArtifactsPromises = executions.map(async (execution: Execution) => {
                    try {
                        return await UGCFactoryService.getExecutionArtifacts(String(execution.id))
                    } catch {
                        return []
                    }
                })

                const artifactsArrays = await Promise.all(allArtifactsPromises)
                return artifactsArrays.flat()
            },
            (flattened: ExecutionArtifact[]) => {
                setAllArtifacts(flattened)
                setArtifacts(flattened)
            },
            (err) => {
                console.error('Failed to load all artifacts:', err)
                setAllArtifacts([])
                setArtifacts([])
            }
        )
    }

    const getArtifactIcon = (type: string) => {
        switch (type) {
            case 'image':
                return <FiImage className="w-4 h-4 text-blue-500" />
            case 'video':
                return <FiVideo className="w-4 h-4 text-red-500" />
            case 'audio':
                return <FiMusic className="w-4 h-4 text-purple-500" />
            case 'document':
                return <FiFile className="w-4 h-4 text-green-500" />
            case 'text':
                return <FiFileText className="w-4 h-4 text-gray-500" />
            default:
                return <FiFile className="w-4 h-4 text-gray-500" />
        }
    }

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown'
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
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

    const handleDownload = (artifact: ExecutionArtifact) => {
        if (artifact.download_url) {
            window.open(artifact.download_url, '_blank')
        } else {
            toast.error('Download URL not available')
        }
    }

    const handleDelete = async (artifact: ExecutionArtifact) => {
        if (!confirm('Are you sure you want to delete this artifact?')) return

        try {
            await dispatch(deleteArtifact(artifact.id)).unwrap()
            toast.success('Artifact deleted successfully')

            // Redux will automatically update the state, but we also update local state for immediate UI feedback
            setArtifacts(prev => prev.filter(a => a.id !== artifact.id))
            setAllArtifacts(prev => prev.filter(a => a.id !== artifact.id))
        } catch (err) {
            console.error('Failed to delete artifact:', err)
            toast.error('Failed to delete artifact')
        }
    }

    const renderArtifactPreview = (artifact: ExecutionArtifact) => {
        if (artifact.artifact_type === 'image' && artifact.download_url) {
            return (
                <div className="w-16 h-16 rounded border overflow-hidden bg-muted">
                    <img
                        src={artifact.download_url}
                        alt={artifact.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling!.classList.remove('hidden')
                        }}
                    />
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground hidden">
                        {getArtifactIcon(artifact.artifact_type)}
                    </div>
                </div>
            )
        }

        return (
            <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center">
                {getArtifactIcon(artifact.artifact_type)}
            </div>
        )
    }

    const columns: Column<ExecutionArtifact>[] = [
        {
            key: 'preview',
            label: 'Preview',
            className: 'w-20',
            render: (_, artifact) => renderArtifactPreview(artifact)
        },
        {
            key: 'name',
            label: 'Name',
            render: (_, artifact) => (
                <div>
                    <p className="font-medium">{artifact.name}</p>
                    {artifact.description && (
                        <p className="text-sm text-muted-foreground">
                            {artifact.description}
                        </p>
                    )}
                </div>
            )
        },
        {
            key: 'artifact_type',
            label: 'Type',
            render: (_, artifact) => (
                <div className="flex items-center gap-2">
                    {getArtifactIcon(artifact.artifact_type)}
                    <span className="capitalize">{artifact.artifact_type}</span>
                </div>
            )
        },
        {
            key: 'size',
            label: 'Size',
            render: (_, artifact) => formatFileSize(artifact.size)
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (_, artifact) => formatDate(artifact.created_at)
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'w-32',
            render: (_, artifact) => (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(artifact)}
                        className="h-8 px-2"
                    >
                        <FiDownload className="w-3 h-3" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(artifact)}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                    >
                        <FiTrash2 className="w-3 h-3" />
                    </Button>
                </div>
            )
        }
    ]

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Generated Artifacts</h3>
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                </div>
                <TableSkeleton rows={5} columns={6} />
            </Card>
        )
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Generated Artifacts</h3>
                <Button size="sm" onClick={onStartNew}>
                    Generate New
                </Button>
            </div>

            {artifacts.length === 0 ? (
                <NoDataEmptyState
                    icon={<FiImage className="w-16 h-16" />}
                    title="Chưa có artifacts nào"
                    description="Chạy executions để tạo images, videos và các files khác"
                    onCreate={onStartNew}
                    createLabel="Tạo Artifact đầu tiên"
                />
            ) : (
                <DataTable
                    data={artifacts}
                    columns={columns}
                    loading={loading}
                    emptyMessage="No artifacts found"
                    compact={true}
                />
            )}

            {artifacts.length > 0 && (
                <div className="mt-4 text-sm text-muted-foreground text-center">
                    Showing {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''}
                </div>
            )}
        </Card>
    )
}
