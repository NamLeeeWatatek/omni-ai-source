'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageLoading } from '@/components/layout/PageLoading'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { IconPicker } from '@/components/ui/IconPicker'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/Dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form'

import axiosClient from '@/lib/axios-client'
import { useWorkspace } from '@/lib/hooks/useWorkspace'
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
import { botsApi, type Bot } from '@/lib/api/bots'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'
import { Badge } from '@/components/ui/Badge'

// Form validation schema
const botFormSchema = z.object({
    name: z.string().min(1, 'Bot name is required'),
    description: z.string().optional(),
    icon: z.string().optional(),
})

type BotFormValues = z.infer<typeof botFormSchema>

export default function BotsPage() {
    const router = useRouter()
    const [bots, setBots] = useState<Bot[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingBot, setEditingBot] = useState<Bot | null>(null)
    const { workspace, workspaceId } = useWorkspace()

    // Setup react-hook-form with zod validation
    const form = useForm<BotFormValues>({
        resolver: zodResolver(botFormSchema),
        defaultValues: {
            name: '',
            description: '',
            icon: 'FiMessageSquare',
        },
    })

    const loadBots = useCallback(async () => {
        if (!workspaceId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const data = await botsApi.getAll(workspaceId)
            setBots(Array.isArray(data) ? data : [])
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to load bots')
        } finally {
            setLoading(false)
        }
    }, [workspaceId])

    useEffect(() => {
        if (workspaceId) {
            loadBots()
        }
    }, [workspaceId])

    const openModal = (bot?: Bot) => {
        if (bot) {
            setEditingBot(bot)
            form.reset({
                name: bot.name,
                description: bot.description || '',
                icon: bot.icon || 'FiMessageSquare'
            })
        } else {
            setEditingBot(null)
            form.reset({
                name: '',
                description: '',
                icon: 'FiMessageSquare'
            })
        }
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingBot(null)
        form.reset()
    }

    const onSubmit = async (values: BotFormValues) => {
        if (!workspaceId) {
            toast.error('No workspace selected')
            return
        }

        try {
            if (editingBot) {
                await botsApi.update(editingBot.id, values)
                toast.success('Bot updated')
            } else {
                await botsApi.create({
                    ...values,
                    workspaceId: workspaceId
                })
                toast.success('Bot created')
            }
            closeModal()
            loadBots()
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to save bot'
            toast.error(message)
        }
    }

    const [deleteId, setDeleteId] = useState<string | null>(null)

    const deleteBot = async (id: string) => {
        setDeleteId(id)
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        try {
            await botsApi.delete(deleteId)
            toast.success('Bot deleted')
            loadBots()
        } catch {
            toast.error('Failed to delete bot')
        }
    }

    const toggleStatus = async (bot: Bot) => {
        try {
            if (bot.status === 'active') {
                await botsApi.pause(bot.id)
            } else {
                await botsApi.activate(bot.id)
            }
            toast.success('Bot status updated')
            loadBots()
        } catch (error) {
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

            {
                loading && bots.length === 0 ? (
                    <PageLoading message="Loading bots..." />
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
                                                <Badge
                                                    variant={bot.status === 'active' ? 'default' : 'secondary'}
                                                    className={bot.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
                                                >
                                                    {bot.status === 'active' ? 'Active' : bot.status === 'paused' ? 'Paused' : 'Draft'}
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
                                            onClick={() => router.push(`/bots/${bot.id}`)}
                                        >
                                            <FiEdit2 className="w-4 h-4 mr-2" />
                                            Configure
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleStatus(bot)}
                                        >
                                            <FiActivity className="w-4 h-4" />
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
                )
            }

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBot ? 'Edit Bot' : 'Create Bot'}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bot Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="My Awesome Bot" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                rows={3}
                                                placeholder="Describe what this bot does..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeModal}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingBot ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            { }
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
        </div >
    )
}
