'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    FiSend,
    FiSearch,
    FiFilter,
    FiMoreVertical,
    FiRefreshCw
} from 'react-icons/fi'
import { fetchAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface Message {
    id: number
    conversation_id: number
    sender_type: string
    sender_id: string
    content: string
    created_at: string
}

interface Conversation {
    id: number
    customer_name: string
    customer_id: string
    channel_name: string
    channel_icon?: string
    last_message_content: string
    last_message_at: string
    unread_count: number
    status: string
}

export default function InboxPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('active')

    useEffect(() => {
        loadConversations()
    }, [searchQuery, statusFilter])

    useEffect(() => {
        if (selectedConv) {
            loadMessages(selectedConv.id)
        }
    }, [selectedConv])

    const loadConversations = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                status: statusFilter,
                limit: '50'
            })
            if (searchQuery) params.append('search', searchQuery)

            const data = await fetchAPI(`/conversations/?${params}`)
            setConversations(data.conversations || [])

            // Auto-select first conversation
            if (data.conversations?.length > 0 && !selectedConv) {
                setSelectedConv(data.conversations[0])
            }
        } catch (e: any) {
            toast.error('Failed to load conversations')
        } finally {
            setLoading(false)
        }
    }

    const loadMessages = async (convId: number) => {
        try {
            const data = await fetchAPI(`/conversations/${convId}/messages`)
            setMessages(data.messages || [])

            // Mark as read
            await fetchAPI(`/conversations/${convId}/read`, { method: 'POST' })

            // Update unread count locally
            setConversations(prev => prev.map(c =>
                c.id === convId ? { ...c, unread_count: 0 } : c
            ))
        } catch (e: any) {
            console.error('Failed to load messages', e)
        }
    }

    const sendMessage = async () => {
        if (!message.trim() || !selectedConv) return

        try {
            setSending(true)
            await fetchAPI(`/conversations/${selectedConv.id}/messages`, {
                method: 'POST',
                body: JSON.stringify({
                    content: message,
                    sender_type: 'agent'
                })
            })

            setMessage('')
            await loadMessages(selectedConv.id)
            toast.success('Message sent')
        } catch (e: any) {
            toast.error('Failed to send message')
        } finally {
            setSending(false)
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        if (days < 7) return `${days}d ago`
        return date.toLocaleDateString()
    }

    const formatMessageTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex">
            {/* Conversations List */}
            <div className="w-80 border-r border-border/40 flex flex-col">
                <div className="p-4 border-b border-border/40 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Inbox</h2>
                        <Button variant="ghost" size="sm" onClick={loadConversations}>
                            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${statusFilter === 'active' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setStatusFilter('closed')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${statusFilter === 'closed' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                }`}
                        >
                            Closed
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {loading && conversations.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <FiRefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                            <p>Loading conversations...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <p>No conversations found</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedConv(conv)}
                                className={`w-full p-4 border-b border-border/40 hover:bg-accent transition-colors text-left ${selectedConv?.id === conv.id ? 'bg-accent' : ''
                                    }`}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-wata flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-semibold text-sm">
                                            {conv.customer_name?.charAt(0) || '?'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-medium text-sm truncate">{conv.customer_name}</p>
                                            <span className="text-xs text-muted-foreground">
                                                {formatTime(conv.last_message_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {conv.last_message_content}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {conv.channel_name}
                                            </span>
                                            {conv.unread_count > 0 && (
                                                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-700 text-white text-xs font-medium">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Thread */}
            {selectedConv ? (
                <div className="flex-1 flex flex-col">
                    {/* Chat Header */}
                    <div className="h-16 border-b border-border/40 flex items-center justify-between px-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-wata flex items-center justify-center">
                                <span className="text-white font-semibold">
                                    {selectedConv.customer_name?.charAt(0) || '?'}
                                </span>
                            </div>
                            <div>
                                <p className="font-semibold">{selectedConv.customer_name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {selectedConv.channel_name} • {selectedConv.status}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm">
                            <FiMoreVertical className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-auto p-6 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender_type === 'customer' ? 'justify-start' : 'justify-end'}`}
                            >
                                <div
                                    className={`max-w-md px-4 py-2 rounded-2xl ${msg.sender_type === 'customer'
                                            ? 'bg-muted'
                                            : 'bg-gradient-wata text-white'
                                        }`}
                                >
                                    <p className="text-sm">{msg.content}</p>
                                    <p
                                        className={`text-xs mt-1 ${msg.sender_type === 'customer' ? 'text-muted-foreground' : 'text-white/70'
                                            }`}
                                    >
                                        {formatMessageTime(msg.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message Input */}
                    <div className="border-t border-border/40 p-4">
                        <div className="flex items-end space-x-2">
                            <div className="flex-1 glass rounded-lg border border-border/40 p-3">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    rows={1}
                                    className="w-full bg-transparent resize-none outline-none text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            sendMessage()
                                        }
                                    }}
                                />
                            </div>
                            <Button size="sm" disabled={!message.trim() || sending} onClick={sendMessage}>
                                <FiSend className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <p className="text-lg font-medium mb-2">No conversation selected</p>
                        <p className="text-sm">Select a conversation to start messaging</p>
                    </div>
                </div>
            )}
        </div>
    )
}
