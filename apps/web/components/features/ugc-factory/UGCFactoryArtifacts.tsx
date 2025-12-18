'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import axiosClient from '@/lib/axios-client'
import {
    FiDownload,
    FiImage,
    FiVideo,
    FiFile,
    FiMusic,
    FiFileText,
    FiTrash2,
    FiExternalLink
} from 'react-icons/fi'
import { toast } from '@/lib/toast'

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
    const [artifacts, setArtifacts] = useState<ExecutionArtifact[]>([])
    const [loading, setLoading] = useState(true)
    const [allArtifacts, setAllArtifacts] = useState<ExecutionArtifact[]>([])

    useEffect(() => {
        if (executionId) {
            loadExecutionArtifacts(executionId)
        } else {
            loadAllArtifacts()
        }
    }, [flowId, executionId])

    const loadExecutionArtifacts = async (execId: string) => {
        try {
            setLoading(true)
            const data = await axiosClient.get(`/execution-artifacts/?execution_id=${execId}`)
            setArtifacts(data)
        } catch (err) {
            console.error('Failed to load artifacts:', err)
            setArtifacts([])
        } finally {
            setLoading(false)
        }
    }

    const loadAllArtifacts = async () => {
        try {
            setLoading(true)
            // Load all executions for this flow and get their artifacts
            const executions = await axiosClient.get(`/executions/?flow_id=${flowId}&limit=100`)

            const allArtifactsPromises = executions.map(async (execution: any) => {
                try {
                    return await axiosClient.get(`/execution-artifacts/?execution_id=${execution.execution_id}`)
                } catch {
                    return []
                }
            })

            const artifactsArrays = await Promise.all(allArtifactsPromises)
            const flattened = artifactsArrays.flat()
            setAllArtifacts(flattened)
            setArtifacts(flattened)
        } catch (err) {
            console.error('Failed to load artifacts:', err)
            setAllArtifacts([])
            setArtifacts([])
        } finally {
            setLoading(false)
        }
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
            await axiosClient.delete(`/execution-artifacts/${artifact.id}`)
            toast.success('Artifact deleted successfully')

            // Remove from state
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

    if (loading) {
        return (
            <Card className="p-6">
                <div className="text-center text-muted-foreground">
                    Loading artifacts...
                </div>
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
                <div className="text-center py-12 text-muted-foreground">
                    <FiImage className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No artifacts yet</p>
                    <p className="text-sm mb-4">Run executions to generate images, videos, and other files</p>
                    <Button onClick={onStartNew}>
                        Generate First Artifact
                    </Button>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">Preview</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-32">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {artifacts.map((artifact) => (
                                <TableRow key={artifact.id}>
                                    <TableCell>
                                        {renderArtifactPreview(artifact)}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{artifact.name}</p>
                                            {artifact.description && (
                                                <p className="text-sm text-muted-foreground">
                                                    {artifact.description}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getArtifactIcon(artifact.artifact_type)}
                                            <span className="capitalize">{artifact.artifact_type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {formatFileSize(artifact.size)}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(artifact.created_at)}
                                    </TableCell>
                                    <TableCell>
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
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {artifacts.length > 0 && (
                <div className="mt-4 text-sm text-muted-foreground text-center">
                    Showing {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''}
                </div>
            )}
        </Card>
    )
}
