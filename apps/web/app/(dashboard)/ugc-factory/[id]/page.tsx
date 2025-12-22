'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/PageLoading'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import type { RootState } from '@/lib/store/index'
import { flowsApi } from '@/lib/api/flows'
import { fetchFlow } from '@/lib/store/slices/flowsSlice'
import { useParams, useRouter } from 'next/navigation'
import toast from '@/lib/toast'
import { UGCFactoryForm } from '@/components/features/ugc-factory/UGCFactoryForm'
import { UGCFactoryExecutionStatus } from '@/components/features/ugc-factory/UGCFactoryExecutionStatus'
import { UGCFactoryResults } from '@/components/features/ugc-factory/UGCFactoryResults'
import { UGCFactoryArtifacts } from '@/components/features/ugc-factory/UGCFactoryArtifacts'
import { FiArrowLeft } from 'react-icons/fi'
import { cn } from '@/lib/utils'

// Inline selectors for flows state
const selectFlowById = (id: string) => (state: RootState) => state.flows.currentFlow?.id === id ? state.flows.currentFlow : null
const selectFlowProperties = (id: string) => (state: RootState) => {
    const flow = state.flows.currentFlow
    if (!flow?.nodes) return []

    // For UGC Factory, get properties from manual trigger node only
    const manualTrigger: any = flow.nodes.find(node => node.type === 'manual')
    if (manualTrigger?.properties && Array.isArray(manualTrigger.properties)) {
        return manualTrigger.properties
    }

    return []
}
const selectFlowLoading = (state: RootState) => state.flows.loading

export default function UGCFactoryFlowPage() {
    const params = useParams()
    const router = useRouter()
    const flowId = params.id as string

    // Local state
    const [activeTab, setActiveTab] = useState<'form' | 'execution'>('form')
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
    const [executionId, setExecutionId] = useState<string | null>(null)
    const [executionResult, setExecutionResult] = useState<any>(null)
    const [executionError, setExecutionError] = useState<string | null>(null)

    const tabs = [
        { id: 'form', label: 'Dynamic Form' },
        { id: 'execution', label: 'Generated Artifacts' },
    ]

    const dispatch = useAppDispatch()

    // Redux state
    const selectedFlow = useAppSelector(selectFlowById(flowId))
    const flowProperties: any[] = useAppSelector(selectFlowProperties(flowId))
    const flowLoading = useAppSelector(selectFlowLoading)

    useEffect(() => {
        if (flowId) {
            dispatch(fetchFlow(flowId))
        }
    }, [dispatch, flowId])

    const handleExecute = async () => {
        if (!selectedFlow) {
            toast.error('No flow selected')
            return
        }

        if (!selectedFlow.id || (typeof selectedFlow.id === 'string' && selectedFlow.id === 'NaN') || selectedFlow.id === null || selectedFlow.id === undefined) {
            console.error('Invalid flow ID:', selectedFlow.id, 'Flow:', selectedFlow, 'Type:', typeof selectedFlow.id)
            toast.error('Invalid flow ID')
            return
        }

        try {
            setExecutionStatus('running')
            setExecutionError(null)

            console.log('Executing flow:', selectedFlow.id, typeof selectedFlow.id)
            console.log('Form data:', formData)

            const executionData = formData

            console.log('Execution data:', executionData)

            console.log('About to execute flow ID:', selectedFlow.id, 'URL:', `/flows/${selectedFlow.id}/execute`)

            const result = await flowsApi.execute(selectedFlow.id, executionData)
            console.log('Execution started result:', result)

            if (result.executionId) {
                setExecutionId(result.executionId)
                toast.success('Execution started!')
                pollExecutionStatus(result.executionId)
            } else {
                throw new Error('No execution ID returned')
            }
        } catch (err: any) {
            console.error('Execute error:', err)
            toast.error(err.message || 'Failed to execute')
            setExecutionStatus('failed')
            setExecutionError(err.message)
        }
    }

    const pollExecutionStatus = async (execId: string) => {
        const maxAttempts = 30
        let attempts = 0

        const interval = setInterval(async () => {
            attempts++

            try {
                const execution = await flowsApi.getExecution(execId)

                if (execution.status === 'completed') {
                    setExecutionStatus('completed')
                    setExecutionResult(execution.output)
                    toast.success('Execution completed!')
                    clearInterval(interval)
                } else if (execution.status === 'failed') {
                    setExecutionStatus('failed')
                    setExecutionError(execution.error || 'Execution failed')
                    toast.error('Execution failed')
                    clearInterval(interval)
                } else if (attempts >= maxAttempts) {
                    setExecutionStatus('failed')
                    setExecutionError('Execution timeout')
                    toast.error('Execution timeout')
                    clearInterval(interval)
                }
            } catch (err) {
                console.error('Failed to poll execution status', err)
                clearInterval(interval)
                setExecutionStatus('failed')
            }
        }, 2000)
    }

    const handleStartNew = () => {
        console.log('🔄 Starting new execution - resetting formData to {}')
        setFormData({})
        setExecutionStatus('idle')
        setExecutionResult(null)
        setExecutionError(null)
    }

    const handleBack = () => {
        router.push('/ugc-factory')
    }

    if (flowLoading || !selectedFlow) {
        return <PageLoading message="Loading workflow configuration..." />
    }

    // Flow detail view
    return (
        <div className="h-full p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{selectedFlow.name}</h1>
                        <p className="text-muted-foreground">{selectedFlow.description}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                'px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                                activeTab === tab.id
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'form' && (
                    <div className="max-w-4xl">
                        <UGCFactoryForm
                            properties={flowProperties}
                            formData={formData}
                            onFormDataChange={setFormData}
                            onSubmit={handleExecute}
                        />
                    </div>
                )}

                {activeTab === 'execution' && (
                    <div className="space-y-6">
                        <UGCFactoryExecutionStatus
                            status={executionStatus}
                            executionId={executionId}
                            onStartNew={handleStartNew}
                        />

                        <UGCFactoryArtifacts
                            flowId={selectedFlow.id}
                            executionId={executionId}
                            onStartNew={handleStartNew}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
