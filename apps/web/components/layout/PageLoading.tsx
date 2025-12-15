
import { LoadingLogo } from '@/components/ui/LoadingLogo'

interface PageLoadingProps {
    message?: string
    className?: string
    minHeight?: string
}

export function PageLoading({
    message = "Loading...",
    className = "",
    minHeight = "min-h-[60vh]"
}: PageLoadingProps) {
    return (
        <div className={`flex w-full items-center justify-center ${minHeight} ${className}`}>
            <LoadingLogo text={message} />
        </div>
    )
}
