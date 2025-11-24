import { Handle, Position } from 'reactflow'
import { FiPlay, FiMessageSquare, FiZap, FiDatabase, FiUser, FiSettings } from 'react-icons/fi'

const nodeIcons: Record<string, React.ElementType> = {
    start: FiPlay,
    message: FiMessageSquare,
    ai: FiZap,
    database: FiDatabase,
    human: FiUser,
    default: FiSettings
}

interface CustomNodeProps {
    data: {
        label: string
        icon?: string
        description?: string
    }
    type: string
}

export function CustomNode({ data }: CustomNodeProps) {
    const Icon = nodeIcons[data.icon || 'default'] || nodeIcons.default

    return (
        <div className="glass px-4 py-3 rounded-lg border border-border/40 min-w-[150px] shadow-sm hover:shadow-md transition-shadow">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary border-2 border-background" />

            <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-medium">{data.label}</p>
                    {data.description && (
                        <p className="text-[10px] text-muted-foreground">{data.description}</p>
                    )}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary border-2 border-background" />
        </div>
    )
}
