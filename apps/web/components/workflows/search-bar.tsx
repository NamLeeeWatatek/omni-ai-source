import { FiSearch, FiCommand } from 'react-icons/fi'

interface SearchBarProps {
    onSearch: (query: string) => void
    placeholder?: string
}

export function SearchBar({ onSearch, placeholder = 'Search...' }: SearchBarProps) {
    return (
        <div className="relative group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
                type="text"
                placeholder={placeholder}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full glass pl-10 pr-12 py-2 rounded-lg border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/40 bg-muted/20 text-xs text-muted-foreground">
                <FiCommand className="w-3 h-3" />
                <span>K</span>
            </div>
        </div>
    )
}
