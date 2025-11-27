'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { fetchAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { FiX, FiCheck, FiGrid, FiLayers, FiBox, FiRefreshCw } from 'react-icons/fi'
import * as FiIcons from 'react-icons/fi'
import * as SiIcons from 'react-icons/si'
import * as MdIcons from 'react-icons/md'
import { useNodeTypes } from '@/lib/context/node-types-context'

interface Template {
    id: string
    name: string
    description: string
    category: string
    icon: string
    template_data?: any
    usage_count: number
}

interface TemplateSelectorProps {
    onSelect: (templateData: any) => void
    onClose: () => void
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
    const { getNodeType } = useNodeTypes()
    // const [activeTab, setActiveTab] = useState<'n8n' | 'standard'>('n8n')
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        try {
            setLoading(true)
            console.log('Loading templates from API...')
            const data = await fetchAPI('/templates/')
            console.log('Templates loaded:', data)
            setTemplates(data)

            if (data.length === 0) {
                // toast.error('No templates found. Please seed templates first.')
            }
        } catch (e: any) {
            console.error('Failed to load templates:', e)
            toast.error('Failed to load templates: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = async () => {
        if (!selectedId) return

        try {
            const template = await fetchAPI(`/templates/${selectedId}`)
            console.log('Template received:', template)

            // Enrich nodes with node type definition
            const enrichedNodes = (template.template_data?.nodes || []).map((node: any) => {
                // Get the node type ID from the template node
                // In template, 'type' is at root level (e.g. "type": "trigger-webhook")
                const nodeTypeId = node.type
                const nodeType = getNodeType(nodeTypeId)

                if (!nodeType) {
                    console.warn(`Node type not found: ${nodeTypeId}`)
                    return node
                }

                // Reconstruct node data
                // We ONLY keep 'config' from the template, everything else comes from the standard Node Type
                return {
                    ...node,
                    data: {
                        // CRITICAL: CustomNode needs data.type to lookup the node definition
                        type: nodeTypeId,

                        // Use standard label from Node Type (unless template overrides it specifically, but usually we want standard)
                        label: nodeType.label,

                        // Keep config from template (this is the only unique thing about a template node)
                        config: node.data?.config || {},

                        // No need to manually copy icon/color/description here because CustomNode 
                        // will look them up from NodeTypesContext using data.type
                    }
                }
            })

            // Extract nodes and edges from template_data
            const templateData = {
                id: template.id,
                name: template.name,
                description: template.description,
                category: template.category,
                icon: template.icon,
                nodes: enrichedNodes,
                edges: template.template_data?.edges || []
            }

            console.log('Enriched template data:', templateData)

            // Ensure data is properly formatted
            if (!templateData.nodes || !Array.isArray(templateData.nodes)) {
                throw new Error('Invalid template data: missing nodes')
            }

            onSelect(templateData)
            toast.success('Template loaded! Redirecting...')
        } catch (e: any) {
            console.error('Template load error:', e)
            toast.error('Failed to load template: ' + e.message)
        }
    }

    const handleUpdateTemplates = async () => {
        const confirmed = window.confirm(
            'This will delete all existing public templates and re-create them from code.\n\n' +
            'Are you sure you want to update all templates?'
        )
        if (!confirmed) return

        try {
            const result = await fetchAPI('/templates/reseed', { method: 'POST' })
            toast.success(`Updated! Deleted ${result.deleted}, Created ${result.created} templates`)
            loadTemplates()
        } catch (e: any) {
            toast.error('Failed to update: ' + e.message)
        }
    }

    const getIconComponent = (iconName: string) => {
        const iconMap: Record<string, any> = {
            ...FiIcons,
            ...SiIcons,
            ...MdIcons
        }
        return iconMap[iconName] || FiIcons.FiCircle
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-card text-card-foreground rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between shrink-0 bg-muted/10">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Workflow Templates</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Choose a pre-built template to jumpstart your workflow
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-muted/5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                            <p>Loading templates...</p>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                <FiGrid className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                                It looks like there are no templates available yet. Seed the default templates to get started.
                            </p>
                            <Button
                                onClick={async () => {
                                    try {
                                        await fetchAPI('/templates/seed', { method: 'POST' })
                                        toast.success('Templates seeded!')
                                        loadTemplates()
                                    } catch (e: any) {
                                        toast.error('Failed to seed: ' + e.message)
                                    }
                                }}
                            >
                                Seed Default Templates
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Update Templates Button */}
                            <div className="mb-6 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleUpdateTemplates}
                                    className="text-muted-foreground hover:text-primary hover:bg-primary/5"
                                >
                                    <FiRefreshCw className="w-3.5 h-3.5 mr-2" />
                                    Refresh Templates
                                </Button>
                            </div>

                            {/* Templates Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {templates.map((template: any) => (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedId(template.id)}
                                        className={`group text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${selectedId === template.id
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                            : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${selectedId === template.id
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                                }`}>
                                                {(() => {
                                                    const Icon = getIconComponent(template.icon || 'FiCircle')
                                                    return <Icon className="w-6 h-6" />
                                                })()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <h3 className="font-semibold truncate pr-2">{template.name}</h3>
                                                    {selectedId === template.id && (
                                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 animate-in zoom-in duration-200">
                                                            <FiCheck className="w-3 h-3 text-primary-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {template.description}
                                                </p>
                                                {template.usage_count > 0 && (
                                                    <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                        Popular choice
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border flex items-center justify-between shrink-0 bg-muted/10">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-muted">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSelect}
                        disabled={!selectedId}
                        className="px-8 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                    >
                        Use Template
                    </Button>
                </div>
            </div>
        </div>
    )
}
