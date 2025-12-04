'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { useAppSelector } from '@/lib/store/hooks'
import { FiLoader, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi'
import { getNodeIcon } from '@/lib/utils/icon-resolver'
import { getIconStyle, getNodeClassName } from '@/lib/utils/workflow-theme'

const CustomNodeComponent = ({ data, selected }: NodeProps) => {
    const { items: nodeTypes = [] } = useAppSelector((state: any) => state.nodeTypes || {})

    const getNodeType = (typeId: string) => {
        return nodeTypes.find((nt: any) => nt.id === typeId)
    }

    const nodeType = getNodeType(data.type)
    const Icon = getNodeIcon(nodeType)

    const executionStatus = data.executionStatus
    const executionError = data.executionError

    const nodeClassName = getNodeClassName({ selected, executionStatus })
    const iconStyle = getIconStyle(nodeType?.color)

    return (
        <div className="relative">
            {}
            {executionStatus === 'running' && (
                <>
                    <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                        <div
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(90deg, transparent, transparent, #3b82f6, transparent, transparent)',
                                backgroundSize: '200% 200%',
                                animation: 'borderRotate 3s linear infinite',
                            }}
                        />
                    </div>
                    <style jsx>{`
                        @keyframes borderRotate {
                            0% { background-position: 0% 0%; }
                            25% { background-position: 100% 0%; }
                            50% { background-position: 100% 100%; }
                            75% { background-position: 0% 100%; }
                            100% { background-position: 0% 0%; }
                        }
                    `}</style>
                </>
            )}

            <div className={nodeClassName} style={{ position: 'relative', zIndex: 1 }}>
                {}
                {executionStatus && executionStatus !== 'idle' && (
                    <div className="absolute -top-2 -right-2 z-20">
                        {executionStatus === 'running' && (
                            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
                                <FiLoader className="w-4 h-4 text-white animate-spin" />
                            </div>
                        )}
                        {executionStatus === 'success' && (
                            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg ring-2 ring-green-500/20">
                                <FiCheck className="w-4 h-4 text-white" />
                            </div>
                        )}
                        {executionStatus === 'error' && (
                            <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-lg ring-2 ring-red-500/20">
                                <FiX className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </div>
                )}

                {}
                <div className="p-4">
                    {}
                    <div className="flex items-center gap-3 mb-2">
                        {}
                        <div
                            className="rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0"
                            style={iconStyle}
                        >
                            {Icon ? (
                                <Icon
                                    className="w-5 h-5"
                                    style={{ color: nodeType?.color || 'currentColor' }}
                                />
                            ) : (
                                <FiAlertCircle className="w-5 h-5 text-muted-foreground" />
                            )}
                        </div>

                        {}
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">
                                {data.label || nodeType?.label || 'Unknown Node'}
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="text-xs text-muted-foreground mt-2 px-1">
                        {executionStatus === 'running' ? (
                            <span className="text-blue-500 font-medium">Executing...</span>
                        ) : executionStatus === 'error' && executionError ? (
                            <span className="text-red-500 font-medium flex items-center gap-1">
                                <FiX className="w-3 h-3" />
                                {executionError}
                            </span>
                        ) : executionStatus === 'success' ? (
                            <span className="text-green-500 font-medium flex items-center gap-1">
                                <FiCheck className="w-3 h-3" />
                                Completed
                            </span>
                        ) : (
                            <span className="truncate block">
                                {nodeType?.description || data.type || 'Custom node'}
                            </span>
                        )}
                    </div>

                    {}
                    {data.customLabel && (
                        <div className="mt-2 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground truncate">
                            {data.customLabel}
                        </div>
                    )}

                    {}
                    {data.config && (() => {
                        const imageFields = Object.entries(data.config).filter(([_, value]) => {
                            if (typeof value === 'string') {
                                return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value) || value.includes('cloudinary')
                            }
                            if (Array.isArray(value)) {
                                return value.some(v => typeof v === 'string' && (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(v) || v.includes('cloudinary')))
                            }
                            return false
                        })

                        if (imageFields.length === 0) return null

                        const [_, imageValue] = imageFields[0]
                        const imageUrls = Array.isArray(imageValue) ? imageValue : [imageValue]
                        const displayUrls = imageUrls.slice(0, 3)

                        return (
                            <div className="mt-2 space-y-1">
                                {displayUrls.length === 1 ? (
                                    <div className="relative rounded overflow-hidden border border-border/40 bg-muted/20">
                                        <img
                                            src={displayUrls[0]}
                                            alt="Preview"
                                            className="w-full h-20 object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-1">
                                        {displayUrls.map((url, idx) => (
                                            <div key={idx} className="relative rounded overflow-hidden border border-border/40 bg-muted/20 aspect-square">
                                                <img
                                                    src={url}
                                                    alt={`Preview ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none'
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {imageUrls.length > 3 && (
                                    <div className="text-xs text-muted-foreground text-center">
                                        +{imageUrls.length - 3} more
                                    </div>
                                )}
                            </div>
                        )
                    })()}
                </div>

                {}
                <Handle
                    type="target"
                    position={Position.Left}
                    className="w-3 h-3 !bg-primary border-2 border-background transition-transform hover:scale-125"
                    style={{ left: -6 }}
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    className="w-3 h-3 !bg-primary border-2 border-background transition-transform hover:scale-125"
                    style={{ right: -6 }}
                />
            </div>
        </div>
    )
}

export default memo(CustomNodeComponent)
