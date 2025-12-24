import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
    title: string
    description?: string
    children?: React.ReactNode
    className?: string
    premium?: boolean
}

export function PageHeader({ title, description, children, className, premium = false }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row items-start justify-between gap-4 mb-8", className)}>
            <div className="space-y-1.5 flex-1">
                <h1 className={cn(
                    "text-3xl font-black tracking-tight",
                    premium && "text-4xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
                )}>
                    {title}
                </h1>
                {description && (
                    <p className="text-muted-foreground font-medium">
                        {description}
                    </p>
                )}
            </div>
            {children && <div className="shrink-0">{children}</div>}
        </div>
    )
}
