'use client'

interface ExecutionStatusBadgeProps {
    status: 'running' | 'completed' | 'failed' | 'cancelled'
}

export function ExecutionStatusBadge({ status }: ExecutionStatusBadgeProps) {
    const variants = {
        running: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        completed: 'bg-green-500/10 text-green-500 border-green-500/20',
        failed: 'bg-red-500/10 text-red-500 border-red-500/20',
        cancelled: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }

    const labels = {
        running: 'Running',
        completed: 'Completed',
        failed: 'Failed',
        cancelled: 'Cancelled'
    }

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${variants[status]}`}>
            {status === 'running' && (
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            )}
            {labels[status]}
        </span>
    )
}
