import { useState } from 'react'
import { Button } from '@wataomi/ui'
import { FiFilter, FiCalendar, FiChevronDown, FiX } from 'react-icons/fi'

export interface FilterState {
    status: string[]
    tags: string[]
    dateRange: { from: Date | null; to: Date | null }
    sortBy: string
}

interface FilterBarProps {
    onFilterChange?: (filters: FilterState) => void
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className={`gap-2 ${isOpen ? 'border-primary text-primary bg-primary/5' : ''}`}
            >
                <FiFilter className="w-4 h-4" />
                Filters
                {isOpen ? <FiX className="w-3 h-3 ml-1" /> : <FiChevronDown className="w-3 h-3 ml-1" />}
            </Button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 glass p-4 rounded-xl border border-border/40 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {['Published', 'Draft', 'Archived'].map(status => (
                                    <button
                                        key={status}
                                        className="px-3 py-1 rounded-full text-xs border border-border/40 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Date Range</label>
                            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border/40 text-sm hover:bg-accent transition-colors">
                                <span className="text-muted-foreground">Select dates...</span>
                                <FiCalendar className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="pt-2 border-t border-border/40 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                                Reset
                            </Button>
                            <Button size="sm" onClick={() => {
                                if (onFilterChange) {
                                    onFilterChange({
                                        status: [],
                                        tags: [],
                                        dateRange: { from: null, to: null },
                                        sortBy: 'newest'
                                    })
                                }
                                setIsOpen(false)
                            }}>
                                Apply
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
