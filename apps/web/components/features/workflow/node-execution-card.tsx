import { useState } from 'react'
import { FiCheckCircle, FiXCircle, FiClock, FiChevronDown, FiChevronRight } from 'react-icons/fi'

interface NodeExecutionCardProps {
    execution: {
        id: string
        nodeLabel: string
        nodeType: string
        status: 'completed' | 'failed' | 'running' | 'pending'
        duration?: number
        startedAt?: string
        input?: Record<string, unknown>
        output?: Record<string, unknown>
        error?: string
    }
}

export function NodeExecutionCard({ execution }: NodeExecutionCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const getStatusIcon = () => {
        switch (execution.status) {
            case 'completed': return <FiCheckCircle className="w-5 h-5 text-green-500" />
            case 'failed': return <FiXCircle className="w-5 h-5 text-red-500" />
            case 'running': return <FiClock className="w-5 h-5 text-blue-500 animate-spin" />
            default: return <FiClock className="w-5 h-5 text-gray-400" />
        }
    }

    return (
        <div className="glass rounded-lg border border-border/40 overflow-hidden">
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {getStatusIcon()}
                    <div>
                        <h4 className="font-medium">{execution.nodeLabel}</h4>
                        <p className="text-xs text-muted-foreground">{execution.nodeType}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {execution.duration && (
                        <span className="text-xs text-muted-foreground">{execution.duration}ms</span>
                    )}
                    {isExpanded ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-border/40 bg-muted/10 space-y-4">
                    {execution.error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            <p className="font-semibold mb-1">Error</p>
                            {execution.error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Input</h5>
                            <pre className="text-xs bg-black/20 p-3 rounded-lg overflow-auto max-h-40">
                                {JSON.stringify(execution.input, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Output</h5>
                            <pre className="text-xs bg-black/20 p-3 rounded-lg overflow-auto max-h-40">
                                {JSON.stringify(execution.output, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
