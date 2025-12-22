'use client'

import React from 'react'
import { LoadingLogo } from '@/components/ui/LoadingLogo'

interface UGCFactoryExecutionStatusProps {
    status: 'idle' | 'running' | 'completed' | 'failed'
    executionId: string | null
    onStartNew: () => void
}

const UGCFactoryExecutionStatus = React.memo<UGCFactoryExecutionStatusProps>(({
    status,
    executionId,
    onStartNew
}) => {
    if (status === 'idle') {
        return null
    }

    if (status === 'running') {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <LoadingLogo size="lg" text="Executing workflow..." />
                <p className="text-sm text-muted-foreground mt-4">Execution ID: {executionId}</p>
            </div>
        )
    }

    if (status === 'completed') {
        return null // Handled by UGCFactoryResults
    }

    if (status === 'failed') {
        return null // Handled by UGCFactoryResults
    }

    return null
})

UGCFactoryExecutionStatus.displayName = 'UGCFactoryExecutionStatus'

export { UGCFactoryExecutionStatus }
