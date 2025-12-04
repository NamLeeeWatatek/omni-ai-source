'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import { KBCollectionDialog } from '@/components/features/knowledge-base'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    getKnowledgeBases,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
} from '@/lib/api/knowledge-base'
import type { KnowledgeBase, CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from '@/lib/types/knowledge-base'
import toast from '@/lib/toast'
import { useRouter } from 'next/navigation'
import {
    FiPlus,
    FiTrash2,
    FiEdit2,
    FiFile,
    FiRefreshCw,
    FiSearch,
    FiBook,
    FiDatabase,
    FiUsers,
    FiHardDrive,
    FiGrid,
    FiList,
    FiMoreVertical,
} from 'react-icons/fi'

import { useWorkspace } from '@/lib/hooks/useWorkspace'

export default function KnowledgeBaseCollectionsPage() {
    const router = useRouter()
    const { workspace, workspaceId } = useWorkspace()
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingKB, setEditingKB] = useState<KnowledgeBase | null>(null)
    const [deleteKBId, setDeleteKBId] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [showBulkDelete, setShowBulkDelete] = useState(false)

    useEffect(() => {
        if (workspaceId) {
            loadKnowledgeBases()
        } else {
            setLoading(false)
        }
    }, [workspaceId])

    const loadKnowledgeBases = async () => {
        if (!workspaceId) {
            console.log('[KB] No workspace ID available')
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await getKnowledgeBases(workspaceId)
            setKnowledgeBases(Array.isArray(response) ? response : [])
            console.log('Loaded knowledge bases:', response)
        } catch (error) {
            console.error('Failed to load knowledge bases:', error)
            toast.error('Failed to load knowledge bases')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (data: any) => {
        try {
            if (editingKB) {
                await updateKnowledgeBase(editingKB.id, data as UpdateKnowledgeBaseDto)
                toast.success('Knowledge Base updated')
            } else {
                await createKnowledgeBase({
                    ...data,
                    workspaceId: workspaceId,
                } as CreateKnowledgeBaseDto)
                toast.success('Knowledge Base created')
            }
            setDialogOpen(false)
            setEditingKB(null)
            loadKnowledgeBases()
        } catch (error) {

            toast.error('Failed to save knowledge base')
            throw error
        }
    }

    const handleEdit = (kb: KnowledgeBase) => {
        setEditingKB(kb)
        setDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteKBId) return

        try {
            await deleteKnowledgeBase(deleteKBId)
            toast.success('Knowledge Base deleted')
            setKnowledgeBases(prev => prev.filter(kb => kb.id !== deleteKBId))
        } catch (error) {

            toast.error('Failed to delete knowledge base')
        } finally {
            setDeleteKBId(null)
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return

        try {
            await Promise.all(
                Array.from(selectedIds).map(id => deleteKnowledgeBase(id))
            )
            toast.success(`${selectedIds.size} collection(s) deleted`)
            setKnowledgeBases(prev => prev.filter(kb => !selectedIds.has(kb.id)))
            setSelectedIds(new Set())
        } catch (error) {

            toast.error('Failed to delete collections')
        } finally {
            setShowBulkDelete(false)
        }
    }

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredKBs.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredKBs.map(kb => kb.id)))
        }
    }

    const openCreateDialog = () => {
        setEditingKB(null)
        setDialogOpen(true)
    }

    const filteredKBs = knowledgeBases.filter(kb =>
        kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kb.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatSize = (bytes: string) => {
        const size = parseInt(bytes)
        if (size === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(size) / Math.log(k))
        return Math.round(size / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const totalStats = {
        collections: knowledgeBases.length,
        documents: knowledgeBases.reduce((sum, kb) => sum + (kb.totalDocuments || 0), 0),
        size: knowledgeBases.reduce((sum, kb) => {
            const size = typeof kb.totalSize === 'string' ? parseInt(kb.totalSize) : (kb.totalSize || 0)
            return sum + (isNaN(size) ? 0 : size)
        }, 0),
        bots: knowledgeBases.reduce((sum, kb) => sum + (kb.botMappings?.length || 0), 0),
    }

    return (
        <div className="h-full">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Knowledge Base Collections</h1>
                    <p className="text-muted-foreground">
                        Organize your documents in collections
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadKnowledgeBases} disabled={loading}>
                        {loading ? (
                            <Spinner className="w-4 h-4 mr-2" />
                        ) : (
                            <FiRefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                    <Button onClick={openCreateDialog}>
                        <FiPlus className="w-4 h-4 mr-2" />
                        New Collection
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <FiDatabase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Collections</p>
                            <p className="text-2xl font-bold">{totalStats.collections}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                            <FiFile className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Documents</p>
                            <p className="text-2xl font-bold">{totalStats.documents}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <FiHardDrive className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Size</p>
                            <p className="text-2xl font-bold">{formatSize(totalStats.size.toString())}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <FiUsers className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Assigned Bots</p>
                            <p className="text-2xl font-bold">{totalStats.bots}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search & View Mode */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search collections..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <Button
                            variant="destructive"
                            onClick={() => setShowBulkDelete(true)}
                        >
                            <FiTrash2 className="w-4 h-4 mr-2" />
                            Delete {selectedIds.size} selected
                        </Button>
                    )}
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

            {/* Collections Content */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner className="w-8 h-8" />
                </div>
            ) : filteredKBs.length === 0 ? (
                <Card className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
                        <FiDatabase className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">No collections yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        {searchQuery
                            ? 'No collections match your search'
                            : 'Create your first knowledge base collection to organize documents'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={openCreateDialog} size="lg">
                            <FiPlus className="w-5 h-5 mr-2" />
                            Create First Collection
                        </Button>
                    )}
                </Card>
            ) : viewMode === 'table' ? (
                /* Table View */
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectedIds.size === filteredKBs.length && filteredKBs.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-center">Documents</TableHead>
                                <TableHead className="text-center">Size</TableHead>
                                <TableHead className="text-center">Bots</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredKBs.map((kb) => (
                                <TableRow key={kb.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(kb.id)}
                                            onChange={() => toggleSelection(kb.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
                                                style={{ backgroundColor: kb.color }}
                                            >
                                                <FiBook className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="font-medium">{kb.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {kb.description || <span className="text-muted-foreground">No description</span>}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{kb.totalDocuments}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{formatSize(kb.totalSize)}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{kb.botMappings?.length || 0}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="text-xs">
                                            {kb.embeddingModel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(kb.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => router.push(`/knowledge-base/collections/${kb.id}`)}
                                            >
                                                Open
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <FiMoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(kb)}>
                                                        <FiEdit2 className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteKBId(kb.id)}
                                                        className="text-destructive"
                                                    >
                                                        <FiTrash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
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
                    {filteredKBs.map((kb) => (
                        <Card key={kb.id} className="p-6 hover:shadow-xl transition-all hover:scale-[1.02] group h-full relative">
                            <div className="absolute top-4 left-4 z-10">
                                <Checkbox
                                    checked={selectedIds.has(kb.id)}
                                    onChange={() => toggleSelection(kb.id)}
                                    className="bg-background"
                                />
                            </div>
                            <div
                                className="cursor-pointer"
                                onClick={() => router.push(`/knowledge-base/collections/${kb.id}`)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ml-8"
                                        style={{ backgroundColor: kb.color }}
                                    >
                                        <FiBook className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEdit(kb)
                                            }}
                                        >
                                            <FiEdit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setDeleteKBId(kb.id)
                                            }}
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                    {kb.name}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                                    {kb.description || 'No description'}
                                </p>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <FiFile className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">{kb.totalDocuments}</span>
                                        <span className="text-muted-foreground">docs</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <FiHardDrive className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">{formatSize(kb.totalSize)}</span>
                                    </div>
                                </div>

                                {kb.botMappings && kb.botMappings.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                        <FiUsers className="w-4 h-4" />
                                        <span>{kb.botMappings.length} bot(s) assigned</span>
                                    </div>
                                )}

                                {kb.tags && kb.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {kb.tags.slice(0, 3).map((tag, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                        {kb.tags.length > 3 && (
                                            <Badge variant="secondary" className="text-xs">
                                                +{kb.tags.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <KBCollectionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                knowledgeBase={editingKB}
                onSubmit={handleSubmit}
            />

            {/* Delete Confirmation */}
            <AlertDialogConfirm
                open={deleteKBId !== null}
                onOpenChange={(open) => !open && setDeleteKBId(null)}
                title="Delete Knowledge Base Collection"
                description="Are you sure you want to delete this collection? All folders, documents, and embeddings will be permanently deleted. This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                variant="destructive"
            />

            {/* Bulk Delete Confirmation */}
            <AlertDialogConfirm
                open={showBulkDelete}
                onOpenChange={setShowBulkDelete}
                title={`Delete ${selectedIds.size} Collection(s)`}
                description={`Are you sure you want to delete ${selectedIds.size} collection(s)? All folders, documents, and embeddings will be permanently deleted. This action cannot be undone.`}
                confirmText="Delete All"
                cancelText="Cancel"
                onConfirm={handleBulkDelete}
                variant="destructive"
            />
        </div>
    )
}
