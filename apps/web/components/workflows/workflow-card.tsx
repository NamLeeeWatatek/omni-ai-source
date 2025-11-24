import Link from 'next/link'
import { Button } from '@wataomi/ui'
import {
    FiMoreVertical,
    FiPlay,
    FiClock,
    FiGitBranch
} from 'react-icons/fi'

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
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'text-green-500 bg-green-500/10 border-green-500/20'
            case 'draft': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
            case 'archived': return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
        }
    }

    return (
        <div className="glass p-5 rounded-xl hover:border-primary/50 transition-all group relative">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
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
                </div>
                <div className="flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                        {workflow.status}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                        <FiMoreVertical className="w-4 h-4" />
                    </Button>
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
                    <Button size="sm">
                        <FiPlay className="w-3 h-3 mr-1" />
                        Run
                    </Button>
                </div>
            </div>
        </div>
    )
}
