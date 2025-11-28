'use client'

import { useState, useEffect } from 'react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { PermissionGate, CanCreate, CanUpdate, CanDelete } from '@/components/auth/PermissionGate'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    FiPlus,
    FiGrid,
    FiList,
    FiMoreVertical,
    FiEdit,
    FiTrash2,
    FiCopy,
    FiDownload,
    FiUpload,
    FiSearch,
} from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import { useAppDispatch } from '@/lib/store/hooks'
import { setDraftTemplate } from '@/lib/store/slices/workflowEditorSlice'

interface Template {
    id: number
    name: string
    description: string
    category: string
    nodes: any[]
    edges: any[]
    created_at: string
    updated_at: string
    flow_id?: number
}

export default function TemplatesPage() {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { canCreate, canUpdate, canDelete, isLoading: permissionsLoading } = usePermissions()
    const [templates, setTemplates] = useState<Template[]>([])
    const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'general',
    })

    useEffect(() => {
        loadTemplates()
    }, [])

    useEffect(() => {
        // Filter templates based on search
        if (searchQuery.trim()) {
            const filtered = templates.filter(t => 
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.category?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setFilteredTemplates(filtered)
        } else {
            setFilteredTemplates(templates)
        }
    }, [searchQuery, templates])

    const loadTemplates = async () => {
        try {
            setLoading(true)
            const data = await axiosClient.get('/templates/')
            setTemplates(Array.isArray(data) ? data : [])
        } catch (error: any) {
            console.error('Failed to load templates:', error)
            toast.error('Failed to load templates')
            setTemplates([])
        } finally {
            setLoading(false)
        }
    }

    const handleCreateFromFlow = () => {
        toast.info('Please open a workflow and use "Save as Template" from the menu')
        router.push('/flows')
    }

    const handleUseTemplate = (template: Template) => {
        try {
            // Set template in Redux store
            dispatch(setDraftTemplate({
                name: template.name,
                nodes: template.nodes || [],
                edges: template.edges || []
            }))
            
            // Navigate to editor (editor will auto-load from Redux)
            router.push('/flows/new/edit')
            toast.success('Template loaded! Customize and save your workflow.')
        } catch (error) {
            console.error('Failed to load template:', error)
            toast.error('Failed to load template')
        }
    }

    const handleEdit = (template: Template) => {
        setEditingTemplate(template)
        setFormData({
            name: template.name,
            description: template.description,
            category: template.category,
        })
        setShowCreateDialog(true)
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Please enter a template name')
            return
        }

        try {
            if (editingTemplate) {
                await axiosClient.put(`/templates/${editingTemplate.id}`, formData)
                toast.success('Template updated!')
            }
            
            setShowCreateDialog(false)
            setEditingTemplate(null)
            setFormData({ name: '', description: '', category: 'general' })
            loadTemplates()
        } catch (error) {
            toast.error('Failed to save template')
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return

        try {
            await axiosClient.delete(`/templates/${deleteId}`)
            toast.success('Template deleted!')
            setDeleteId(null)
            loadTemplates()
        } catch (error) {
            toast.error('Failed to delete template')
        }
    }

    const handleDuplicate = async (template: Template) => {
        try {
            await axiosClient.post('/templates/', {
                name: `${template.name} (Copy)`,
                description: template.description,
                category: template.category,
                nodes: template.nodes,
                edges: template.edges,
            })
            toast.success('Template duplicated!')
            loadTemplates()
        } catch (error) {
            toast.error('Failed to duplicate template')
        }
    }

    const handleExport = (template: Template) => {
        const dataStr = JSON.stringify(template, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`
        link.click()
        URL.revokeObjectURL(url)
        toast.success('Template exported!')
    }

    return (
        <div className="h-full">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Workflow Templates</h1>
                    <p className="text-muted-foreground">
                        Manage and reuse your workflow templates
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <CanCreate resource="template">
                        <Button variant="outline" onClick={handleCreateFromFlow}>
                            <FiUpload className="w-4 h-4 mr-2" />
                            Save from Workflow
                        </Button>
                    </CanCreate>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="glass p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <FiList className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <FiGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner className="size-8 text-primary" />
                </div>
            ) : filteredTemplates.length === 0 ? (
                <Card className="text-center py-20">
                    <FiGrid className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Create your first template from an existing workflow
                    </p>
                    <Button onClick={handleCreateFromFlow}>
                        <FiPlus className="w-4 h-4 mr-2" />
                        Create Template
                    </Button>
                </Card>
            ) : viewMode === 'table' ? (
                /* Table View */
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-center">Nodes</TableHead>
                                <TableHead className="text-center">Edges</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTemplates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell className="font-medium">{template.name}</TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {template.description || <span className="text-muted-foreground">No description</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{template.category}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{template.nodes?.length || 0}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{template.edges?.length || 0}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(template.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleUseTemplate(template)}
                                            >
                                                Use
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <FiMoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {canUpdate('template') && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                                                                <FiEdit className="w-4 h-4 mr-2" />
                                                                Edit Info
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                                                                <FiCopy className="w-4 h-4 mr-2" />
                                                                Duplicate
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleExport(template)}>
                                                        <FiDownload className="w-4 h-4 mr-2" />
                                                        Export
                                                    </DropdownMenuItem>
                                                    {canDelete('template') && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => setDeleteId(template.id)}
                                                                className="text-destructive"
                                                            >
                                                                <FiTrash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                        <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                                    <Badge variant="secondary" className="text-xs">
                                        {template.category}
                                    </Badge>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <FiMoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(template)}>
                                            <FiEdit className="w-4 h-4 mr-2" />
                                            Edit Info
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                                            <FiCopy className="w-4 h-4 mr-2" />
                                            Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport(template)}>
                                            <FiDownload className="w-4 h-4 mr-2" />
                                            Export
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setDeleteId(template.id)}
                                            className="text-destructive"
                                        >
                                            <FiTrash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {template.description || 'No description'}
                            </p>

                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                <span>{template.nodes?.length || 0} nodes</span>
                                <span>{new Date(template.created_at).toLocaleDateString()}</span>
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => handleUseTemplate(template)}
                            >
                                Use Template
                            </Button>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingTemplate ? 'Edit Template' : 'Create Template'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Template name"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe this template..."
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label>Category</Label>
                            <Input
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="e.g., customer-support, sales, marketing"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialogConfirm
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Template"
                description="Are you sure you want to delete this template? This action cannot be undone."
            />
        </div>
    )
}
