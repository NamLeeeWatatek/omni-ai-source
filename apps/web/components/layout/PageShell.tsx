import React from 'react'
import { cn } from '@/lib/utils'

interface PageShellProps {
    children: React.ReactNode
    title?: string
    titleClassName?: string
    description?: string
    actions?: React.ReactNode
    className?: string
    contentClassName?: string
    headerClassName?: string
    fullWidth?: boolean
}

export const PageShell = ({
    children,
    title,
    titleClassName,
    description,
    actions,
    className,
    contentClassName,
    headerClassName,
    fullWidth = false
}: PageShellProps) => {
    return (
        <div className={cn("flex flex-col space-y-8", className)}>
            {(title || actions) && (
                <div className={cn("flex flex-col space-y-2", headerClassName)}>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            {title && (
                                <h2 className={cn("text-2xl font-bold tracking-tight text-foreground sm:text-3xl", titleClassName)}>
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                        {actions && (
                            <div className="flex items-center gap-2">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className={cn("flex-1", contentClassName)}>
                {children}
            </div>
        </div>
    )
}
