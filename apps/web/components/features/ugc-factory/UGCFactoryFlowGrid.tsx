'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { IconType } from 'react-icons'

interface FlowItem {
    id: string
    name: string
    description?: string
}

interface UGCFactoryFlowGridProps {
    flows: FlowItem[]
    onFlowSelect: (flowId: string) => void
    loading?: boolean
}

const UGCFactoryFlowGrid = React.memo<UGCFactoryFlowGridProps>(({
    flows,
    onFlowSelect,
    loading = false
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flows.map((flow) => (
                <Card
                    key={flow.id}
                    className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
                    onClick={() => onFlowSelect(flow.id)}
                >
                    <CardHeader>
                        <CardDescription>{flow.description}</CardDescription>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
})

UGCFactoryFlowGrid.displayName = 'UGCFactoryFlowGrid'

export { UGCFactoryFlowGrid }
