
'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { FiSave, FiSettings } from 'react-icons/fi'
import toast from '@/lib/toast'
import type { Node } from 'reactflow'
import { useAppSelector } from '@/lib/store/hooks'
import { DynamicFormField } from './dynamic-form-field'

interface NodePropertiesProps {
    node: Node
    onUpdate: (node: Node) => void
}

export const NodeProperties = memo(function NodeProperties({ node, onUpdate }: NodePropertiesProps) {
    const { items: nodeTypes = [] } = useAppSelector((state: any) => state.nodeTypes || {})
    const nodeData = node.data as any
    const [config, setConfig] = useState(nodeData.config || {})
    
    const getNodeType = (typeId: string) => {
        return nodeTypes.find((nt: any) => nt.id === typeId)
    }

    // Use refs to avoid recreating callbacks
    const nodeRef = useRef(node)
    const onUpdateRef = useRef(onUpdate)

    // Update refs when props change
    useEffect(() => {
        nodeRef.current = node
        onUpdateRef.current = onUpdate
    }, [node, onUpdate])

    // Sync config when node ID changes
    useEffect(() => {
        setConfig(nodeData.config || {})
    }, [node.id, nodeData.config])

    const handleUpdate = () => {
        onUpdateRef.current({
            ...nodeRef.current,
            data: {
                ...nodeRef.current.data,
                config
            }
        })
        toast.success('Node configuration saved!')
    }

    // Check if there are unsaved changes
    const hasChanges = () => {
        return JSON.stringify(config) !== JSON.stringify(nodeData.config || {})
    }

    const updateConfig = useCallback((key: string, value: any) => {
        setConfig((prevConfig: any) => {
            // Avoid unnecessary updates if value hasn't changed
            if (prevConfig[key] === value) {
                return prevConfig
            }
            return { ...prevConfig, [key]: value }
        })
    }, [])

    // Render configuration form based on node type properties
    const renderConfigForm = () => {
        const nodeType = nodeData.type
        const nodeTypeInfo = getNodeType(nodeType)

        if (!nodeTypeInfo) {
            return (
                <div className="text-center py-12 flex flex-col items-center justify-center text-muted-foreground/50">
                    <FiSettings className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">Unknown node type: {nodeType}</p>
                </div>
            )
        }

        // If node type has properties definition, use dynamic form rendering
        if (nodeTypeInfo.properties && Array.isArray(nodeTypeInfo.properties) && nodeTypeInfo.properties.length > 0) {
            return (
                <>
                    {nodeTypeInfo.properties.map((property: any) => (
                        <DynamicFormField
                            key={property.name}
                            field={property}
                            value={config[property.name]}
                            onChange={updateConfig}
                            allValues={config}
                        />
                    ))}
                </>
            )
        }

        // Default - no specific config
        return (
            <div className="text-center py-12 flex flex-col items-center justify-center text-muted-foreground/50">
                <FiSettings className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No configuration needed</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-5 p-1 overflow-y-auto">
                {renderConfigForm()}
            </div>

            <div className="mt-4 pt-4 border-t border-border/40 sticky bottom-0 bg-background/95 backdrop-blur pb-1">
                {hasChanges() && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-amber-500 font-medium px-1">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        Unsaved changes
                    </div>
                )}

                <Button onClick={handleUpdate} className="w-full shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all">
                    <FiSave className="w-4 h-4 mr-2" />
                    Save Configuration
                </Button>
            </div>
        </div>
    )
})

export default NodeProperties
