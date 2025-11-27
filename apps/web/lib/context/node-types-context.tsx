'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { NodeTypeAPI, NodeCategory, fetchNodeTypes, fetchNodeCategories } from '@/lib/api/nodeTypes'
import { NodeType } from '@/lib/nodeTypes'
import * as FiIcons from 'react-icons/fi'
import * as SiIcons from 'react-icons/si'
import * as MdIcons from 'react-icons/md'

interface NodeTypesContextType {
    nodeTypes: NodeType[]
    categories: NodeCategory[]
    loading: boolean
    error: string | null
    getNodeType: (id: string) => NodeType | undefined
    getNodesByCategory: (category: string) => NodeType[]
    refreshNodeTypes: () => Promise<void>
}

const NodeTypesContext = createContext<NodeTypesContextType | undefined>(undefined)

// Icon mapping helper
const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
        ...FiIcons,
        ...SiIcons,
        ...MdIcons
    }

    // Direct lookup since backend now sends exact component names (e.g. "FiZap", "SiWhatsapp")
    return iconMap[iconName] || FiIcons.FiCircle
}

// Convert API type to internal type
const mapApiToNodeType = (apiNode: NodeTypeAPI): NodeType => {
    return {
        id: apiNode.id,
        label: apiNode.label,
        category: apiNode.category as any,
        icon: getIconComponent(apiNode.icon),
        color: apiNode.color,
        bgColor: apiNode.color,
        borderColor: apiNode.color,
        description: apiNode.description,
        isPremium: apiNode.isPremium || false,
        properties: apiNode.properties // Preserve properties from backend
    }
}

export function NodeTypesProvider({ children }: { children: ReactNode }) {
    const [nodeTypes, setNodeTypes] = useState<NodeType[]>([])
    const [categories, setCategories] = useState<NodeCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadData = async () => {
        try {
            setLoading(true)
            const [typesData, categoriesData] = await Promise.all([
                fetchNodeTypes(),
                fetchNodeCategories()
            ])

            const mappedTypes = typesData.map(mapApiToNodeType)
            setNodeTypes(mappedTypes)
            setCategories(categoriesData)
            setError(null)
        } catch (err: any) {
            console.error('Failed to load node types:', err)
            setError(err.message || 'Failed to load node types')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const getNodeType = (id: string) => {
        return nodeTypes.find(type => type.id === id)
    }

    const getNodesByCategory = (category: string) => {
        return nodeTypes.filter(type => type.category === category)
    }

    return (
        <NodeTypesContext.Provider value={{
            nodeTypes,
            categories,
            loading,
            error,
            getNodeType,
            getNodesByCategory,
            refreshNodeTypes: loadData
        }}>
            {children}
        </NodeTypesContext.Provider>
    )
}

export function useNodeTypes() {
    const context = useContext(NodeTypesContext)
    if (context === undefined) {
        throw new Error('useNodeTypes must be used within a NodeTypesProvider')
    }
    return context
}
