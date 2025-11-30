'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import { IconPicker } from '@/components/ui/icon-picker'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import axiosClient from '@/lib/axios-client'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { fetchFlows } from '@/lib/store/slices/flowsSlice'
import toast from '@/lib/toast'
import * as FiIcons from 'react-icons/fi'
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiRefreshCw,
    FiMessageSquare,
    FiActivity
} from 'react-icons/fi'

interface Bot {
    id: string
    name: string
    description?: string
    icon?: string
    is_active: boolean
    workspace_id: string
    created_at: string
    updated_at: string
    flow_id?: string | null
}

interface Flow {
    id: string
    name: string
}

export default function BotsPage() {
    const [bots, setBots] = useState<Bot[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingBot, setEditingBot] = useState<Bot | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: 'FiMessageSquare',
        flow_id: null as string | null
    })
    const dispatch = useAppDispatch()
    const { items: flows = [] } = useAppSelector((state: any) => state.flows || {})

    useEffect(() => {
        loadBots()
        dispatch(fetchFlows())
    }, [dispatch])

    const loadBots = async () => {
        try {
            setLoading(true)
            const data: any = await axiosClient.get('/bots/')
            setBots(Array.isArray(data) ? data : data.bots || [])
        } catch {
            toast.error('Failed to load bots')
        } finally {
            setLoading(false)
        }
    }

    const openModal = (bot?: Bot) => {
        if (bot) {
            setEditingBot(bot)
            setFormData({
                name: bot.name,
                description: bot.description || '',
                icon: bot.icon || 'FiMessageSquare',
                flow_id: bot.flow_id || null
            })
        } else {
            setEditingBot(null)
            setFormData({ name: '', description: '', icon: 'FiMessageSquare', flow_id: null })
        }
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingBot(null)
        setFormData({ name: '', description: '', icon: 'FiMessageSquare', flow_id: null })
    }

    const saveBot = async () => {
        if (!formData.name.trim()) {
            toast.error('Bot name is required')
            return
        }

        try {
            if (editingBot) {
                await axiosClient.patch(`/bots/${editingBot.id}`, formData)
                toast.success('Bot updated')
            } else {
                await axiosClient.post('/bots/', formData)
                toast.success('Bot created')
            }
            closeModal()
            loadBots()
        } catch {
            toast.error('Failed to save bot')
        }
    }

    const [deleteId, setDeleteId] = useState<string | null>(null)

    const deleteBot = async (id: string) => {
        setDeleteId(id)
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        try {
            await axiosClient.delete(`/bots/${deleteId}`)
            toast.success('Bot deleted')
            loadBots()
        } catch {
            toast.error('Failed to delete bot')
        }
    }

    const toggleStatus = async (bot: Bot) => {
        try {
            await axiosClient.patch(`/bots/${bot.id}`, {
                is_active: !bot.is_active
            })
            toast.success('Bot status updated')
            loadBots()
        } catch {
            toast.error('Failed to update status')
        }
    }

    return (
        <div className="h-full">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Bots</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your AI bots and automation
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={loadBots} disabled={loading}>
                        {loading ? (
                            <Spinner className="size-4 mr-2" />
                        ) : (
                            <FiRefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                    <Button onClick={() => openModal()}>
                        <FiPlus className="w-4 h-4 mr-2" />
                        Create Bot
                    </Button>
                </div>
            </div>

            {loading && bots.length === 0 ? (
                <div className="text-center py-12">
                    <Spinner className="size-8 text-primary" />
                </div>
            ) : bots.length === 0 ? (
                <Card className="text-center py-12">
                    <FiMessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No bots yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first bot to get started</p>
                    <Button onClick={() => openModal()}>
                        <FiPlus className="w-4 h-4 mr-2" />
                        Create Bot
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bots.map((bot) => {
                        const BotIcon = (FiIcons as any)[bot.icon || 'FiMessageSquare'] || FiMessageSquare
                        return (
                            <Card key={bot.id} className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {/* Icon Picker Button */}
                                        <div className="relative group">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-wata flex items-center justify-center cursor-pointer">
                                                <BotIcon className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <IconPicker
                                                    value={bot.icon || 'FiMessageSquare'}
                                                    onChange={async (icon) => {
                                                        try {
                                                            await axiosClient.patch(`/bots/${bot.id}`, { icon })
                                                            toast.success('Icon updated!')
                                                            loadBots()
                                                        } catch {
                                                            toast.error('Failed to update icon')
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{bot.name}</h3>
                                            <Badge variant={bot.is_active ? 'success' : 'default'}>
                                                {bot.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                                    {bot.description || 'No description'}
                                </p>

                                <div className="flex items-center gap-2 pt-4 border-t border-border/40">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => toggleStatus(bot)}
                                    >
                                        <FiActivity className="w-4 h-4 mr-2" />
                                        {bot.is_active ? 'Deactivate' : 'Activate'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openModal(bot)}
                                    >
                                        <FiEdit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteBot(bot.id)}
                                        className="text-destructive hover:bg-destructive/10"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBot ? 'Edit Bot' : 'Create Bot'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Bot Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="My Awesome Bot"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                placeholder="Describe what this bot does..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="flow">Flow</Label>
                            <Select
                                value={formData.flow_id || 'none'}
                                onValueChange={(value) => setFormData({ ...formData, flow_id: value === 'none' ? null : value })}
                            >
                                <SelectTrigger id="flow">
                                    <SelectValue placeholder="No flow (manual responses only)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No flow (manual responses only)</SelectItem>
                                    {flows.map((flow: any) => (
                                        <SelectItem key={flow.id} value={flow.id}>
                                            {flow.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Select which flow this bot should execute when it receives messages
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button onClick={saveBot}>
                            {editingBot ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialogConfirm
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Delete Bot"
                description="Are you sure you want to delete this bot? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    )
}
