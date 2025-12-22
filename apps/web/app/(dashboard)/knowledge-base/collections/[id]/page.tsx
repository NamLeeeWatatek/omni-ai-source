'use client'

import { useEffect, useCallback, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
    KbToolbar,
    KbGridView,
    KbTableView,
} from '@/components/features/knowledge-base'
import { cn } from '@/lib/utils'
import * as Icons from 'react-icons/fi'
import {
    FiFolder,
    FiMoreVertical,
    FiTrash2,
    FiEdit2,
    FiFileText,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiRefreshCw,
    FiDatabase,
    FiArrowLeft,
    FiPlus,
    FiGrid,
    FiList,
    FiSearch,
    FiFolderPlus,
    FiUpload,
    FiGlobe,
    FiEye,
    FiDownload,
} from 'react-icons/fi'
import toast from '@/lib/toast'

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
    selectPagination,
    setPagination,
    selectTotalCount,
} from '@/lib/store/slices/knowledgeBaseSlice'
import { queryKnowledgeBase, updateKnowledgeBase } from '@/lib/api/knowledge-base'
import type { KBFolder, KBDocument } from '@/lib/types/knowledge-base'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Spinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/DropdownMenu'
import { DataTable, type Column, type SortDirection } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { PageLoading } from '@/components/ui/PageLoading'

export default function KnowledgeBaseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const kbId = params.id as string

    // Global State
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
    const currentPage = useAppSelector((state) => state.knowledgeBase.currentPage)
    const pageSize = useAppSelector((state) => state.knowledgeBase.pageSize)
    const totalCount = useAppSelector(selectTotalCount)

    // UI Dialog State
    const [folderDialogOpen, setFolderDialogOpen] = useState(false)
    const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
    const [queryDialogOpen, setQueryDialogOpen] = useState(false)
    const [chatDialogOpen, setChatDialogOpen] = useState(false)
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
    const [crawlerDialogOpen, setCrawlerDialogOpen] = useState(false)
    const [deleteItemId, setDeleteItemId] = useState<{ type: 'folder' | 'document'; id: string } | null>(null)
    const [showBulkDelete, setShowBulkDelete] = useState(false)
    const [editingItem, setEditingItem] = useState<{ type: 'folder' | 'document'; item: KBFolder | KBDocument } | null>(null)

    // DataTable State (Sort local, Pagination/Search in Redux)
    const [sortColumn, setSortColumn] = useState('name')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

    // Helper Functions
    const formatSize = (bytes: string | number) => {
        const size = typeof bytes === 'string' ? parseInt(bytes) : bytes
        if (isNaN(size) || size === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(size) / Math.log(k))
        return Math.round(size / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <FiCheckCircle className="w-4 h-4 text-green-500" />
            case 'processing': return <FiClock className="w-4 h-4 text-blue-500 animate-spin" />
            case 'failed': return <FiAlertCircle className="w-4 h-4 text-red-500" />
            default: return <FiClock className="w-4 h-4 text-gray-500" />
        }
    }

    const getIcon = (iconName?: string | null) => {
        if (!iconName) return null
        const IconComponent = (Icons as any)[iconName]
        return IconComponent ? <IconComponent className="w-5 h-5" /> : null
    }

    // Data Loading Logic
    const loadData = useCallback(() => {
        const filters = { search: searchQuery }
        const sort = sortColumn ? [{ orderBy: sortColumn, order: (sortDirection || 'asc').toUpperCase() }] : undefined

        dispatch(loadKnowledgeBase({
            kbId,
            folderId: currentFolderId,
            params: {
                page: currentPage,
                limit: pageSize,
                filters: JSON.stringify(filters),
                sort: sort ? JSON.stringify(sort) : undefined
            }
        }))
    }, [dispatch, kbId, currentFolderId, currentPage, pageSize, searchQuery, sortColumn, sortDirection])

    useEffect(() => {
        loadData()
    }, [loadData])

    useEffect(() => {
        return () => {
            dispatch(resetState())
        }
    }, [dispatch])

    useEffect(() => {
        dispatch(setAutoRefreshing(hasProcessing))
        if (hasProcessing) {
            const interval = setInterval(() => {
                const filters = { search: searchQuery }
                const sort = sortColumn ? [{ orderBy: sortColumn, order: (sortDirection || 'asc').toUpperCase() }] : undefined

                dispatch(refreshData({
                    kbId,
                    folderId: currentFolderId,
                    params: {
                        page: currentPage,
                        limit: pageSize,
                        filters: JSON.stringify(filters),
                        sort: sort ? JSON.stringify(sort) : undefined
                    }
                }))
            }, 5000)
            return () => clearInterval(interval)
        }
    }, [dispatch, hasProcessing, kbId, currentFolderId, currentPage, pageSize, searchQuery, sortColumn, sortDirection])

    // Handlers
    const handleNavigateToFolder = (id: string, name: string) => {
        dispatch(setPagination({ page: 1, pageSize }))
        dispatch(navigateToFolder({ id, name }))
    }

    const handleNavigateToBreadcrumb = (index: number) => {
        dispatch(setPagination({ page: 1, pageSize }))
        dispatch(navigateToBreadcrumb(index))
    }

    const handleCreateFolder = async (data: { name: string; description: string }) => {
        try {
            await dispatch(createFolder({
                knowledgeBaseId: kbId,
                parentFolderId: currentFolderId,
                name: data.name,
                description: data.description
            })).unwrap()
            toast.success('Folder created')
            setFolderDialogOpen(false)
            loadData()
        } catch (error) {
            toast.error('Failed to create folder')
        }
    }

    const handleCreateDocument = async (data: { name: string; content: string }) => {
        try {
            await dispatch(createDocument({
                knowledgeBaseId: kbId,
                folderId: currentFolderId,
                name: data.name,
                content: data.content
            })).unwrap()
            toast.success('Document created')
            setDocumentDialogOpen(false)
            loadData()
        } catch (error) {
            toast.error('Failed to create document')
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        const files = Array.from(e.target.files)
        try {
            for (const file of files) {
                await dispatch(uploadDocument({ kbId, folderId: currentFolderId, file })).unwrap()
            }
            toast.success('Files uploaded successfully')
            loadData()
        } catch (error) {
            toast.error('Failed to upload files')
        }
    }

    const handleDelete = async () => {
        if (!deleteItemId) return
        try {
            if (deleteItemId.type === 'folder') await dispatch(removeFolder(deleteItemId.id)).unwrap()
            else await dispatch(removeDocument(deleteItemId.id)).unwrap()
            toast.success('Item deleted')
            loadData()
        } catch (error) {
            toast.error('Failed to delete item')
        } finally {
            setDeleteItemId(null)
        }
    }

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return
        try {
            const promises = selectedIds.map(id => {
                const isFolder = folders.some(f => f.id === id)
                return isFolder ? dispatch(removeFolder(id)).unwrap() : dispatch(removeDocument(id)).unwrap()
            })
            await Promise.all(promises)
            toast.success(`${selectedIds.length} items deleted`)
            dispatch(clearSelection())
            loadData()
        } catch (error) {
            toast.error('Failed to delete items')
        } finally {
            setShowBulkDelete(false)
        }
    }

    const handleDrop = async (targetFolderId: string | null) => {
        dispatch(setDragOverFolder(null))
        if (!draggedItem) return
        try {
            if (draggedItem.type === 'folder') {
                if (draggedItem.id === targetFolderId) return
                await dispatch(moveFolderToFolder({ folderId: draggedItem.id, targetFolderId })).unwrap()
            } else {
                await dispatch(moveDocumentToFolder({ documentId: draggedItem.id, targetFolderId })).unwrap()
            }
            toast.success('Item moved')
            loadData()
        } catch (error) {
            toast.error('Failed to move item')
        } finally {
            dispatch(setDraggedItem(null))
        }
    }

    const handleSaveEdit = async (data: { name: string; description?: string; icon?: string }) => {
        if (!editingItem) return
        try {
            if (editingItem.type === 'folder') {
                await dispatch(updateFolder({ id: editingItem.item.id, updates: data })).unwrap()
            } else {
                await dispatch(updateDocument({ id: editingItem.item.id, updates: data })).unwrap()
            }
            toast.success('Item updated')
            setEditingItem(null)
            loadData()
        } catch (error) {
            toast.error('Failed to update item')
        }
    }

    const handleSaveSettings = async (data: any) => {
        await updateKnowledgeBase(kbId, data)
        toast.success('Settings saved')
        setSettingsDialogOpen(false)
        loadData()
    }

    // DataTable Configuration
    const columns: Column[] = useMemo(() => [
        {
            key: 'selection',
            label: '',
            width: 50,
            render: (_: any, row: any) => (
                <div onClick={e => e.stopPropagation()} className="flex justify-center">
                    <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onChange={() => dispatch(toggleSelection(row.id))}
                    />
                </div>
            )
        },
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (value: any, row: any) => (
                <div
                    className="flex items-center gap-3 cursor-pointer py-1 group"
                    onClick={(e) => {
                        if (row.type === 'folder') {
                            e.stopPropagation();
                            handleNavigateToFolder(row.id, row.name);
                        }
                    }}
                >
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                        row.type === 'folder' ? "bg-blue-500/10 text-blue-500" : "bg-muted/50 text-muted-foreground"
                    )}>
                        {row.type === 'folder' ? (getIcon(row.icon) || <FiFolder className="w-5 h-5" />) : <FiFileText className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{value}</div>
                        {row.description && <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 font-medium">{row.description}</div>}
                    </div>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Type',
            width: 100,
            render: (value: any, row: any) => (
                <Badge variant={row.type === 'folder' ? 'outline' : 'secondary'} className="font-black text-[10px] py-0.5 px-2 rounded-lg uppercase">
                    {row.type === 'folder' ? 'Folder' : (row.fileType || 'Text')}
                </Badge>
            )
        },
        {
            key: 'processingStatus',
            label: 'Status',
            width: 150,
            render: (value: any, row: any) => row.type === 'document' ? (
                <div className="flex items-center gap-2">
                    {getStatusIcon(value)}
                    <span className="text-[10px] font-bold capitalize">{value}</span>
                </div>
            ) : <span className="text-muted-foreground/30">—</span>
        },
        {
            key: 'fileSize',
            label: 'Size',
            width: 100,
            render: (value: any, row: any) => row.type === 'document' ? (
                <span className="text-xs font-bold text-muted-foreground">{formatSize(value)}</span>
            ) : <span className="text-muted-foreground/30">—</span>
        },
        {
            key: 'updatedAt',
            label: 'Updated',
            sortable: true,
            width: 120,
            render: (value: any) => <span className="text-xs font-medium text-muted-foreground">{new Date(value).toLocaleDateString()}</span>
        },
        {
            key: 'actions',
            label: '',
            width: 60,
            render: (_: any, row: any) => (
                <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted font-bold">
                                <FiMoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-premium border-border/50 bg-card/90 backdrop-blur-xl">
                            {row.type === 'document' && (
                                <>
                                    <DropdownMenuItem className="rounded-xl flex items-center gap-2 font-bold cursor-pointer p-3" onClick={() => {
                                        import('@/lib/utils/document-actions').then(({ previewDocument }) => previewDocument(row.id))
                                    }}>
                                        <FiEye className="w-4 h-4" /> Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-xl flex items-center gap-2 font-bold cursor-pointer p-3" onClick={() => {
                                        import('@/lib/utils/document-actions').then(({ downloadDocument }) => downloadDocument(row.id, row.title || row.name))
                                    }}>
                                        <FiDownload className="w-4 h-4" /> Download
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/50 my-1" />
                                </>
                            )}
                            <DropdownMenuItem className="rounded-xl flex items-center gap-2 font-bold cursor-pointer p-3" onClick={() => setEditingItem({ type: row.type, item: row })}>
                                <FiEdit2 className="w-4 h-4 text-primary" /> Edit Properties
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl flex items-center gap-2 font-bold cursor-pointer p-3 text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setDeleteItemId({ type: row.type, id: row.id })}>
                                <FiTrash2 className="w-4 h-4" /> Delete Item
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ], [selectedIds, dispatch, handleNavigateToFolder])

    const tableData = useMemo(() => {
        const folderItems = (currentPage === 1) ? folders.map(f => ({
            id: f.id,
            name: f.name,
            type: 'folder' as const,
            description: f.description || undefined,
            fileSize: undefined,
            processingStatus: undefined,
            updatedAt: f.updatedAt || new Date().toISOString(),
            icon: f.icon || undefined
        })) : []
        const documentItems = documents.map(d => ({
            id: d.id,
            name: d.name,
            type: 'document' as const,
            description: undefined,
            fileSize: d.fileSize,
            processingStatus: d.processingStatus,
            updatedAt: d.updatedAt || new Date().toISOString(),
            icon: undefined
        }))
        return [...folderItems, ...documentItems]
    }, [folders, documents, currentPage])

    const pagination = useMemo(() => ({
        page: currentPage,
        limit: pageSize,
        total: totalCount,
        hasNextPage: currentPage * pageSize < totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
    }), [currentPage, pageSize, totalCount])



    if (loading && !kb) return <PageLoading message="Loading collection..." />
    if (!kb) return (
        <div className="flex flex-col items-center justify-center h-full">
            <FiDatabase className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-xl font-bold mb-2">Collection Not Found</h2>
            <Button variant="outline" onClick={() => router.push('/knowledge-base/collections')} className="rounded-xl"><FiArrowLeft className="w-4 h-4 mr-2" /> Back to Collections</Button>
        </div>
    )

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/10 border border-white/10" style={{ backgroundColor: kb.color }}>
                        <FiDatabase className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">{kb.name}</h1>
                        <p className="text-sm text-muted-foreground font-medium">{kb.description || 'No description available'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={loadData}
                        disabled={loading}
                        className="rounded-xl border-border/60 hover:bg-muted/50 h-10 px-4"
                    >
                        <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="outline" onClick={() => setQueryDialogOpen(true)} className="rounded-xl border-border/60 hover:bg-muted/50 h-10 font-bold"><FiDatabase className="w-4 h-4 mr-2 text-primary" /> Query KB</Button>
                    <Button variant="outline" onClick={() => setChatDialogOpen(true)} className="rounded-xl border-border/60 hover:bg-muted/50 h-10 font-bold text-primary"><FiMoreVertical className="w-4 h-4 mr-2" /> Chat</Button>
                    <Button onClick={() => setSettingsDialogOpen(true)} className="rounded-xl shadow-lg shadow-primary/20 h-10 px-6 font-bold">Settings</Button>
                </div>
            </div>

            {stats && <KBStatsCards stats={stats} />}
            <KBProcessingStatus knowledgeBaseId={kbId} />

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <KBBreadcrumbs
                    rootName={kb.name}
                    breadcrumbs={breadcrumbs}
                    onNavigate={handleNavigateToBreadcrumb}
                    onDrop={handleDrop}
                    dragOverId={dragOverFolder}
                />
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setFolderDialogOpen(true)} className="rounded-lg h-9"><FiFolderPlus className="w-4 h-4 mr-2" /> Folder</Button>
                    <Button variant="outline" size="sm" onClick={() => setDocumentDialogOpen(true)} className="rounded-lg h-9"><FiPlus className="w-4 h-4 mr-2" /> Doc</Button>
                    <Button variant="outline" size="sm" onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()} className="rounded-lg h-9"><FiUpload className="w-4 h-4 mr-2" /> Upload</Button>
                    <Button variant="outline" size="sm" onClick={() => setCrawlerDialogOpen(true)} className="rounded-lg h-9"><FiGlobe className="w-4 h-4 mr-2" /> Crawl</Button>
                    <input type="file" className="hidden" multiple onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt,.md,.csv,.json" />
                </div>
            </div>

            <KbToolbar
                searchQuery={searchQuery}
                viewMode={viewMode}
                isLoading={loading}
                onSearchChange={(query) => dispatch(setSearchQuery(query))}
                onViewModeChange={(mode) => dispatch(setViewMode(mode))}
                onRefresh={loadData}
                onCreateFolder={() => setFolderDialogOpen(true)}
                onCreateDocument={() => setDocumentDialogOpen(true)}
                onUploadFile={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                onCrawlWebsite={() => setCrawlerDialogOpen(true)}
            />

            {viewMode === 'table' ? (
                <KbTableView
                    items={tableData}
                    selectedIds={selectedIds}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    isLoading={loading}
                    onItemClick={(item) => item.type === 'folder' && handleNavigateToFolder(item.id, item.name)}
                    onToggleSelection={(id) => dispatch(toggleSelection(id))}
                    onSort={(column, direction) => {
                        setSortColumn(column);
                        setSortDirection(direction as SortDirection);
                    }}
                    onEditItem={(item) => setEditingItem({ type: item.type, item: item as unknown as KBFolder | KBDocument })}
                    onDeleteItem={(item) => setDeleteItemId({ type: item.type, id: item.id })}
                    onPreviewDocument={(id) => {
                        import('@/lib/utils/document-actions').then(({ previewDocument }) => previewDocument(id));
                    }}
                    onDownloadDocument={(id, filename) => {
                        import('@/lib/utils/document-actions').then(({ downloadDocument }) => downloadDocument(id, filename));
                    }}
                />
            ) : (
                <KbGridView
                    items={tableData}
                    selectedIds={selectedIds}
                    draggedItem={draggedItem}
                    dragOverFolder={dragOverFolder}
                    isLoading={loading}
                    onItemClick={(item) => item.type === 'folder' && handleNavigateToFolder(item.id, item.name)}
                    onToggleSelection={(id) => dispatch(toggleSelection(id))}
                    onDragStart={(item) => dispatch(setDraggedItem({ type: item.type, id: item.id }))}
                    onDragOver={(folderId) => dispatch(setDragOverFolder(folderId))}
                    onDrop={(targetFolderId) => handleDrop(targetFolderId)}
                    onEditItem={(item) => setEditingItem({ type: item.type, item: item as unknown as KBFolder | KBDocument })}
                    onDeleteItem={(item) => setDeleteItemId({ type: item.type, id: item.id })}
                    onPreviewDocument={(id) => {
                        import('@/lib/utils/document-actions').then(({ previewDocument }) => previewDocument(id));
                    }}
                    onDownloadDocument={(id, filename) => {
                        import('@/lib/utils/document-actions').then(({ downloadDocument }) => downloadDocument(id, filename));
                    }}
                />
            )}

            {pagination.total > 0 && (
                <div className="pt-6 border-t border-border/40 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground font-medium">
                        Showing <span className="text-foreground">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="text-foreground">{totalCount}</span> items
                    </p>
                    <Pagination
                        pagination={pagination}
                        onPageChange={(p) => dispatch(setPagination({ page: p, pageSize }))}
                        onPageSizeChange={(s) => dispatch(setPagination({ page: 1, pageSize: s }))}
                    />
                </div>
            )}
            <KBFolderDialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen} onSubmit={handleCreateFolder} />
            <KBDocumentDialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen} onSubmit={handleCreateDocument} />
            <KBQueryDialog open={queryDialogOpen} onOpenChange={setQueryDialogOpen} onQuery={async (q) => (await queryKnowledgeBase({ query: q, knowledgeBaseId: kbId, limit: 5 })).results} />
            <KBChatDialog open={chatDialogOpen} onOpenChange={setChatDialogOpen} knowledgeBaseId={kbId} knowledgeBaseName={kb.name} />
            <KBSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} knowledgeBase={kb} onSave={handleSaveSettings} />
            <KBCrawlerDialog open={crawlerDialogOpen} onOpenChange={setCrawlerDialogOpen} knowledgeBaseId={kbId} onSuccess={() => loadData()} />
            <KBItemEditDialog open={editingItem !== null} onOpenChange={(o) => !o && setEditingItem(null)} item={editingItem?.item || null} type={editingItem?.type || 'folder'} onSubmit={handleSaveEdit} />
            <AlertDialogConfirm open={deleteItemId !== null} onOpenChange={(o) => !o && setDeleteItemId(null)} title={`Delete ${deleteItemId?.type}`} description="This action cannot be undone." onConfirm={handleDelete} variant="destructive" />
            <AlertDialogConfirm open={showBulkDelete} onOpenChange={setShowBulkDelete} title={`Delete ${selectedIds.length} items`} description="This will permanently remove selected items." onConfirm={handleBulkDelete} variant="destructive" />
        </div>
    )
}
