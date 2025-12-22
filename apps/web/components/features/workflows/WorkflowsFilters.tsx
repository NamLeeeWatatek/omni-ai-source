'use client'

import { FiSearch } from 'react-icons/fi'
import { Input } from '@/components/ui/Input'
import { useWorkflowsData } from '@/lib/hooks/useWorkflows/useWorkflowsData'

interface WorkflowsFiltersProps {
    className?: string
}

export function WorkflowsFilters({ className }: WorkflowsFiltersProps) {
    const { searchValue, setSearchValue, updateFilters, filters } = useWorkflowsData()

    const handleSearchChange = (value: string) => {
        setSearchValue(value)
        updateFilters({ search: value })
    }

    return (
        <div className={className}>
            <div className="relative flex-1 max-w-md group">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                    placeholder="Search workflows..."
                    className="pl-9"
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
            </div>
        </div>
    )
}

interface WorkflowsStatusFilterProps {
    className?: string
}

export function WorkflowsStatusFilter({ className }: WorkflowsStatusFilterProps) {
    const { updateFilters, filters } = useWorkflowsData()

    const statusOptions = [
        { value: 'all', label: 'All' },
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'archived', label: 'Archived' },
    ] as const

    return (
        <div className={`bg-muted/50 p-1.5 rounded-xl flex items-center gap-1 border border-border/40 shadow-inner ${className}`}>
            {statusOptions.map((status) => (
                <button
                    key={status.value}
                    onClick={() => updateFilters({ status: status.value })}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                        filters.status === status.value
                            ? 'bg-background text-primary shadow-sm border border-border/20 translate-y-0'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                >
                    {status.label}
                </button>
            ))}
        </div>
    )
}

interface WorkflowsViewToggleProps {
    viewMode: 'grid' | 'list'
    onViewModeChange: (mode: 'grid' | 'list') => void
    className?: string
}

export function WorkflowsViewToggle({ viewMode, onViewModeChange, className }: WorkflowsViewToggleProps) {
    return (
        <div className={`bg-muted/50 p-1.5 rounded-xl flex items-center shadow-inner border border-border/40 ${className}`}>
            <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                        ? 'bg-background text-primary shadow-sm border border-border/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
                title="Grid View"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            </button>
            <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                        ? 'bg-background text-primary shadow-sm border border-border/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
                title="List View"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
            </button>
        </div>
    )
}
