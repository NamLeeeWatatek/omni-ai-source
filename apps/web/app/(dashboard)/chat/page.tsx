'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import { useWorkspace } from '@/lib/hooks/useWorkspace'
import {
    getAIConversations,
    createAIConversation,
    updateAIConversation,
    deleteAIConversation,
} from '@/lib/api/conversations'
import { botsApi, type Bot } from '@/lib/api/bots'
import { getKnowledgeBases } from '@/lib/api/knowledge-base'
import type { AiConversation, AiMessage } from '@/lib/types/conversations'
import type { KnowledgeBase } from '@/lib/types/knowledge-base'
import {
    FiSend,
    FiCopy,
    FiCheck,
    FiMessageCircle,
    FiSettings,
    FiZap,
    FiBook,
    FiRefreshCw,
    FiUser,
    FiCpu,
    FiPlus,
    FiTrash2,
    FiEdit2,
} from 'react-icons/fi'

export default function ChatWithAIPage() {
    const { currentWorkspace } = useWorkspace()
    const [conversations, setConversations] = useState<AiConversation[]>([])
    const [currentConversation, setCurrentConversation] = useState<AiConversation | null>(null)
    const [messages, setMessages] = useState<AiMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [bots, setBots] = useState<Bot[]>([])
    const [selectedBot, setSelectedBot] = useState<string>('none')
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
    const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>([])
    const [useKnowledgeBase, setUseKnowledgeBase] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [editingConversationId, setEditingConversationId] = useState<string | null>(null)
    const [editingTitle, setEditingTitle] = useState('')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
    const [creatingConversation, setCreatingConversation] = useState(false)
    const [savingSettings, setSavingSettings] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (currentWorkspace?.id) {
            loadBots()
            loadKnowledgeBases()
        }
    }, [currentWorkspace?.id])

    useEffect(() => {
        loadConversations()
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const loadBots = async () => {
        try {
            if (!currentWorkspace) return
            const data = await botsApi.getAll(currentWorkspace.id, 'active')
            const activeBots = Array.isArray(data) ? data.filter((b: Bot) => b.status === 'active') : []
            setBots(activeBots)
        } catch (error) {
            toast.error('Failed to load bots')
        }
    }

    const loadKnowledgeBases = async () => {
        try {
            if (!currentWorkspace) {
                return
            }
            const data = await getKnowledgeBases(currentWorkspace.id)
            const kbList = Array.isArray(data) ? data : []
            setKnowledgeBases(kbList)
            if (kbList.length === 0) {
            }
        } catch (error) {
            setKnowledgeBases([])
        }
    }

    const loadConversations = async () => {
        try {
            setLoadingConversations(true)
            const data = await getAIConversations()
            const convList = Array.isArray(data)
                ? data.filter((c: any) => c && c.id)
                : []
            setConversations(convList)
        } catch (error) {
            setConversations([])
        } finally {
            setLoadingConversations(false)
        }
    }

    const createNewConversation = async () => {
        if (creatingConversation) return

        try {
            setCreatingConversation(true)
            const newConv = await createAIConversation({
                title: 'New Chat',
                botId: selectedBot !== 'none' ? selectedBot : undefined,
                useKnowledgeBase: useKnowledgeBase,
                metadata: {
                    knowledgeBaseIds: selectedKnowledgeBases,
                },
            })

            setConversations((prev) => [newConv, ...prev])
            setCurrentConversation(newConv)
            setMessages([])

            toast.success('New conversation created')
        } catch (error) {
            toast.error('Failed to create conversation')
        } finally {
            setCreatingConversation(false)
        }
    }

    const selectConversation = (conv: AiConversation) => {
            id: conv.id,
            botId: conv.botId,
            useKnowledgeBase: conv.useKnowledgeBase,
            metadata: conv.metadata,
        })

        setCurrentConversation(conv)
        setMessages(conv.messages || [])
        
        if (conv.botId) {
            setSelectedBot(conv.botId)
        } else {
            setSelectedBot('none')
        }
        
        if (conv.useKnowledgeBase !== undefined) {
            setUseKnowledgeBase(conv.useKnowledgeBase)
        }
        
        if (conv.metadata?.knowledgeBaseIds && Array.isArray(conv.metadata.knowledgeBaseIds)) {
            setSelectedKnowledgeBases(conv.metadata.knowledgeBaseIds)
        } else {
            setSelectedKnowledgeBases([])
        }
    }

    const updateConversationTitle = async (id: string, title: string) => {
        if (!title.trim()) {
            setEditingConversationId(null)
            return
        }

        const oldConversations = [...conversations]
        const oldCurrentConversation = currentConversation

        setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, title } : c))
        )
        if (currentConversation?.id === id) {
            setCurrentConversation({ ...currentConversation, title })
        }
        setEditingConversationId(null)

        try {
            await updateAIConversation(id, { title })
            toast.success('Title updated')
        } catch (error) {
            setConversations(oldConversations)
            setCurrentConversation(oldCurrentConversation)
            toast.error('Failed to update title')
        }
    }

    const openDeleteDialog = (id: string) => {
        setConversationToDelete(id)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!conversationToDelete) return

        const id = conversationToDelete

        const oldConversations = [...conversations]
        const oldCurrentConversation = currentConversation
        const oldMessages = [...messages]

        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (currentConversation?.id === id) {
            setCurrentConversation(null)
            setMessages([])
        }

        try {
            await deleteAIConversation(id)
            toast.success('Conversation deleted')
        } catch (error) {
            setConversations(oldConversations)
            setCurrentConversation(oldCurrentConversation)
            setMessages(oldMessages)
            toast.error('Failed to delete conversation')
        } finally {
            setConversationToDelete(null)
        }
    }

    const handleSend = async () => {
        if (!input.trim() || loading) return

        let conversationId = currentConversation?.id
        let newConversation: AiConversation | null = null

        if (!conversationId) {
            try {
                setCreatingConversation(true)
                const newConv = await createAIConversation({
                    title: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
                    botId: selectedBot !== 'none' ? selectedBot : undefined,
                    useKnowledgeBase: useKnowledgeBase,
                })
                newConversation = newConv
                conversationId = newConv.id

                setConversations((prev) => [newConv, ...prev])
                setCurrentConversation(newConv)
                setCreatingConversation(false)
            } catch (error) {
                toast.error('Failed to create conversation')
                setCreatingConversation(false)
                return
            }
        }

        const userMessage: AiMessage = {
            role: 'user',
            content: input,
            timestamp: new Date().toISOString(),
        }

        const currentMessages = newConversation ? [] : messages
        const updatedMessages = [...currentMessages, userMessage]
        setMessages(updatedMessages)
        setInput('')
        setLoading(true)

        try {
            let responseText = ''
            let sources: any[] = []
            let modelName = 'gemini-2.5-flash'

                selectedBot,
                useKnowledgeBase,
                knowledgeBaseIds: selectedKnowledgeBases,
            })

            if (selectedBot !== 'none') {
                const bot = bots.find((b) => b.id === selectedBot)
                modelName = bot?.aiModelName || modelName

                const res = await botsApi.chat(
                    selectedBot,
                    input,
                    updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    useKnowledgeBase ? selectedKnowledgeBases : undefined
                )
                responseText = res.response
                sources = res.sources || []
            } else {
                const res = await axiosClient.post('/knowledge-bases/chat', {
                    message: input,
                    model: modelName,
                    conversationHistory: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                })
                const data = res.data || res
                responseText = data.answer || data.response || 'No response'
            }

            const assistantMessage: AiMessage = {
                role: 'assistant',
                content: responseText,
                timestamp: new Date().toISOString(),
                metadata: {
                    bot: selectedBot !== 'none' ? bots.find(b => b.id === selectedBot)?.name : undefined,
                    model: modelName,
                    sources: sources.length > 0 ? sources : undefined,
                },
            }

            const finalMessages = [...updatedMessages, assistantMessage]
            setMessages(finalMessages)

            if (conversationId) {
                await updateConversationMessages(conversationId, finalMessages)
            }

        } catch (error) {
            toast.error('Failed to get AI response')
        } finally {
            setLoading(false)
        }
    }

    const updateConversationMessages = async (id: string, messages: AiMessage[]) => {
        try {
            await updateAIConversation(id, { messages })
            setConversations((prev) =>
                prev.map((c) => (c.id === id ? { ...c, messages, updatedAt: new Date().toISOString() } : c))
            )
        } catch (error) {
        }
    }

    const updateConversationSettings = async () => {
        if (!currentConversation) {
            toast.error('Please create a conversation first')
            return
        }

        try {
            setSavingSettings(true)
                botId: selectedBot !== 'none' ? selectedBot : null,
                useKnowledgeBase,
                knowledgeBaseIds: selectedKnowledgeBases,
            })

            await updateAIConversation(currentConversation.id, {
                botId: selectedBot !== 'none' ? selectedBot : undefined,
                useKnowledgeBase,
                metadata: {
                    knowledgeBaseIds: selectedKnowledgeBases,
                },
            })
            
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === currentConversation.id
                        ? {
                              ...c,
                              botId: selectedBot !== 'none' ? selectedBot : null,
                              useKnowledgeBase,
                              metadata: {
                                  ...c.metadata,
                                  knowledgeBaseIds: selectedKnowledgeBases,
                              },
                          }
                        : c
                )
            )
            
            setCurrentConversation((prev) =>
                prev
                    ? {
                          ...prev,
                          botId: selectedBot !== 'none' ? selectedBot : null,
                          useKnowledgeBase,
                          metadata: {
                              ...prev.metadata,
                              knowledgeBaseIds: selectedKnowledgeBases,
                          },
                      }
                    : null
            )

            toast.success('Settings saved successfully')
        } catch (error) {
            toast.error('Failed to save settings')
        } finally {
            setSavingSettings(false)
        }
    }

    const handleCopy = (content: string, index: number) => {
        navigator.clipboard.writeText(content)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
        toast.success('Copied!')
    }

    const clearChat = () => {
        setCurrentConversation(null)
        setMessages([])
        toast.success('Ready for new chat')
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (days === 0) return 'Today'
        if (days === 1) return 'Yesterday'
        if (days < 7) return `${days} days ago`
        return date.toLocaleDateString()
    }

    const selectedBotData = bots.find((b) => b.id === selectedBot)

    return (
        <div className="h-full flex">
            {}
            <aside className="w-80 border-r border-border/40 flex flex-col bg-background">
                {}
                <div className="p-4 border-b border-border/40">
                    <Button
                        onClick={createNewConversation}
                        className="w-full"
                        size="lg"
                        disabled={creatingConversation}
                    >
                        {creatingConversation ? (
                            <>
                                <Spinner className="w-4 h-4 mr-2" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <FiPlus className="w-5 h-5 mr-2" />
                                New Chat
                            </>
                        )}
                    </Button>
                </div>

                {}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loadingConversations ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Spinner className="w-8 h-8" />
                            <p className="text-sm text-muted-foreground">Loading conversations...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                <FiMessageCircle className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold mb-1">No conversations yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Start a new chat to begin your AI conversation
                            </p>
                            <Button
                                onClick={createNewConversation}
                                size="sm"
                                disabled={creatingConversation}
                            >
                                <FiPlus className="w-4 h-4 mr-2" />
                                Create First Chat
                            </Button>
                        </div>
                    ) : (
                        conversations.filter(conv => conv && conv.id).map((conv) => (
                            <div
                                key={conv.id}
                                className={`group relative rounded-lg p-3 cursor-pointer transition-all duration-200 ${currentConversation?.id === conv.id
                                    ? 'bg-primary/10 border border-primary/40 shadow-sm'
                                    : 'hover:bg-muted/50 border border-transparent hover:shadow-sm'
                                    }`}
                                onClick={() => selectConversation(conv)}
                            >
                                {editingConversationId === conv.id ? (
                                    <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onBlur={() => updateConversationTitle(conv.id, editingTitle)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                updateConversationTitle(conv.id, editingTitle)
                                            }
                                            if (e.key === 'Escape') {
                                                setEditingConversationId(null)
                                            }
                                        }}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-sm truncate">
                                                    {conv.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(conv.updatedAt)}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 hover:bg-primary/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingConversationId(conv.id)
                                                        setEditingTitle(conv.title)
                                                    }}
                                                    title="Edit title"
                                                >
                                                    <FiEdit2 className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openDeleteDialog(conv.id)
                                                    }}
                                                    title="Delete conversation"
                                                >
                                                    <FiTrash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        {conv.messages && conv.messages.length > 0 && (
                                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                                {conv.messages[conv.messages.length - 1]?.content}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {}
            <div className="flex-1 flex flex-col">
                {}
                <header className="border-b border-border/40 bg-background flex-shrink-0">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">
                                {currentConversation?.title || 'Chat with AI'}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {currentConversation
                                    ? `${messages.length} messages`
                                    : 'Start a new conversation'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSettings(!showSettings)}
                            >
                                <FiSettings className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                            {currentConversation && (
                                <Button variant="outline" size="sm" onClick={clearChat}>
                                    <FiRefreshCw className="w-4 h-4 mr-2" />
                                    New Chat
                                </Button>
                            )}
                        </div>
                    </div>

                    {}
                    {showSettings && (
                        <div className="border-t border-border/40 bg-gradient-to-b from-muted/30 to-muted/10">
                            <div className="max-w-6xl mx-auto p-6 space-y-6">
                                {}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <FiSettings className="w-5 h-5" />
                                            Chat Configuration
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Customize your AI chat experience
                                        </p>
                                    </div>
                                    <Button
                                        onClick={updateConversationSettings}
                                        disabled={!currentConversation || savingSettings}
                                        size="sm"
                                    >
                                        {savingSettings ? (
                                            <>
                                                <Spinner className="w-4 h-4 mr-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FiCheck className="w-4 h-4 mr-2" />
                                                Save Settings
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold flex items-center gap-2">
                                        <FiMessageCircle className="w-4 h-4" />
                                        Select Bot
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {}
                                        <Card
                                            className={`p-4 cursor-pointer transition-all duration-200 ${selectedBot === 'none'
                                                ? 'border-primary bg-primary/5 shadow-md'
                                                : 'hover:border-primary/40 hover:shadow-sm'
                                                }`}
                                            onClick={() => setSelectedBot('none')}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
                                                    <FiCpu className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm">Direct AI</h4>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Chat directly with AI without bot configuration
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>

                                        {}
                                        {bots.map((bot) => (
                                            <Card
                                                key={bot.id}
                                                className={`p-4 cursor-pointer transition-all duration-200 ${selectedBot === bot.id
                                                    ? 'border-primary bg-primary/5 shadow-md'
                                                    : 'hover:border-primary/40 hover:shadow-sm'
                                                    }`}
                                                onClick={() => setSelectedBot(bot.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
                                                        <FiMessageCircle className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm truncate">{bot.name}</h4>
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {bot.description || 'No description'}
                                                        </p>
                                                        {bot.aiModelName && (
                                                            <Badge variant="secondary" className="text-xs mt-2">
                                                                <FiZap className="w-3 h-3 mr-1" />
                                                                {bot.aiModelName}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {}
                                {selectedBot !== 'none' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold flex items-center gap-2">
                                                <FiBook className="w-4 h-4" />
                                                Knowledge Sources
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="enable-kb"
                                                    checked={useKnowledgeBase}
                                                    onChange={(e) => {
                                                        setUseKnowledgeBase(e.target.checked)
                                                        if (!e.target.checked) {
                                                            setSelectedKnowledgeBases([])
                                                        }
                                                    }}
                                                    className="rounded"
                                                />
                                                <label
                                                    htmlFor="enable-kb"
                                                    className="text-sm cursor-pointer"
                                                >
                                                    Enable Knowledge Base
                                                </label>
                                            </div>
                                        </div>

                                        {useKnowledgeBase && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                {knowledgeBases.length === 0 ? (
                                                    <div className="col-span-full text-center py-8 px-4 border border-dashed border-border/40 rounded-lg">
                                                        <FiBook className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                        <p className="text-sm text-muted-foreground">
                                                            No knowledge bases available
                                                        </p>
                                                    </div>
                                                ) : (
                                                    knowledgeBases.map((kb) => {
                                                        const isSelected = selectedKnowledgeBases.includes(kb.id)
                                                        return (
                                                            <Card
                                                                key={kb.id}
                                                                className={`p-4 cursor-pointer transition-all duration-200 ${isSelected
                                                                    ? 'border-primary bg-primary/5 shadow-md'
                                                                    : 'hover:border-primary/40 hover:shadow-sm'
                                                                    }`}
                                                                onClick={() => {
                                                                    setSelectedKnowledgeBases((prev) =>
                                                                        isSelected
                                                                            ? prev.filter((id) => id !== kb.id)
                                                                            : [...prev, kb.id]
                                                                    )
                                                                }}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected
                                                                        ? 'bg-gradient-to-br from-green-600 to-emerald-700'
                                                                        : 'bg-gradient-to-br from-amber-600 to-orange-700'
                                                                        }`}>
                                                                        {isSelected ? (
                                                                            <FiCheck className="w-5 h-5 text-white" />
                                                                        ) : (
                                                                            <FiBook className="w-5 h-5 text-white" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-semibold text-sm truncate">{kb.name}</h4>
                                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                            {kb.description || 'No description'}
                                                                        </p>
                                                                        {kb.totalDocuments !== undefined && (
                                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                                {kb.totalDocuments} documents
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        )}

                                        {selectedKnowledgeBases.length > 0 && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
                                                <FiCheck className="w-4 h-4 text-primary" />
                                                <span>
                                                    {selectedKnowledgeBases.length} knowledge source{selectedKnowledgeBases.length > 1 ? 's' : ''} selected
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {}
                                {selectedBot !== 'none' && selectedBotData && (
                                    <div className="bg-muted/50 rounded-lg p-4 border border-border/40">
                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <FiZap className="w-4 h-4" />
                                            Current Configuration
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                            <div>
                                                <p className="text-muted-foreground text-xs">Bot</p>
                                                <p className="font-medium">{selectedBotData.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs">AI Model</p>
                                                <p className="font-medium">{selectedBotData.aiModelName || 'gemini-2.5-flash'}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs">Knowledge Base</p>
                                                <p className="font-medium">
                                                    {useKnowledgeBase
                                                        ? `${selectedKnowledgeBases.length} source${selectedKnowledgeBases.length !== 1 ? 's' : ''}`
                                                        : 'Disabled'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                {}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 min-h-0">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center max-w-2xl">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
                                    <FiMessageCircle className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-3">
                                    Start chatting with AI
                                </h2>
                                <p className="text-muted-foreground mb-8">
                                    Select a bot to test its behavior, or chat directly with AI.
                                    Enable knowledge base to get answers from your documents.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Card
                                        className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
                                        onClick={() => setInput('How can you help me?')}
                                    >
                                        <h3 className="font-semibold mb-1">General Question</h3>
                                        <p className="text-sm text-muted-foreground">
                                            How can you help me?
                                        </p>
                                    </Card>
                                    <Card
                                        className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
                                        onClick={() =>
                                            setInput('Explain your capabilities')
                                        }
                                    >
                                        <h3 className="font-semibold mb-1">Capabilities</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Explain your capabilities
                                        </p>
                                    </Card>
                                    <Card
                                        className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
                                        onClick={() =>
                                            setInput('What documents do you have access to?')
                                        }
                                    >
                                        <h3 className="font-semibold mb-1">Knowledge Base</h3>
                                        <p className="text-sm text-muted-foreground">
                                            What documents do you have?
                                        </p>
                                    </Card>
                                    <Card
                                        className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
                                        onClick={() =>
                                            setInput('Tell me about your features')
                                        }
                                    >
                                        <h3 className="font-semibold mb-1">Features</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Tell me about your features
                                        </p>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-6">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                        }`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
                                            <FiCpu className="w-5 h-5 text-white" />
                                        </div>
                                    )}

                                    <div
                                        className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'order-first' : ''
                                            }`}
                                    >
                                        <div
                                            className={`rounded-2xl p-4 ${message.role === 'user'
                                                ? 'bg-primary text-primary-foreground ml-auto'
                                                : 'bg-muted'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm">
                                                        {message.role === 'user' ? 'You' : message.metadata?.bot || 'AI'}
                                                    </span>
                                                    {message.metadata?.model && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {message.metadata.model}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs opacity-70">
                                                        {formatTime(message.timestamp)}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => handleCopy(message.content, index)}
                                                    >
                                                        {copiedIndex === index ? (
                                                            <FiCheck className="w-3 h-3" />
                                                        ) : (
                                                            <FiCopy className="w-3 h-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                                <p className="whitespace-pre-wrap">{message.content}</p>
                                            </div>

                                            {}
                                            {/* {message.metadata?.sources && message.metadata.sources.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-border/40">
                                                    <div className="flex items-center gap-2 text-xs font-medium mb-2">
                                                        <FiBook className="w-3 h-3" />
                                                        Sources ({message.metadata.sources.length})
                                                    </div>
                                                    <div className="space-y-1">
                                                        {message.metadata.sources.slice(0, 3).map((source: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                className="text-xs p-2 rounded bg-background/50 border border-border/40"
                                                            >
                                                                <div className="font-medium truncate">
                                                                    {source.metadata?.filename || source.metadata?.title || 'Document'}
                                                                </div>
                                                                <div className="text-muted-foreground truncate">
                                                                    {source.content?.substring(0, 100)}...
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )} */}
                                        </div>
                                    </div>

                                    {message.role === 'user' && (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-600/30">
                                            <FiUser className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30 animate-pulse">
                                        <FiCpu className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 max-w-[80%]">
                                        <div className="rounded-2xl p-4 bg-muted">
                                            <div className="flex items-center gap-3">
                                                <Spinner className="w-4 h-4" />
                                                <span className="text-sm text-muted-foreground">
                                                    AI is thinking...
                                                </span>
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {}
                <div className="border-t border-border/40 bg-background p-6 flex-shrink-0">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSend()
                                        }
                                    }}
                                    placeholder="Type your message... (Shift+Enter for new line)"
                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-border/40 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[56px] max-h-[200px]"
                                    rows={1}
                                    disabled={loading}
                                />
                            </div>
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                size="lg"
                                className="px-6 rounded-xl"
                            >
                                {loading ? (
                                    <Spinner className="w-4 h-4" />
                                ) : (
                                    <>
                                        <FiSend className="w-5 h-5 mr-2" />
                                        Send
                                    </>
                                )}
                            </Button>
                        </div>

                        {selectedBot !== 'none' && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <FiZap className="w-3 h-3" />
                                <span>
                                    Chatting with {selectedBotData?.name || 'bot'}
                                    {useKnowledgeBase && ' with knowledge base'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {}
            <AlertDialogConfirm
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Conversation"
                description="Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently deleted."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    )
}
