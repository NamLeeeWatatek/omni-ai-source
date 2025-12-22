'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/PageLoading'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import type { RootState } from '@/lib/store/index'
import { fetchFlows } from '@/lib/store/slices/flowsSlice'
import { useRouter } from 'next/navigation'
import { UGCFactoryFlowGrid } from '@/components/features/ugc-factory/UGCFactoryFlowGrid'
import { TemplatesGrid } from '@/components/features/templates/TemplatesGrid'
import { useTemplates } from '@/lib/hooks/useTemplates'
import type { Template } from '@/lib/types/template'

// Inline selector for flows state
const selectFlows = (state: RootState) => state.flows.items
const selectFlowLoading = (state: RootState) => state.flows.loading

export default function UGCFactoryPage() {
    const dispatch = useAppDispatch()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('flows')

    // Redux state for flows
    const allFlows = useAppSelector(selectFlows)
    const flowLoading = useAppSelector(selectFlowLoading)

    // Templates state
    const { templates, loading: templatesLoading, refreshTemplates } = useTemplates()

    useEffect(() => {
        dispatch(fetchFlows({}))
        refreshTemplates()
    }, [dispatch, refreshTemplates])

    // Debug logging
    useEffect(() => {
        console.log('All Flows:', allFlows)
        console.log('All Flows length:', allFlows.length)
        console.log('Loading state:', flowLoading)
    }, [allFlows, flowLoading])

    const handleFlowSelect = (flowId: string) => {
        // Navigate to individual flow page
        router.push(`/ugc-factory/${flowId}`)
    }

    const handleTemplateSelect = (template: Template) => {
        // Navigate to template-based UGC creation
        router.push(`/ugc-factory/template/${template.id}`)
    }

    const isLoading = flowLoading || templatesLoading

    if (isLoading) {
        return <PageLoading message="Loading UGC Factory..." />
    }

    return (
        <div className="h-full p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">UGC Factory</h1>
                        <p className="text-muted-foreground">
                            Create content using AI-powered workflows and templates
                        </p>
                    </div>
                    <Button onClick={() => router.push('/templates')}>
                        Manage Templates
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="flows">Workflows</TabsTrigger>
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                    </TabsList>

                    <TabsContent value="flows" className="mt-6">
                        {allFlows.length === 0 ? (
                            <Card className="p-8 text-center">
                                <CardTitle className="mb-2">No Workflows Available</CardTitle>
                                <CardDescription>
                                    Create your first workflow to get started with UGC Factory.
                                </CardDescription>
                            </Card>
                        ) : (
                            <UGCFactoryFlowGrid
                                flows={allFlows}
                                onFlowSelect={handleFlowSelect}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="templates" className="mt-6">
                        <TemplatesGrid
                            templates={templates}
                            onEdit={() => {}} // Not used in selection mode
                            onDelete={() => {}} // Not used in selection mode
                            loading={templatesLoading}
                            selectionMode
                            onTemplateSelect={handleTemplateSelect}
                        />
                        {templates.length === 0 && (
                            <Card className="p-8 text-center">
                                <CardTitle className="mb-2">No Templates Available</CardTitle>
                                <CardDescription className="mb-4">
                                    Create standardized templates to make UGC content creation more consistent.
                                </CardDescription>
                                <Button onClick={() => router.push('/templates')}>
                                    Create Your First Template
                                </Button>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
