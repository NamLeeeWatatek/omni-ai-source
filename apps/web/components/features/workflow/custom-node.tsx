import React, { memo, useEffect } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { useNodeTypes } from '@/lib/context/node-types-context'
import { FiLoader, FiCheck, FiX } from 'react-icons/fi'

const CustomNodeComponent = ({ data, selected }: NodeProps) => {
    const { getNodeType, loading, nodeTypes } = useNodeTypes()
    const nodeType = getNodeType(data.type)
    const Icon = nodeType?.icon
    
    // Execution status from data
    const executionStatus = data.executionStatus // 'idle' | 'running' | 'success' | 'error'
    const executionError = data.executionError

    // Show loading state
    if (loading) {
        return (
            <div className="px-4 py-2 shadow-md rounded-md bg-card border-2 border-border min-w-[150px]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                    </div>
                </div>
                <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-muted-foreground" />
                <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-muted-foreground" />
            </div>
        )
    }

    // Determine border color based on execution status
    const getBorderColor = () => {
        if (selected) return 'border-primary'
        if (executionStatus === 'running') return 'border-blue-500 animate-pulse'
        if (executionStatus === 'success') return 'border-green-500'
        if (executionStatus === 'error') return 'border-red-500'
        return 'border-border'
    }

    return (
        <div
            className={`px-4 py-2 shadow-md rounded-md bg-card border-2 min-w-[150px] transition-colors relative ${getBorderColor()}`}
        >
            {/* Execution Status Badge */}
            {executionStatus && executionStatus !== 'idle' && (
                <div className="absolute -top-2 -right-2 z-10">
                    {executionStatus === 'running' && (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                            <FiLoader className="w-4 h-4 text-white animate-spin" />
                        </div>
                    )}
                    {executionStatus === 'success' && (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                            <FiCheck className="w-4 h-4 text-white" />
                        </div>
                    )}
                    {executionStatus === 'error' && (
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                            <FiX className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className={`rounded-full w-8 h-8 flex justify-center items-center ${nodeType?.color ? '' : 'bg-muted'
                    }`} style={{ backgroundColor: nodeType?.color ? `${nodeType.color}20` : undefined }}>
                    {Icon && <Icon className="w-5 h-5" style={{ color: nodeType?.color }} />}
                    {!Icon && <span className="text-xs">?</span>}
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-foreground">
                        {data.label || nodeType?.label || 'Node'}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {executionStatus === 'running' ? 'Executing...' : 
                         executionStatus === 'error' && executionError ? executionError :
                         nodeType?.description || data.type}
                    </div>
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 !bg-muted-foreground"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 !bg-muted-foreground"
            />
        </div>
    )
}

export default memo(CustomNodeComponent)
