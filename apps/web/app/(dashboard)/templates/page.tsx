'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PageLoading } from '@/components/ui/PageLoading'
import { Plus } from 'lucide-react'
import { TemplateDialog } from '@/components/features/templates/TemplateDialog'
import { toast } from '@/lib/toast'
import type { Template, CreateTemplateDto, UpdateTemplateDto } from '@/lib/types/template'
import { TemplatesGrid } from '@/components/features/templates/TemplatesGrid'
import { useTemplates } from '@/lib/hooks/useTemplates'

export default function TemplatesPage() {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const { templates, loading, createTemplate, updateTemplate, deleteTemplate, refreshTemplates } = useTemplates()

    useEffect(() => {
        refreshTemplates()
    }, [refreshTemplates])

    const handleCreateTemplate = async (data: Partial<Template>) => {
        try {
            await createTemplate(data as CreateTemplateDto)
            toast.success('Template created successfully')
            refreshTemplates()
        } catch (error) {
            throw error
        }
    }

    const handleUpdateTemplate = async (data: Partial<Template>) => {
        if (!selectedTemplate) return

        try {
            await updateTemplate(selectedTemplate.id, data as UpdateTemplateDto)
            toast.success('Template updated successfully')
            setSelectedTemplate(null)
            refreshTemplates()
        } catch (error) {
            throw error
        }
    }

    const handleDeleteTemplate = async (templateId: string) => {
        try {
            await deleteTemplate(templateId)
            toast.success('Template deleted successfully')
            refreshTemplates()
        } catch (error) {
            toast.error('Failed to delete template')
        }
    }

    const handleEditTemplate = (template: Template) => {
        setSelectedTemplate(template)
        setDialogOpen(true)
    }

    const handleDialogClose = () => {
        setDialogOpen(false)
        setSelectedTemplate(null)
    }

    if (loading && templates.length === 0) {
        return <PageLoading message="Loading templates..." />
    }

    return (
        <div className="h-full p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Templates</h1>
                        <p className="text-muted-foreground">
                            Manage templates for standardized UGC content creation
                        </p>
                    </div>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Template
                    </Button>
                </div>

                <TemplatesGrid
                    templates={templates}
                    onEdit={handleEditTemplate}
                    onDelete={handleDeleteTemplate}
                    loading={loading}
                />

                <TemplateDialog
                    open={dialogOpen}
                    onOpenChange={handleDialogClose}
                    template={selectedTemplate}
                    onSubmit={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate}
                />
            </div>
        </div>
    )
}
