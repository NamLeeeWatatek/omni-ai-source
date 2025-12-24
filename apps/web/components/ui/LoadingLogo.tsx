'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedDots } from './AnimatedDots'

interface LoadingLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  showGlow?: boolean
}

export function LoadingLogo({
  size = 'md',
  text,
  className,
  showGlow = true
}: LoadingLogoProps) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28'
  }

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14'
  }

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative group">
        {/* Glow effect */}
        {showGlow && (
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
        )}

        {/* Spinner with gradient border */}
        <div className="relative">
          <div className={cn(
            sizeClasses[size],
            'rounded-full bg-gradient-to-tr from-primary via-primary/80 to-primary/60',
            'p-[2px] animate-spin'
          )}>
            <div className="w-full h-full rounded-full bg-background/95 backdrop-blur-sm" />
          </div>

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className={cn(
              iconSizes[size],
              "text-primary animate-pulse"
            )} />
          </div>
        </div>
      </div>

      {text && (
        <p className={cn(
          textSizeClasses[size],
          'text-muted-foreground font-medium flex items-center'
        )} suppressHydrationWarning>
          {text}
          <AnimatedDots className="opacity-70" />
        </p>
      )}
    </div>
  )
}


