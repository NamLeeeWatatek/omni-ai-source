import { Button } from '@/components/ui/button'
import { MdAutoAwesome } from 'react-icons/md'

interface AISuggestButtonProps {
    onClick: () => void
    isLoading?: boolean
}

export function AISuggestButton({ onClick, isLoading }: AISuggestButtonProps) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            disabled={isLoading}
            className="bg-slate-700/50 hover:bg-slate-700/50 border-slate-600/30 text-slate-300"
        >
            <MdAutoAwesome className={`w-4 h-4 mr-2 ${isLoading ? 'animate-pulse' : ''}`} />
            {isLoading ? 'Thinking...' : 'AI Suggest'}
        </Button>
    )
}
