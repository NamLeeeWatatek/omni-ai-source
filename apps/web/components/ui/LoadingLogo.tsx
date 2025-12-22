import { MdAutoAwesome } from 'react-icons/md'
import { cn } from '@/lib/utils'

interface LoadingLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingLogo({ size = 'md', text, className }: LoadingLogoProps) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const textSizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        { }
        <div className={`${sizeClasses[size]} rounded-full border-2 border-primary/20 border-t-primary animate-spin`} />

        { }
        <div className="absolute inset-0 flex items-center justify-center">
          <MdAutoAwesome className={cn(
            "text-primary animate-pulse",
            size === 'xs' ? 'w-2 h-2' :
              size === 'sm' ? 'w-4 h-4' :
                size === 'md' ? 'w-6 h-6' :
                  'w-8 h-8'
          )} />
        </div>
      </div>

      {text && (
        <p className={`${textSizeClasses[size]} text-muted-foreground animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  )
}

