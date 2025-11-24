'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
    FiPlus,
    FiGrid,
    FiList,
    FiLoader,
    FiPlay,
    FiMoreVertical
} from 'react-icons/fi'
import { Button } from '@wataomi/ui'
import { WorkflowCard } from '@/components/workflows/workflow-card'
import { SearchBar } from '@/components/workflows/search-bar'
import { FilterBar } from '@/components/workflows/filter-bar'
import { WorkflowStats } from '@/components/workflows/workflow-stats'
import { fetchAPI } from '@/lib/api'

interface Flow {
    id: number
    name: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
    user_id: string
    flow_data: Record<string, unknown>
    status: string
    executions?: number
    successRate?: number
    version?: number
}

interface ApiFlow {
    id: number
    name: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
    user_id: string
    flow_data: Record<string, unknown>
}

export default function WorkflowsPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = useState('')
    const [flows, setFlows] = useState<Flow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadFlows = useCallback(async () => {
        try {
            setLoading(true)
            const data = await fetchAPI('/flows/')
            const mappedData = (data as ApiFlow[]).map((flow) => ({
                ...flow,
                status: flow.is_active ? 'published' : 'draft',
                executions: 0,
                successRate: 0,
                version: 1
            }))
            setFlows(mappedData)
            setError(null)
        } catch (err: unknown) {
            console.error('Failed to load flows:', err)
            setError('Failed to load workflows. Please check your connection.')
            setFlows([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadFlows()
    }, [loadFlows])

    const filteredFlows = flows.filter(flow =>
        flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (flow.description && flow.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Calculate stats
    const stats = {
        total: flows.length,
        active: flows.filter(f => f.status === 'published').length,
        successRate: 0,
        avgDuration: 0
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Workflows</h1>
                    <p className="text-muted-foreground">
                        Manage and monitor your automation workflows
                    </p>
                </div>
                <Link href="/flows/new/edit">
                    <Button>
                        <FiPlus className="w-4 h-4 mr-2" />
                        Create Workflow
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <WorkflowStats stats={stats} />

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <SearchBar onSearch={setSearchQuery} />
                </div>
                <div className="flex items-center gap-2">
                    <FilterBar />
                    <div className="glass p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <FiGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <FiList className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <FiLoader className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="text-center py-20 text-red-500">
                    {error}
                    <Button variant="outline" onClick={loadFlows} className="ml-4">Retry</Button>
                </div>
            ) : filteredFlows.length === 0 ? (
                <div className="text-center py-20 glass rounded-xl">
                    <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery ? 'Try adjusting your search terms' : 'Create your first workflow to get started'}
                    </p>
                    {!searchQuery && (
                        <Link href="/flows/new/edit">
                            <Button>Create Workflow</Button>
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredFlows.map((flow) => (
                                <WorkflowCard key={flow.id} workflow={flow} />
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Last Run</th>
                                        <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFlows.map((flow) => (
                                        <tr key={flow.id} className="border-t border-border/40 hover:bg-muted/20">
                                            <td className="p-4">
                                                <div className="font-medium">{flow.name}</div>
                                                <div className="text-sm text-muted-foreground">{flow.description}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${flow.status === 'published'
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : 'bg-yellow-500/10 text-yellow-500'
                                                    }`}>
                                                    {flow.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {flow.updated_at ? new Date(flow.updated_at).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <FiPlay className="w-4 h-4" />
                                                    </Button>
                                                    <Link href={`/flows/${flow.id}/edit`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <FiMoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
