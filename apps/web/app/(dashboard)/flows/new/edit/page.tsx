'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@wataomi/ui'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import Link from 'next/link'

export default function NewWorkflowPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        tags: '',
        template: 'blank'
    })

    const templates = [
        {
            id: 'blank',
            name: 'Blank Workflow',
            description: 'Start from scratch with an empty canvas',
            icon: '📄'
        },
        {
            id: 'customer-support',
            name: 'Customer Support',
            description: 'AI-powered customer support with human handover',
            icon: '💬'
        },
        {
            id: 'lead-qualification',
            name: 'Lead Qualification',
            description: 'Qualify and route leads automatically',
            icon: '🎯'
        },
        {
            id: 'order-processing',
            name: 'Order Processing',
            description: 'Process orders and send confirmations',
            icon: '🛒'
        },
        {
            id: 'appointment-booking',
            name: 'Appointment Booking',
            description: 'Schedule appointments with calendar integration',
            icon: '📅'
        },
        {
            id: 'feedback-collection',
            name: 'Feedback Collection',
            description: 'Collect and analyze customer feedback',
            icon: '⭐'
        }
    ]

    const handleCreate = () => {
        // In real app, this would create the workflow in backend
        // For now, redirect to editor with mock ID
        const mockId = Math.floor(Math.random() * 1000) + 10
        router.push(`/flows/${mockId}/edit`)
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/flows"
                    className="inline-flex items-center text-sm text-primary hover:underline mb-4"
                >
                    <FiArrowLeft className="w-4 h-4 mr-2" />
                    Back to Workflows
                </Link>
                <h1 className="text-3xl font-bold mb-2">Create New Workflow</h1>
                <p className="text-muted-foreground">
                    Set up your workflow details and choose a template to get started
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <div className="glass rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Workflow Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Customer Support Flow"
                                    className="w-full glass rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe what this workflow does..."
                                    rows={4}
                                    className="w-full glass rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Tags
                                </label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="support, ai, automation (comma separated)"
                                    className="w-full glass rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Separate tags with commas
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Template Selection */}
                    <div className="glass rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-6">Choose a Template</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => setFormData({ ...formData, template: template.id })}
                                    className={`p-4 rounded-lg border-2 transition-all text-left ${formData.template === template.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border/40 hover:border-primary/40 bg-muted/20'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-3xl">{template.icon}</span>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">{template.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {template.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview/Summary Section */}
                <div className="lg:col-span-1">
                    <div className="glass rounded-xl p-6 sticky top-8">
                        <h2 className="text-xl font-semibold mb-6">Summary</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Name</p>
                                <p className="font-medium">
                                    {formData.name || 'Untitled Workflow'}
                                </p>
                            </div>

                            {formData.description && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                                    <p className="text-sm">{formData.description}</p>
                                </div>
                            )}

                            {formData.tags && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.split(',').map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                                            >
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Template</p>
                                <p className="font-medium">
                                    {templates.find(t => t.id === formData.template)?.name}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={handleCreate}
                                disabled={!formData.name}
                                className="w-full"
                            >
                                <FiSave className="w-4 h-4 mr-2" />
                                Create & Edit Workflow
                            </Button>

                            <Link href="/flows" className="block">
                                <Button variant="outline" className="w-full">
                                    Cancel
                                </Button>
                            </Link>
                        </div>

                        {!formData.name && (
                            <p className="text-xs text-muted-foreground mt-4 text-center">
                                Please enter a workflow name to continue
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
