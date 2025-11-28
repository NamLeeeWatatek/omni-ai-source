'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchAPI } from '@/lib/api'
import toast from '@/lib/toast'
import { useAIModels } from '@/lib/hooks/use-ai-models'
import {
    FiSend,
    FiTrash2,
    FiCopy,
    FiCheck,
    FiMessageCircle,
    FiPlus,
    FiEdit2,
    FiMenu,
    FiX
} from 'react-icons/fi'

interface Message {
    id?: number
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    conversation_id?: number
}

interface Conversation {
    id: number
    title: string
    model: string
    message_count: number
    created_at: string
    updated_at: string
}



export default function AIAssistantPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [selectedModel, setSelectedModel] = useState('')
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [editingTitle, setEditingTitle] = useState<number | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const { getAvailableModels } = useAIModels()
    const models = getAvailableModels()

    useEffect(() => {
        loadConversations()
    }, [])

    useEffect(() => {
        if (models.length > 0 && !selectedModel) {
            setSelectedModel(models[0].model_name)
        }
    }, [models, selectedModel])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const loadConversations = async () => {
        try {
            setLoadingConversations(true)
            const data = await fetchAPI('/ai/conversations')
            setConversations(data)
        } catch (error) {
            console.error('Failed to load conversations:', error)
        } finally {
            setLoadingConversations(false)
        }
    }

    const loadMessages = async (conversationId: number) => {
        try {
            const data = await fetchAPI(`/ai/conversations/${conversationId}/messages`)
            setMessages(data.map((m: { created_at: string; role: 'user' | 'assistant'; content: string; id?: number; conversation_id?: number }) => ({
                ...m,
                timestamp: new Date(m.created_at)
            })))
        } catch (error) {
            console.error('Failed to load messages:', error)
        }
    }

    const createNewConversation = async () => {
        try {
            const data = await fetchAPI('/ai/conversations', {
                method: 'POST',
                body: JSON.stringify({
                    title: 'New Chat',
                    model: selectedModel
                })
            })
            setConversations(prev => [data, ...prev])
            setActiveConversation(data)
            setMessages([])
        } catch {
            toast.error('Failed to create conversation')
        }
    }

    const selectConversation = async (conv: Conversation) => {
        setActiveConversation(conv)
        setSelectedModel(conv.model || 'gemini-2.5-flash')
        await loadMessages(conv.id)
    }

    const [deleteConvId, setDeleteConvId] = useState<number | null>(null)

    const deleteConversation = async (convId: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteConvId(convId)
    }

    const confirmDeleteConversation = async () => {
        if (!deleteConvId) return

        try {
            await fetchAPI(`/ai/conversations/${deleteConvId}`, { method: 'DELETE' })
            setConversations(prev => prev.filter(c => c.id !== deleteConvId))
            if (activeConversation?.id === deleteConvId) {
                setActiveConversation(null)
                setMessages([])
            }
            toast.success('Conversation deleted')
        } catch {
            toast.error('Failed to delete conversation')
        }
    }

    const updateConversationTitle = async (convId: number) => {
        if (!editTitle.trim()) {
            setEditingTitle(null)
            return
        }

        try {
            await fetchAPI(`/ai/conversations/${convId}?title=${encodeURIComponent(editTitle)}`, {
                method: 'PATCH'
            })
            setConversations(prev => prev.map(c =>
                c.id === convId ? { ...c, title: editTitle } : c
            ))
            if (activeConversation?.id === convId) {
                setActiveConversation(prev => prev ? { ...prev, title: editTitle } : null)
            }
        } catch {
            toast.error('Failed to update title')
        }
        setEditingTitle(null)
    }


    const handleSend = async () => {
        if (!input.trim() || loading) return

        // Create conversation if none active
        let convId = activeConversation?.id
        if (!convId) {
            try {
                const newConv = await fetchAPI('/ai/conversations', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
                        model: selectedModel
                    })
                })
                setConversations(prev => [newConv, ...prev])
                setActiveConversation(newConv)
                convId = newConv.id
            } catch {
                toast.error('Failed to create conversation')
                return
            }
        }

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date(),
            conversation_id: convId
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            // Save user message
            await fetchAPI(`/ai/conversations/${convId}/messages`, {
                method: 'POST',
                body: JSON.stringify({
                    conversation_id: convId,
                    role: 'user',
                    content: input
                })
            })

            // Get AI response
            const response = await fetchAPI('/ai/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message: input,
                    model: selectedModel,
                    conversation_history: messages.map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            })

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.response,
                timestamp: new Date(),
                conversation_id: convId
            }

            // Save assistant message
            await fetchAPI(`/ai/conversations/${convId}/messages`, {
                method: 'POST',
                body: JSON.stringify({
                    conversation_id: convId,
                    role: 'assistant',
                    content: response.response
                })
            })

            setMessages(prev => [...prev, assistantMessage])

            // Update conversation in list
            setConversations(prev => prev.map(c =>
                c.id === convId
                    ? { ...c, message_count: c.message_count + 2, updated_at: new Date().toISOString() }
                    : c
            ))
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            toast.error('Failed to get AI response: ' + message)
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = (content: string, index: number) => {
        navigator.clipboard.writeText(content)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
        toast.success('Copied!')
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) return 'Today'
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return (
        <div className="full-screen-page flex">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${sidebarOpen ? 'w-72' : 'w-0 lg:w-16'}
                fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
                transition-all duration-300 ease-in-out
                border-r border-border/40 bg-background flex flex-col overflow-hidden
            `}>
                <div className="p-3 border-b border-border/40">
                    <Button
                        onClick={createNewConversation}
                        className="w-full justify-start gap-2"
                        variant="outline"
                    >
                        <FiPlus className="w-4 h-4" />
                        New Chat
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loadingConversations ? (
                        <div className="flex items-center justify-center py-8">
                            <Spinner className="size-5 text-muted-foreground" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No conversations yet
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => selectConversation(conv)}
                                className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${activeConversation?.id === conv.id
                                    ? 'bg-primary/10 border border-primary/20'
                                    : 'hover:bg-muted/50'
                                    }`}
                            >
                                <FiMessageCircle className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                    {editingTitle === conv.id ? (
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onBlur={() => updateConversationTitle(conv.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && updateConversationTitle(conv.id)}
                                            className="w-full bg-transparent border-b border-primary focus:outline-none text-sm"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <>
                                            <div className="text-sm font-medium truncate">{conv.title}</div>
                                            <div className="text-xs text-muted-foreground">{formatDate(conv.updated_at)}</div>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingTitle(conv.id)
                                            setEditTitle(conv.title)
                                        }}
                                        className="p-1 hover:bg-muted rounded"
                                    >
                                        <FiEdit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={(e) => deleteConversation(conv.id, e)}
                                        className="p-1 hover:bg-destructive/20 hover:text-destructive rounded"
                                    >
                                        <FiTrash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-14 border-b border-border/40 flex items-center justify-between px-4 sm:px-6 bg-background flex-shrink-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="flex-shrink-0"
                        >
                            {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                        </Button>
                        <div className="min-w-0 flex-1">
                            <h1 className="font-semibold text-base sm:text-lg truncate">
                                {activeConversation?.title || 'AI Assistant'}
                            </h1>
                            <p className="text-xs text-muted-foreground truncate">
                                {models.find(m => m.model_name === selectedModel)?.display_name || 'AI'}
                            </p>
                        </div>
                    </div>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="glass w-[160px] sm:w-[200px] border-border/40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {models.map((model) => (
                                <SelectItem key={model.model_name} value={model.model_name}>
                                    {model.display_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-4 min-h-0">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center max-w-lg">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
                                    <FiMessageCircle className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">How can I help you?</h2>
                                <p className="text-muted-foreground mb-6">
                                    Ask me anything about workflows, automation, or coding.
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {['How do I create a workflow?', 'Explain AI nodes', 'Help with automation', 'Best practices'].map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => setInput(q)}
                                            className="p-3 glass rounded-lg hover:bg-muted/50 text-left text-sm border border-border/40 hover:border-primary/40 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-blue-600/30">
                                            AI
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${message.role === 'user'
                                            ? 'bg-primary text-white'
                                            : 'glass border border-border/40'
                                            }`}
                                    >
                                        <div className="whitespace-pre-wrap break-words text-sm">
                                            {message.content}
                                        </div>
                                        <div className="flex items-center justify-between mt-1.5 gap-2">
                                            <span className={`text-[10px] ${message.role === 'user' ? 'text-white/60' : 'text-muted-foreground'}`}>
                                                {formatTime(message.timestamp)}
                                            </span>
                                            {message.role === 'assistant' && (
                                                <button
                                                    onClick={() => handleCopy(message.content, index)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    {copiedIndex === index ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-cyan-600/30">
                                            U
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-600/30">
                                        AI
                                    </div>
                                    <div className="glass border border-border/40 rounded-2xl px-4 py-2.5">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input */}
                <footer className="border-t border-border/40 p-4 sm:p-6 bg-background flex-shrink-0">
                    <div className="max-w-4xl mx-auto flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 glass rounded-xl px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-base"
                            disabled={loading}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            size="icon"
                            className="h-12 w-12 flex-shrink-0"
                        >
                            {loading ? <Spinner className="size-5" /> : <FiSend className="w-5 h-5" />}
                        </Button>
                    </div>
                </footer>
            </div>

            {/* Delete Conversation Confirmation Dialog */}
            <AlertDialogConfirm
                open={deleteConvId !== null}
                onOpenChange={(open) => !open && setDeleteConvId(null)}
                title="Delete Conversation"
                description="Are you sure you want to delete this conversation? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDeleteConversation}
                variant="destructive"
            />
        </div>
    )
}
