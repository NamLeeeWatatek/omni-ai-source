'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import { fetchAPI } from '@/lib/api'
import toast from '@/lib/toast'
import {
    FiPlus,
    FiUpload,
    FiTrash2,
    FiEdit2,
    FiDatabase,
    FiFileText,
    FiSearch,
    FiRefreshCw
} from 'react-icons/fi'

interface KnowledgeDocument {
    id: string
    title: string
    content: string
    source: string
    metadata?: Record<string, any>
    created_at: string
    updated_at: string
    embedding_status: 'pending' | 'processing' | 'completed' | 'failed'
}

export default function KnowledgeBasePage() {
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null)
    const [deleteDocId, setDeleteDocId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        source: 'manual'
    })

    useEffect(() => {
        loadDocuments()
    }, [])

    const loadDocuments = async () => {
        try {
            setLoading(true)
            const data = await fetchAPI('/knowledge-base/documents')
            setDocuments(Array.isArray(data) ? data : data.documents || [])
        } catch (error) {
            console.error('Failed to load documents:', error)
            toast.error('Failed to load knowledge base')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            toast.error('Title and content are required')
            return
        }

        try {
            if (editingDoc) {
                await fetchAPI(`/knowledge-base/documents/${editingDoc.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(formData)
                })
                toast.success('Document updated')
            } else {
                await fetchAPI('/knowledge-base/documents', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                })
                toast.success('Document created and embedding started')
            }

            setDialogOpen(false)
            setEditingDoc(null)
            setFormData({ title: '', content: '', source: 'manual' })
            loadDocuments()
        } catch (error) {
            toast.error('Failed to save document')
        }
    }

    const handleEdit = (doc: KnowledgeDocument) => {
        setEditingDoc(doc)
        setFormData({
            title: doc.title,
            content: doc.content,
            source: doc.source
        })
        setDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteDocId) return

        try {
            await fetchAPI(`/knowledge-base/documents/${deleteDocId}`, {
                method: 'DELETE'
            })
            toast.success('Document deleted')
            setDocuments(prev => prev.filter(d => d.id !== deleteDocId))
        } catch (error) {
            toast.error('Failed to delete document')
        } finally {
            setDeleteDocId(null)
        }
    }

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="success">Embedded</Badge>
            case 'processing':
                return <Badge variant="default">Processing...</Badge>
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>
            default:
                return <Badge variant="default">Pending</Badge>
        }
    }

    return (
        <div className="h-full">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
                    <p className="text-muted-foreground">
                        Manage documents for AI-powered search and responses
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadDocuments}>
                        <FiRefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => {
                        setEditingDoc(null)
                        setFormData({ title: '', content: '', source: 'manual' })
                        setDialogOpen(true)
                    }}>
                        <FiPlus className="w-4 h-4 mr-2" />
                        Add Document
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="glass p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FiDatabase className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Documents</p>
                            <p className="text-2xl font-bold">{documents.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="glass p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <FiFileText className="w-5 h-5 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Embedded</p>
                            <p className="text-2xl font-bold">
                                {documents.filter(d => d.embedding_status === 'completed').length}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="glass p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <FiUpload className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Processing</p>
                            <p className="text-2xl font-bold">
                                {documents.filter(d => d.embedding_status === 'processing').length}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="glass p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <FiTrash2 className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Failed</p>
                            <p className="text-2xl font-bold">
                                {documents.filter(d => d.embedding_status === 'failed').length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Documents List */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner className="size-8 text-primary" />
                </div>
            ) : filteredDocs.length === 0 ? (
                <Card className="text-center py-20">
                    <FiFileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery ? 'Try adjusting your search' : 'Add your first document to get started'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={() => setDialogOpen(true)}>
                            <FiPlus className="w-4 h-4 mr-2" />
                            Add Document
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredDocs.map((doc) => (
                        <Card key={doc.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">{doc.title}</h3>
                                        {getStatusBadge(doc.embedding_status)}
                                        <Badge variant="outline" className="text-xs">
                                            {doc.source}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                        {doc.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>Created: {new Date(doc.created_at).toLocaleDateString()}</span>
                                        <span>Updated: {new Date(doc.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(doc)}
                                    >
                                        <FiEdit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteDocId(doc.id)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingDoc ? 'Edit Document' : 'Add Document'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Title</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Document title..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Content</label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Document content..."
                                rows={10}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Source</label>
                            <Input
                                value={formData.source}
                                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                placeholder="e.g., manual, upload, api"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingDoc ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialogConfirm
                open={deleteDocId !== null}
                onOpenChange={(open) => !open && setDeleteDocId(null)}
                title="Delete Document"
                description="Are you sure you want to delete this document? This will also remove its embeddings from the vector database."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                variant="destructive"
            />
        </div>
    )
}
