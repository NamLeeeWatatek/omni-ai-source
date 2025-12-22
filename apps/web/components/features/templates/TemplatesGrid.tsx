'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { MoreVertical, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import type { Template } from '@/lib/types/template'

interface TemplatesGridProps {
    templates: Template[]
    onEdit: (template: Template) => void
    onDelete: (templateId: string) => void
    loading?: boolean
    selectionMode?: boolean
    onTemplateSelect?: (template: Template) => void
}

const TemplatesGrid = React.memo<TemplatesGridProps>(({
    templates,
    onEdit,
    onDelete,
    loading = false,
    selectionMode = false,
    onTemplateSelect
}) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="p-6">
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-16" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        )
    }

    if (templates.length === 0) {
        return (
            <Card className="p-8 text-center">
                <CardTitle className="mb-2">No Templates Found</CardTitle>
                <CardDescription>
                    Create your first template to get started with standardized UGC content creation.
                </CardDescription>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
                <Card
                    key={template.id}
                    className={`hover:shadow-md transition-shadow ${selectionMode ? 'cursor-pointer hover:border-primary' : ''}`}
                    onClick={() => selectionMode && onTemplateSelect ? onTemplateSelect(template) : undefined}
                >
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg font-semibold truncate">
                                    {template.name}
                                </CardTitle>
                                {template.category && (
                                    <Badge variant="secondary" className="mt-1 text-xs">
                                        {template.category}
                                    </Badge>
                                )}
                            </div>
                            {!selectionMode && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(template)}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onDelete(template.id)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {template.description && (
                            <CardDescription className="text-sm mb-3 line-clamp-2">
                                {template.description}
                            </CardDescription>
                        )}

                        {template.prompt && (
                            <div className="mb-3">
                                <p className="text-xs text-muted-foreground mb-1">Prompt Preview:</p>
                                <p className="text-sm bg-muted p-2 rounded text-xs line-clamp-3">
                                    {template.prompt}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                {template.isActive ? (
                                    <Eye className="w-3 h-3" />
                                ) : (
                                    <EyeOff className="w-3 h-3" />
                                )}
                                <span>{template.isActive ? 'Active' : 'Inactive'}</span>
                            </div>
                            <span>
                                {new Date(template.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        {template.mediaFiles && template.mediaFiles.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs text-muted-foreground mb-1">
                                    Media Files: {template.mediaFiles.length}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
})

TemplatesGrid.displayName = 'TemplatesGrid'

export { TemplatesGrid }
