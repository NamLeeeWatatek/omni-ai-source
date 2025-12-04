'use client'

import { useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
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
    KBStatsCards,
    KBBreadcrumbs,
    KBFolderDialog,
    KBDocumentDialog,
    KBQueryDialog,
    KBChatDialog,
    KBSettingsDialog,
    KBProcessingStatus,
    KBCrawlerDialog,
    KBItemEditDialog,
} from '@/components/features/knowledge-base'
import * as Icons from 'react-icons/fi'
import toast from '@/lib/toast'
import {
    FiArrowLeft,
    FiPlus,
    FiUpload,
    FiFolderPlus,
    FiFolder,
    FiRefreshCw,
    FiSearch,
    FiDatabase,
    FiMessageSquare,
    FiSettings,
    FiGlobe,
    FiGrid,
    FiList,
    FiMoreVertical,
    FiTrash2,
    FiEdit2,
    FiFileText,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
} from 'react-icons/fi'

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import {
    loadKnowledgeBase,
    refreshData,
    createFolder,
    createDocument,
    uploadDocument,
    updateFolder,
    updateDocument,
    removeFolder,
    removeDocument,
    moveFolderToFolder,
    moveDocumentToFolder,
    navigateToFolder,
    navigateToBreadcrumb,
    setViewMode,
    setSearchQuery,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    setDraggedItem,
    setDragOverFolder,
    setAutoRefreshing,
    resetState,
    selectCurrentKB,
    selectStats,
    selectFilteredFolders,
    selectFilteredDocuments,
    selectLoading,
    selectAutoRefreshing,
    selectViewMode,
    selectSearchQuery,
    selectSelectedIds,
    selectBreadcrumbs,
    selectCurrentFolderId,
    selectDraggedItem,
    selectDragOverFolder,
    selectHasProcessingDocuments,
} from '@/lib/store/slices/knowledgeBaseSlice'
import { queryKnowledgeBase, generateKBAnswer, updateKnowledgeBase } from '@/lib/api/knowledge-base'
import type { KBFolder, KBDocument } from '@/lib/types/knowledge-base'
import { useState } from 'react'

export default function KnowledgeBaseDetailPageRedux() {
    const params = useParams()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const kbId = params.id as string

    const kb = useAppSelector(selectCurrentKB)
    const stats = useAppSelector(selectStats)
    const folders = useAppSelector(selectFilteredFolders)
    const documents = useAppSelector(selectFilteredDocuments)
    const loading = useAppSelector(selectLoading)
    const autoRefreshing = useAppSelector(selectAutoRefreshing)
    const viewMode = useAppSelector(selectViewMode)
    const searchQuery = useAppSelector(selectSearchQuery)
    const selectedIds = useAppSelector(selectSelectedIds)
    const breadcrumbs = useAppSelector(selectBreadcrumbs)
    const currentFolderId = useAppSelector(selectCurrentFolderId)
    const draggedItem = useAppSelector(selectDraggedItem)
    const dragOverFolder = useAppSelector(selectDragOverFolder)
    const hasProcessing = useAppSelector(selectHasProcessingDocuments)

    const [folderDialogOpen, setFolderDialogOpen] = useState(false)
    const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
    const [queryDialogOpen, setQueryDialogOpen] = useState(false)
    const [chatDialogOpen, setChatDialogOpen] = useState(false)
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
    const [crawlerDialogOpen, setCrawlerDialogOpen] = useState(false)
    const [deleteItemId, setDeleteItemId] = useState<{ type: 'folder' | 'document'; id: string } | null>(null)
    const [showBulkDelete, setShowBulkDelete] = useState(false)
    const [editingItem, setEditingItem] = useState<{ type: 'folder' | 'document'; item: KBFolder | KBDocument } | null>(null)

    useEffect(() => {
        dispatch(loadKnowledgeBase({ kbId, folderId: null }))

        return () => {
            dispatch(resetState())
        }
    }, [dispatch, kbId])

    useEffect(() => {
        dispatch(setAutoRefreshing(hasProcessing))

        if (hasProcessing) {
            const interval = setInterval(() => {
                dispatch(refreshData({ kbId, folderId: currentFolderId }))
            }, 5000)

            return () => clearInterval(interval)
        }
    }, [dispatch, hasProcessing, kbId, currentFolderId])

    const handleNavigateToFolder = (folderId: string, folderName: string) => {
        dispatch(navigateToFolder({ id: folderId, name: folderName }))
        dispatch(refreshData({ kbId, folderId }))
    }

    const handleNavigateToBreadcrumb = (index: number) => {
        const targetFolderId = index === -1 ? null : breadcrumbs[index].id
        dispatch(navigateToBreadcrumb(index))
        dispatch(refreshData({ kbId, folderId: targetFolderId }))
    }

    const handleCreateFolder = async (data: { name: string; description: string }) => {
        if (!data.name.trim()) {
            toast.error('Folder name is required')
            return
        }

        await dispatch(createFolder({
            knowledgeBaseId: kbId,
            name: data.name,
            description: data.description,
            parentFolderId: currentFolderId || undefined,
        })).unwrap()

        toast.success('Folder created')
        setFolderDialogOpen(false)
        dispatch(refreshData({ kbId, folderId: currentFolderId }))
    }

    const handleCreateDocument = async (data: { name: string; content: string }) => {
        if (!data.name.trim() || !data.content.trim()) {
            toast.error('Name and content are required')
            return
        }

        await dispatch(createDocument({
            knowledgeBaseId: kbId,
            name: data.name,
            content: data.content,
            folderId: currentFolderId || undefined,
        })).unwrap()

        toast.success('Document created and processing started')
        setDocumentDialogOpen(false)
        dispatch(refreshData({ kbId, folderId: currentFolderId }))
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            await dispatch(uploadDocument({
                file,
                kbId,
                folderId: currentFolderId || undefined,
            })).unwrap()

            toast.success('File uploaded and processing started')
        } catch (error: any) {

            const message = error?.message || error?.detail || 'Failed to upload file'
            toast.error(message)
        } finally {
            event.target.value = ''
        }
    }

    const handleDelete = async () => {
        if (!deleteItemId) return

        try {
            if (deleteItemId.type === 'folder') {
                await dispatch(removeFolder(deleteItemId.id)).unwrap()
                toast.success('Folder deleted')
            } else {
                await dispatch(removeDocument(deleteItemId.id)).unwrap()
                toast.success('Document deleted')
            }
            await dispatch(refreshData({ kbId, folderId: currentFolderId }))
        } catch (error: any) {

            const message = error?.message || error?.detail || `Failed to delete ${deleteItemId.type}`
            toast.error(message)
        } finally {
            setDeleteItemId(null)
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return

        try {
            const deletePromises = selectedIds.map(id => {
                const isFolder = folders.some(f => f.id === id)
                return isFolder
                    ? dispatch(removeFolder(id)).unwrap()
                    : dispatch(removeDocument(id)).unwrap()
            })

            await Promise.all(deletePromises)
            toast.success(`${selectedIds.length} item(s) deleted`)
            dispatch(clearSelection())
            await dispatch(refreshData({ kbId, folderId: currentFolderId }))
        } catch (error: any) {

            const message = error?.message || error?.detail || 'Failed to delete items'
            toast.error(message)
        } finally {
            setShowBulkDelete(false)
        }
    }

    const handleDragStart = (e: React.DragEvent, type: 'folder' | 'document', id: string) => {
        dispatch(setDraggedItem({ type, id }))
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        dispatch(setDragOverFolder(folderId))
    }

    const handleDragLeave = () => {
        dispatch(setDragOverFolder(null))
    }

    const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
        e.preventDefault()
        dispatch(setDragOverFolder(null))

        if (!draggedItem) return

        try {
            if (draggedItem.type === 'folder') {
                if (draggedItem.id === targetFolderId) return
                await dispatch(moveFolderToFolder({
                    folderId: draggedItem.id,
                    targetFolderId,
                })).unwrap()
                toast.success('Folder moved successfully')
            } else {
                await dispatch(moveDocumentToFolder({
                    documentId: draggedItem.id,
                    targetFolderId,
                })).unwrap()
                toast.success('Document moved successfully')
            }
            dispatch(refreshData({ kbId, folderId: currentFolderId }))
        } catch (error) {
            toast.error('Failed to move item')
        } finally {
            dispatch(setDraggedItem(null))
        }
    }

    const handleEditItem = (type: 'folder' | 'document', item: KBFolder | KBDocument) => {
        setEditingItem({ type, item })
    }

    const handleSaveEdit = async (data: { name: string; description?: string; icon?: string }) => {
        if (!editingItem) return

        try {
            if (editingItem.type === 'folder') {
                await dispatch(updateFolder({
                    id: editingItem.item.id,
                    updates: data,
                })).unwrap()
                toast.success('Folder updated')
            } else {
                await dispatch(updateDocument({
                    id: editingItem.item.id,
                    updates: data,
                })).unwrap()
                toast.success('Document updated')
            }
            setEditingItem(null)
            dispatch(refreshData({ kbId, folderId: currentFolderId }))
        } catch (error) {
            toast.error('Failed to update item')
            throw error
        }
    }

    const handleQuery = async (query: string) => {
        const response = await queryKnowledgeBase({
            query,
            knowledgeBaseId: kbId,
            limit: 5,
        })
        return response.results
    }

    const handleSaveSettings = async (data: {
        name: string
        description: string
        embeddingModel: string
        chunkSize: number
        chunkOverlap: number
    }) => {
        await updateKnowledgeBase(kbId, data)
        toast.success('Settings saved')
        setSettingsDialogOpen(false)
        dispatch(loadKnowledgeBase({ kbId, folderId: currentFolderId }))
    }

    const formatSize = (bytes: string) => {
        const size = parseInt(bytes)
        if (size === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(size) / Math.log(k))
        return Math.round(size / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <FiCheckCircle className="w-4 h-4 text-green-500" />
            case 'processing':
                return <FiClock className="w-4 h-4 text-blue-500 animate-spin" />
            case 'failed':
                return <FiAlertCircle className="w-4 h-4 text-red-500" />
            default:
                return <FiClock className="w-4 h-4 text-gray-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            completed: 'default',
            processing: 'secondary',
            failed: 'destructive',
            pending: 'outline',
        }
        return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
    }

    const getIcon = (iconName?: string | null) => {
        if (!iconName) return null
        const IconComponent = (Icons as any)[iconName]
        return IconComponent ? <IconComponent className="w-5 h-5" /> : null
    }

    if (loading && !kb) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner className="w-8 h-8" />
            </div>
        )
    }

    if (!kb) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <FiDatabase className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Knowledge Base not found</h2>
                <Button onClick={() => router.push('/knowledge-base/collections')}>
                    <FiArrowLeft className="w-4 h-4 mr-2" />
                    Back to Collections
                </Button>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {}
            <div className="page-header flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/knowledge-base/collections')}>
                        <FiArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: kb.color }}
                        >
                            <FiDatabase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{kb.name}</h1>
                            <p className="text-sm text-muted-foreground">{kb.description || 'No description'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setChatDialogOpen(true)}>
                        <FiMessageSquare className="w-4 h-4 mr-2" />
                        Chat
                    </Button>
                    <Button variant="outline" onClick={() => setQueryDialogOpen(true)}>
                        <FiSearch className="w-4 h-4 mr-2" />
                        Search
                    </Button>
                    <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
                        <FiSettings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => dispatch(refreshData({ kbId, folderId: currentFolderId }))}
                        disabled={loading}
                    >
                        <FiRefreshCw className={`w-4 h-4 mr-2 ${loading || autoRefreshing ? 'animate-spin' : ''}`} />
                        {autoRefreshing ? 'Auto-refreshing...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {}
            {stats && <KBStatsCards stats={stats} />}

            {}
            <KBProcessingStatus knowledgeBaseId={kbId} />

            {}
            <KBBreadcrumbs
                rootName={kb.name}
                breadcrumbs={breadcrumbs}
                onNavigate={handleNavigateToBreadcrumb}
                onDrop={(folderId) => handleDrop({} as React.DragEvent, folderId)}
                dragOverId={dragOverFolder}
            />

            {}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => setFolderDialogOpen(true)}>
                        <FiFolderPlus className="w-4 h-4 mr-2" />
                        New Folder
                    </Button>
                    <Button variant="outline" onClick={() => setDocumentDialogOpen(true)}>
                        <FiPlus className="w-4 h-4 mr-2" />
                        Add Document
                    </Button>
                    <div className="relative">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt,.md,.csv,.json"
                            onChange={handleFileUpload}
                        />
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <FiUpload className="w-4 h-4 mr-2" />
                            Upload File
                        </Button>
                    </div>
                    <Button variant="outline" onClick={() => setCrawlerDialogOpen(true)}>
                        <FiGlobe className="w-4 h-4 mr-2" />
                        Crawl Website
                    </Button>
                </div>
                <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search files and folders..."
                            value={searchQuery}
                            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                            className="pl-10"
                        />
                    </div>
                    {selectedIds.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={() => setShowBulkDelete(true)}
                        >
                            <FiTrash2 className="w-4 h-4 mr-2" />
                            Delete {selectedIds.length}
                        </Button>
                    )}
                    <Card className="p-1 flex items-center">
                        <button
                            onClick={() => dispatch(setViewMode('table'))}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <FiList className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => dispatch(setViewMode('grid'))}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <FiGrid className="w-4 h-4" />
                        </button>
                    </Card>
                </div>
            </div>

            {}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Spinner className="w-8 h-8" />
                    </div>
                ) : folders.length === 0 && documents.length === 0 ? (
                    <Card
                        className={`text-center py-20 transition-all ${dragOverFolder === currentFolderId ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                        onDragOver={(e) => handleDragOver(e, currentFolderId)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, currentFolderId)}
                    >
                        <FiFolder className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                            {searchQuery ? 'No items found' : 'This folder is empty'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : draggedItem
                                    ? 'Drop here to move the item to this folder'
                                    : 'Create folders to organize your documents or add documents directly'}
                        </p>
                        {!searchQuery && !draggedItem && (
                            <div className="flex gap-2 justify-center">
                                <Button variant="outline" onClick={() => setFolderDialogOpen(true)}>
                                    <FiFolderPlus className="w-4 h-4 mr-2" />
                                    New Folder
                                </Button>
                                <Button onClick={() => setDocumentDialogOpen(true)}>
                                    <FiPlus className="w-4 h-4 mr-2" />
                                    Add Document
                                </Button>
                            </div>
                        )}
                    </Card>
                ) : viewMode === 'table' ? (
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedIds.length > 0 && selectedIds.length === folders.length + documents.length}
                                            onChange={() => dispatch(toggleSelectAll())}
                                        />
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Updated</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {folders.map((folder) => (
                                    <TableRow
                                        key={folder.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
                                        onDragOver={(e) => handleDragOver(e, folder.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, folder.id)}
                                        className={`cursor-pointer transition-all ${dragOverFolder === folder.id ? 'bg-primary/5 ring-2 ring-primary' : ''
                                            } ${selectedIds.includes(folder.id) ? 'bg-muted/50' : ''}`}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.includes(folder.id)}
                                                onChange={() => dispatch(toggleSelection(folder.id))}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </TableCell>
                                        <TableCell onClick={() => handleNavigateToFolder(folder.id, folder.name)}>
                                            <div className="flex items-center gap-3">
                                                {getIcon(folder.icon) || <FiFolder className="w-5 h-5 text-blue-500" />}
                                                <div>
                                                    <div className="font-medium">{folder.name}</div>
                                                    {folder.description && (
                                                        <div className="text-sm text-muted-foreground">{folder.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">Folder</Badge>
                                        </TableCell>
                                        <TableCell>-</TableCell>
                                        <TableCell>-</TableCell>
                                        <TableCell>{folder.updatedAt ? new Date(folder.updatedAt).toLocaleDateString() : '-'}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon">
                                                        <FiMoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditItem('folder', folder)}>
                                                        <FiEdit2 className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteItemId({ type: 'folder', id: folder.id })}
                                                        className="text-destructive"
                                                    >
                                                        <FiTrash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {documents.map((doc) => (
                                    <TableRow
                                        key={doc.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, 'document', doc.id)}
                                        className={`cursor-pointer ${selectedIds.includes(doc.id) ? 'bg-muted/50' : ''}`}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.includes(doc.id)}
                                                onChange={() => dispatch(toggleSelection(doc.id))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <FiFileText className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <div className="font-medium">{doc.name}</div>
                                                    {doc.title && (
                                                        <div className="text-sm text-muted-foreground">{doc.title}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{doc.fileType}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(doc.processingStatus)}
                                                {getStatusBadge(doc.processingStatus)}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatSize(doc.fileSize)}</TableCell>
                                        <TableCell>{new Date(doc.updatedAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <FiMoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => {
                                                        import('@/lib/utils/document-actions').then(({ previewDocument }) => {
                                                            previewDocument(doc.id)
                                                        })
                                                    }}>
                                                        <Icons.FiEye className="w-4 h-4 mr-2" />
                                                        Preview
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        import('@/lib/utils/document-actions').then(({ downloadDocument }) => {
                                                            downloadDocument(doc.id, doc.title || doc.name)
                                                        })
                                                    }}>
                                                        <Icons.FiDownload className="w-4 h-4 mr-2" />
                                                        Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleEditItem('document', doc)}>
                                                        <FiEdit2 className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteItemId({ type: 'document', id: doc.id })}
                                                        className="text-destructive"
                                                    >
                                                        <FiTrash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {folders.map((folder) => (
                            <Card
                                key={folder.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
                                onDragOver={(e) => handleDragOver(e, folder.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, folder.id)}
                                className={`p-4 cursor-pointer hover:shadow-lg transition-all ${dragOverFolder === folder.id ? 'ring-2 ring-primary bg-primary/5' : ''
                                    } ${selectedIds.includes(folder.id) ? 'ring-2 ring-primary' : ''}`}
                                onClick={() => handleNavigateToFolder(folder.id, folder.name)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        {getIcon(folder.icon) || <FiFolder className="w-6 h-6 text-blue-500" />}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Checkbox
                                            checked={selectedIds.includes(folder.id)}
                                            onChange={() => dispatch(toggleSelection(folder.id))}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <FiMoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditItem('folder', folder)}>
                                                    <FiEdit2 className="w-4 h-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setDeleteItemId({ type: 'folder', id: folder.id })}
                                                    className="text-destructive"
                                                >
                                                    <FiTrash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <h3 className="font-medium truncate mb-1">{folder.name}</h3>
                                {folder.description && folder.description !== '' && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{folder.description}</p>
                                )}
                            </Card>
                        ))}
                        {documents.map((doc) => (
                            <Card
                                key={doc.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'document', doc.id)}
                                className={`p-4 cursor-pointer hover:shadow-lg transition-all ${selectedIds.includes(doc.id) ? 'ring-2 ring-primary' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-500/10 flex items-center justify-center">
                                        <FiFileText className="w-6 h-6 text-gray-500" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Checkbox
                                            checked={selectedIds.includes(doc.id)}
                                            onChange={() => dispatch(toggleSelection(doc.id))}
                                        />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <FiMoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    import('@/lib/utils/document-actions').then(({ previewDocument }) => {
                                                        previewDocument(doc.id)
                                                    })
                                                }}>
                                                    <Icons.FiEye className="w-4 h-4 mr-2" />
                                                    Preview
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    import('@/lib/utils/document-actions').then(({ downloadDocument }) => {
                                                        downloadDocument(doc.id, doc.title || doc.name)
                                                    })
                                                }}>
                                                    <Icons.FiDownload className="w-4 h-4 mr-2" />
                                                    Download
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleEditItem('document', doc)}>
                                                    <FiEdit2 className="w-4 h-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setDeleteItemId({ type: 'document', id: doc.id })}
                                                    className="text-destructive"
                                                >
                                                    <FiTrash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <h3 className="font-medium truncate mb-1">{doc.name}</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    {getStatusIcon(doc.processingStatus)}
                                    <span className="text-xs text-muted-foreground">{doc.processingStatus}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{doc.fileType}</span>
                                    <span>{formatSize(doc.fileSize)}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {}
            <KBFolderDialog
                open={folderDialogOpen}
                onOpenChange={setFolderDialogOpen}
                onSubmit={handleCreateFolder}
            />

            <KBDocumentDialog
                open={documentDialogOpen}
                onOpenChange={setDocumentDialogOpen}
                onSubmit={handleCreateDocument}
            />

            <KBQueryDialog
                open={queryDialogOpen}
                onOpenChange={setQueryDialogOpen}
                onQuery={handleQuery}
            />

            <KBChatDialog
                open={chatDialogOpen}
                onOpenChange={setChatDialogOpen}
                knowledgeBaseId={kbId}
                knowledgeBaseName={kb?.name || 'Knowledge Base'}
            />

            <KBSettingsDialog
                open={settingsDialogOpen}
                onOpenChange={setSettingsDialogOpen}
                knowledgeBase={kb}
                onSave={handleSaveSettings}
            />

            <KBCrawlerDialog
                open={crawlerDialogOpen}
                onOpenChange={setCrawlerDialogOpen}
                knowledgeBaseId={kbId}
                onSuccess={() => dispatch(refreshData({ kbId, folderId: currentFolderId }))}
            />

            <AlertDialogConfirm
                open={deleteItemId !== null}
                onOpenChange={(open) => !open && setDeleteItemId(null)}
                title={`Delete ${deleteItemId?.type === 'folder' ? 'Folder' : 'Document'}`}
                description={
                    deleteItemId?.type === 'folder'
                        ? 'This will delete the folder and all its contents. This action cannot be undone.'
                        : 'This will delete the document and its embeddings. This action cannot be undone.'
                }
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                variant="destructive"
            />

            <KBItemEditDialog
                open={editingItem !== null}
                onOpenChange={(open) => !open && setEditingItem(null)}
                item={editingItem?.item || null}
                type={editingItem?.type || 'folder'}
                onSubmit={handleSaveEdit}
            />

            <AlertDialogConfirm
                open={showBulkDelete}
                onOpenChange={setShowBulkDelete}
                title={`Delete ${selectedIds.length} Item(s)`}
                description={`Are you sure you want to delete ${selectedIds.length} item(s)? This action cannot be undone.`}
                confirmText="Delete All"
                cancelText="Cancel"
                onConfirm={handleBulkDelete}
                variant="destructive"
            />
        </div>
    )
}
