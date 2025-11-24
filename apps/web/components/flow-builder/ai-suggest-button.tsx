import { Button } from '@wataomi/ui'
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
            className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border-indigo-500/20 text-indigo-500"
        >
            <MdAutoAwesome className={`w-4 h-4 mr-2 ${isLoading ? 'animate-pulse' : ''}`} />
            {isLoading ? 'Thinking...' : 'AI Suggest'}
        </Button>
    )
}
