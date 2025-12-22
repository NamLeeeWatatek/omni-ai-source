'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'
import type { Template } from '@/lib/types/template'

interface TemplateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    template?: Template | null
    onSubmit: (data: Partial<Template>) => Promise<void>
}

const categoryOptions = [
    { value: 'image-generation', label: 'Image Generation' },
    { value: 'video-editing', label: 'Video Editing' },
    { value: 'text-to-speech', label: 'Text to Speech' },
    { value: 'social-media', label: 'Social Media' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' },
]

export function TemplateDialog({
    open,
    onOpenChange,
    template,
    onSubmit
}: TemplateDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        prompt: '',
        category: '',
        isActive: true,
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (template && open) {
            setFormData({
                name: template.name,
                description: template.description || '',
                prompt: template.prompt || '',
                category: template.category || '',
                isActive: template.isActive,
            })
        } else if (!open) {
            setFormData({
                name: '',
                description: '',
                prompt: '',
                category: '',
                isActive: true,
            })
        }
    }, [template, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            alert('Name is required')
            return
        }

        setLoading(true)
        try {
            await onSubmit(formData)
            onOpenChange(false)
        } catch (error) {
            console.error('Submit error:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{template ? 'Edit Template' : 'Create Template'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            placeholder="My Awesome Template"
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe what this template is for..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) => updateField('description', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => updateField('category', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categoryOptions.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="prompt">AI Prompt</Label>
                        <Textarea
                            id="prompt"
                            placeholder="Enter the AI prompt for content generation..."
                            rows={4}
                            value={formData.prompt}
                            onChange={(e) => updateField('prompt', e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                            The prompt that will be used to generate content with AI
                        </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Active</Label>
                            <p className="text-sm text-muted-foreground">
                                Whether this template is available for use
                            </p>
                        </div>
                        <Switch
                            checked={formData.isActive}
                            onCheckedChange={(checked) => updateField('isActive', checked)}
                        />
                    </div>

                    {/* Future enhancement: Add media file selection and style config editor */}
                    <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                        <p className="font-medium mb-2">Advanced Features (Coming Soon):</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Media file attachments (images, videos)</li>
                            <li>Style configuration editor</li>
                            <li>Workspace assignment</li>
                        </ul>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
