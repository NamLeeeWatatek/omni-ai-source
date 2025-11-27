'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { fetchAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
    FiArchive,
    FiTrash2,
    FiRefreshCw
} from 'react-icons/fi'

interface ArchivedFlow {
    id: number
    name: string
    description: string
    archived_at: string
    status: string
}

export default function ArchivesPage() {
    const [flows, setFlows] = useState<ArchivedFlow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadArchivedFlows()
    }, [])

    const loadArchivedFlows = async () => {
        try {
            setLoading(true)
            const data = await fetchAPI('/flows/')
            const archived = data.filter((f: { status: string }) => f.status === 'archived')
            setFlows(archived)
        } catch {
            toast.error('Failed to load archived workflows')
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async (flowId: number) => {
        const restorePromise = fetchAPI(`/flows/${flowId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'draft' })
        }).then(() => {
            loadArchivedFlows()
        })

        toast.promise(restorePromise, {
            loading: 'Restoring workflow...',
            success: 'Workflow restored!',
            error: 'Failed to restore workflow'
        })
    }

    const handleDelete = async (flowId: number, flowName: string) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <div>
                    <p className="font-semibold">Permanently delete &quot;{flowName}&quot;?</p>
                    <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600"
                        onClick={async () => {
                            toast.dismiss(t.id)
                            const deletePromise = fetchAPI(`/flows/${flowId}`, { method: 'DELETE' })
                                .then(() => {
                                    loadArchivedFlows()
                                })

                            toast.promise(deletePromise, {
                                loading: 'Deleting workflow...',
                                success: 'Workflow deleted permanently!',
                                error: 'Failed to delete workflow'
                            })
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        ), {
            duration: Infinity,
        })
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Archives</h1>
                    <p className="text-muted-foreground">
                        Manage archived workflows
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner className="size-8 text-primary" />
                </div>
            ) : flows.length === 0 ? (
                <Card className="text-center py-20">
                    <FiArchive className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No archived workflows</h3>
                    <p className="text-muted-foreground">
                        Archived workflows will appear here
                    </p>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Archived Date</th>
                                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flows.map((flow) => (
                                <tr key={flow.id} className="border-t border-border/40 hover:bg-muted/20">
                                    <td className="p-4">
                                        <div className="font-medium">{flow.name}</div>
                                        <div className="text-sm text-muted-foreground">{flow.description}</div>
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {flow.archived_at ? new Date(flow.archived_at).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRestore(flow.id)}
                                            >
                                                <FiRefreshCw className="w-4 h-4 mr-2" />
                                                Restore
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => handleDelete(flow.id, flow.name)}
                                            >
                                                <FiTrash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    )
}
