'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface AnimatedDotsProps {
    className?: string
}

/**
 * A component that renders three dots with a bounce animation.
 * Used to replace static "..." in loading/redirecting strings.
 */
export function AnimatedDots({ className }: AnimatedDotsProps) {
    return (
        <span className={cn("inline-flex items-center gap-0.5 ml-1", className)}>
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-current animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }}
                />
            ))}
        </span>
    )
}
