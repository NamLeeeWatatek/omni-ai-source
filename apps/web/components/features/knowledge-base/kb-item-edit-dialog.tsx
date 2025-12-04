"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { IconPicker } from '@/components/ui/icon-picker'
import type { KBFolder, KBDocument } from '@/lib/types/knowledge-base'

interface KBItemEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: KBFolder | KBDocument | null
    type: 'folder' | 'document'
    onSubmit: (data: { name: string; description?: string; icon?: string }) => Promise<void>
}

export function KBItemEditDialog({
    open,
    onOpenChange,
    item,
    type,
    onSubmit,
}: KBItemEditDialogProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [icon, setIcon] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (item) {
            setName(item.name)
            setDescription((item as any).description || '')
            setIcon((item as any).icon || '')
        } else {
            setName('')
            setDescription('')
            setIcon('')
        }
    }, [item])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        try {
            setLoading(true)
            await onSubmit({
                name: name.trim(),
                description: description.trim(),
                icon: icon || undefined,
            })
            onOpenChange(false)
        } catch {

        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Edit {type === 'folder' ? 'Folder' : 'Document'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={`${type === 'folder' ? 'Folder' : 'Document'} name`}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description"
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label htmlFor="icon">Icon</Label>
                            <IconPicker
                                value={icon}
                                onChange={setIcon}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
