'use client'

import React from 'react'
import { Spinner } from '@/components/ui/Spinner'

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
                <Spinner className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium">Executing workflow...</p>
                <p className="text-sm text-muted-foreground">Execution ID: {executionId}</p>
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
