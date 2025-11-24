import { FiCheckCircle, FiXCircle, FiClock, FiCircle } from 'react-icons/fi'

interface TimelineEvent {
    id: string
    status: 'completed' | 'failed' | 'running' | 'pending'
    timestamp: string
    label: string
    description?: string
}

interface ExecutionTimelineProps {
    events: TimelineEvent[]
}

export function ExecutionTimeline({ events }: ExecutionTimelineProps) {
    const getIcon = (status: string) => {
        switch (status) {
            case 'completed': return <FiCheckCircle className="w-4 h-4 text-green-500" />
            case 'failed': return <FiXCircle className="w-4 h-4 text-red-500" />
            case 'running': return <FiClock className="w-4 h-4 text-blue-500 animate-spin" />
            default: return <FiCircle className="w-4 h-4 text-gray-400" />
        }
    }

    return (
        <div className="relative pl-4 border-l border-border/40 space-y-6">
            {events.map((event) => (
                <div key={event.id} className="relative">
                    <div className="absolute -left-[21px] top-1 bg-background p-1 rounded-full">
                        {getIcon(event.status)}
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium">{event.label}</h4>
                            <span className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        {event.description && (
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
