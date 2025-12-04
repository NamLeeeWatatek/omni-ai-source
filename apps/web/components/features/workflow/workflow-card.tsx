'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import toast from '@/lib/toast'
import {
    FiMoreVertical,
    FiPlay,
    FiClock,
    FiGitBranch,
    FiEdit,
    FiCopy,
    FiArchive,
    FiTrash2
} from 'react-icons/fi'
import { useAppDispatch } from '@/lib/store/hooks'
import { duplicateFlow, archiveFlow, deleteFlow } from '@/lib/store/slices/flowsSlice'

interface WorkflowCardProps {
    workflow: {
        id: number
        name: string
        description?: string
        status: string
        updated_at?: string
        version?: number
        executions?: number
        successRate?: number
    }
    onUpdate?: () => void
    onRun?: (workflow: any) => void
}

export function WorkflowCard({ workflow, onUpdate, onRun }: WorkflowCardProps) {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'text-green-500 bg-green-500/10 border-green-500/20'
            case 'draft': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
            case 'archived': return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
        }
    }

    const handleEdit = () => {
        router.push(`/flows/${workflow.id}/edit`)
    }

    const handleDuplicate = async () => {
        setIsDropdownOpen(false)
        try {
            const dup = await dispatch(duplicateFlow(workflow.id)).unwrap()
            toast.success('Flow duplicated!')
            router.push(`/flows/${dup.id}/edit`)
        } catch {
            toast.error('Failed to duplicate flow')
        }
    }

    const handleArchive = async () => {
        setIsDropdownOpen(false)
        try {
            await dispatch(archiveFlow(workflow.id)).unwrap()
            toast.success('Flow archived!')
            onUpdate?.()
        } catch {
            toast.error('Failed to archive flow')
        }
    }

    const handleDelete = () => {
        setIsDropdownOpen(false)
        setShowDeleteDialog(true)
    }

    const confirmDelete = async () => {
        try {
            await dispatch(deleteFlow(workflow.id)).unwrap()
            toast.success('Flow deleted!')
            onUpdate?.()
        } catch {
            toast.error('Failed to delete flow')
        }
    }

    return (
        <div className="glass p-5 rounded-xl hover:border-primary/50 transition-all group relative">
            <div className="flex justify-between items-start mb-4">
                <Link href={`/flows/${workflow.id}`} className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getStatusColor(workflow.status)}`}>
                        <FiGitBranch className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg leading-none mb-1 group-hover:text-primary transition-colors">
                            {workflow.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                            {workflow.description || 'No description'}
                        </p>
                    </div>
                </Link>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                        {workflow.status}
                    </span>

                    {}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsDropdownOpen(!isDropdownOpen)
                            }}
                        >
                            <FiMoreVertical className="w-4 h-4" />
                        </Button>

                        {isDropdownOpen && (
                            <>
                                {}
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsDropdownOpen(false)}
                                />

                                {}
                                <div className="absolute right-0 mt-2 w-48 glass rounded-lg shadow-lg border border-border/40 z-20 overflow-hidden">
                                    <button
                                        onClick={handleEdit}
                                        className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-2 transition-colors"
                                    >
                                        <FiEdit className="w-4 h-4" />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={handleDuplicate}
                                        className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-2 transition-colors"
                                    >
                                        <FiCopy className="w-4 h-4" />
                                        <span>Duplicate</span>
                                    </button>
                                    <button
                                        onClick={handleArchive}
                                        className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-2 transition-colors"
                                    >
                                        <FiArchive className="w-4 h-4" />
                                        <span>Archive</span>
                                    </button>
                                    <div className="border-t border-border/40" />
                                    <button
                                        onClick={handleDelete}
                                        className="w-full px-4 py-2 text-left hover:bg-red-500/10 text-red-500 flex items-center gap-2 transition-colors"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border/40 mb-4">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Executions</p>
                    <p className="font-semibold">{workflow.executions || 0}</p>
                </div>
                <div className="text-center border-l border-r border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                    <p className="font-semibold text-green-500">{workflow.successRate || 0}%</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Version</p>
                    <p className="font-semibold">v{workflow.version || 1}</p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                    <FiClock className="w-3 h-3 mr-1" />
                    <span>{workflow.updated_at ? new Date(workflow.updated_at).toLocaleDateString() : 'Just now'}</span>
                </div>
                <div className="flex gap-2">
                    <Link href={`/flows/${workflow.id}/edit`}>
                        <Button variant="outline" size="sm">
                            Edit
                        </Button>
                    </Link>
                    <Button size="sm" onClick={() => onRun?.(workflow)}>
                        <FiPlay className="w-3 h-3 mr-1" />
                        Run
                    </Button>
                </div>
            </div>

            {}
            <AlertDialogConfirm
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title={`Delete "${workflow.name}"?`}
                description="This workflow will be permanently deleted. This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    )
}
