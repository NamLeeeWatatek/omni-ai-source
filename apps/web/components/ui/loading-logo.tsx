import { MdAutoAwesome } from 'react-icons/md'

interface LoadingLogoProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingLogo({ size = 'md', text }: LoadingLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {}
        <div className={`${sizeClasses[size]} rounded-full border-2 border-primary/20 border-t-primary animate-spin`} />
        
        {}
        <div className="absolute inset-0 flex items-center justify-center">
          <MdAutoAwesome className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} text-primary animate-pulse`} />
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
