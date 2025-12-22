'use client'

import React from 'react'
import { LoadingLogo } from './LoadingLogo'
import { cn } from '@/lib/utils'

interface PageLoadingProps {
    message?: string
    fullScreen?: boolean
    className?: string
    minHeight?: string
}

/**
 * Standardized Page Loading component
 * Use this for initial page data fetching states.
 */
export function PageLoading({
    message = 'Loading...',
    fullScreen = false,
    className,
    minHeight = 'min-h-[400px]'
}: PageLoadingProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center w-full animate-in fade-in duration-500",
            minHeight,
            fullScreen && "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
            className
        )}>
            <div className="relative group">
                {/* Glow Background Effect */}
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <LoadingLogo size="lg" text={message} />
            </div>

            {/* Subtle progress indicator or hint could go here */}
            <div className="mt-8 flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
        </div>
    )
}
