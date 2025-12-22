'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import toast from '@/lib/toast'
import type { Flow } from '@/lib/types/flow'
import {
    FiMoreVertical,
    FiPlay,
    FiClock,
    FiGitBranch,
    FiEdit,
    FiCopy,
    FiArchive,
    FiTrash2,
    FiActivity,
    FiZap
} from 'react-icons/fi'
import { useAppDispatch } from '@/lib/store/hooks'
import { duplicateFlow, archiveFlow, deleteFlow, updateFlow } from '@/lib/store/slices/flowsSlice'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'
import { Badge } from '@/components/ui/Badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'

interface WorkflowCardProps {
    workflow: Flow
    onUpdate?: () => void
    onRun?: (workflow: any) => void
}

export function WorkflowCard({ workflow, onUpdate, onRun }: WorkflowCardProps) {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    // Access stats safely
    const stats = workflow.stats || { executions: 0, successRate: 0 }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'published': return 'text-success bg-success/10 border-success/20 shadow-[0_0_15px_-3px_rgba(34,197,94,0.2)]'
            case 'draft': return 'text-warning bg-warning/10 border-warning/20 shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]'
            case 'archived': return 'text-muted-foreground bg-muted border-border'
            default: return 'text-primary bg-primary/10 border-primary/20 transition-all'
        }
    }

    const handleEdit = () => {
        router.push(`/flows/${workflow.id}?mode=edit`)
    }

    const handleDuplicate = async () => {
        try {
            const dup = await dispatch(duplicateFlow(workflow.id.toString())).unwrap()
            toast.success('Flow duplicated successfully!')
            router.push(`/flows/${dup.id}?mode=edit`)
        } catch {
            toast.error('Failed to duplicate flow')
        }
    }

    const handleArchiveToggle = async () => {
        try {
            if (workflow.status === 'archived') {
                await dispatch(updateFlow({ id: workflow.id, data: { status: 'draft' } })).unwrap()
                toast.success('Flow restored from archive')
            } else {
                await dispatch(archiveFlow(workflow.id.toString())).unwrap()
                toast.success('Flow archived successfully')
            }
            onUpdate?.()
        } catch {
            toast.error('Operation failed')
        }
    }

    const confirmDelete = async () => {
        try {
            await dispatch(deleteFlow(workflow.id.toString())).unwrap()
            toast.success('Workflow deleted permanently')
            onUpdate?.()
        } catch {
            toast.error('Failed to delete workflow')
        }
    }

    return (
        <div className="group relative glass hover:border-primary/50 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col h-full bg-card/40 backdrop-blur-xl">
            {/* Top decorative gradient bar */}
            <div className={`h-1.5 w-full ${workflow.status === 'published' ? 'bg-success' : workflow.status === 'draft' ? 'bg-warning' : 'bg-muted-foreground/30'}`} />

            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${getStatusStyles(workflow.status)} group-hover:scale-110 transition-transform duration-300`}>
                            <FiZap className="w-5 h-5 fill-current" />
                        </div>
                        <Badge variant={workflow.status === 'published' ? 'success' : workflow.status === 'draft' ? 'warning' : 'outline'} className="capitalize font-bold text-[10px] tracking-widest bg-opacity-50">
                            {workflow.status}
                        </Badge>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <FiMoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 glass p-1">
                            <DropdownMenuItem onClick={handleEdit} className="gap-2 focus:bg-primary/10">
                                <FiEdit className="w-4 h-4" />
                                <span>Edit Schema</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDuplicate} className="gap-2 focus:bg-primary/10">
                                <FiCopy className="w-4 h-4" />
                                <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleArchiveToggle} className="gap-2 focus:bg-primary/10">
                                <FiArchive className="w-4 h-4" />
                                <span>{workflow.status === 'archived' ? 'Restore' : 'Archive'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/40" />
                            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="gap-2 text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                <FiTrash2 className="w-4 h-4" />
                                <span>Delete Permanently</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mb-6 flex-1">
                    <Link href={`/flows/${workflow.id}`} className="block group/title">
                        <h3 className="font-bold text-xl leading-tight mb-2 group-hover/title:text-primary transition-colors line-clamp-1">
                            {workflow.name}
                        </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2 h-10 leading-relaxed font-medium opacity-80">
                        {workflow.description || 'Initialize your automation with this custom engine.'}
                    </p>
                </div>

                {/* Stats Matrix */}
                <div className="grid grid-cols-2 gap-px bg-border/20 rounded-xl overflow-hidden mb-6 border border-border/10">
                    <div className="bg-muted/20 p-3 text-center transition-colors hover:bg-muted/30">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Processings</p>
                        <div className="flex items-center justify-center gap-1.5">
                            <FiActivity className="w-3.5 h-3.5 text-primary" />
                            <span className="font-bold text-base">{stats.executions || 0}</span>
                        </div>
                    </div>
                    <div className="bg-muted/20 p-3 text-center transition-colors hover:bg-muted/30 border-l border-border/20">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Health Rate</p>
                        <div className="flex items-center justify-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="font-bold text-base text-success">{stats.successRate || 100}%</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <div className="flex items-center text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                        <FiClock className="w-3.5 h-3.5 mr-1.5" />
                        <span>v{workflow.version || 1}.0 • {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Live Now'}</span>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-stripe-gradient h-9 rounded-lg font-bold shadow-lg shadow-primary/10 border-none transition-transform hover:scale-105 active:scale-95"
                            onClick={() => onRun?.(workflow)}
                        >
                            <FiPlay className="w-3.5 h-3.5 mr-2 fill-current" />
                            Launch
                        </Button>
                    </div>
                </div>
            </div>

            <AlertDialogConfirm
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title={`Eliminate Workflow Engine?`}
                description={`This action will permanently delete "${workflow.name}" and all historical analytical data. This cannot be undone.`}
                confirmText="Terminate Engine"
                cancelText="Keep Design"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    )
}
