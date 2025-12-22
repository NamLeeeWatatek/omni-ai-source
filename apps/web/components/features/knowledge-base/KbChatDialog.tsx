import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import { FiMessageSquare, FiTrash2 } from 'react-icons/fi'
import { createAIConversation, getAIConversation, addAIConversationMessage } from '@/lib/api/conversations'
import toast from '@/lib/toast'

interface KBChatDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    knowledgeBaseId: string
    knowledgeBaseName: string
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: string
}

export function KBChatDialog({ open, onOpenChange, knowledgeBaseId, knowledgeBaseName }: KBChatDialogProps) {
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loadingMessages, setLoadingMessages] = useState(false)

    useEffect(() => {
        if (open && !conversationId) {
            initConversation()
        }
    }, [open])

    const initConversation = async () => {
        try {
            setLoadingMessages(true)

            const conversation = await createAIConversation({
                title: `Chat with ${knowledgeBaseName}`,
                useKnowledgeBase: true,
            })

            setConversationId(conversation.id)

            const fullConversation = await getAIConversation(conversation.id)
            setMessages((fullConversation.messages || []).map((m: any) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                createdAt: m.createdAt,
            })))
        } catch {

            toast.error('Failed to start conversation')
        } finally {
            setLoadingMessages(false)
        }
    }

    const handleChat = async () => {
        if (!message.trim() || !conversationId) return

        const userMessage = message
        setMessage('')
        setLoading(true)

        const tempUserMsg: Message = {
            id: 'temp-' + Date.now(),
            role: 'user',
            content: userMessage,
            createdAt: new Date().toISOString(),
        }
        setMessages(prev => [...prev, tempUserMsg])

        try {
            const updatedConversation = await addAIConversationMessage(conversationId, {
                content: userMessage,
                role: 'user',
                timestamp: new Date().toISOString(),
                metadata: {
                    knowledgeBaseId,
                    useKnowledgeBase: true,
                },
            })

            const userMessages = (updatedConversation.messages || []).map((m: any) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                createdAt: m.createdAt || m.timestamp,
            }))
            setMessages(userMessages)

            const { generateKBAnswer } = await import('@/lib/api/knowledge-base')
            const answerResponse = await generateKBAnswer({
                question: userMessage,
                knowledgeBaseId,
                conversationHistory: userMessages.map(m => ({
                    role: m.role,
                    content: m.content,
                })),
            })

            const finalConversation = await addAIConversationMessage(conversationId, {
                content: answerResponse.answer,
                role: 'assistant',
                timestamp: new Date().toISOString(),
                metadata: {
                    sources: answerResponse.sources,
                },
            })

            setMessages((finalConversation.messages || []).map((m: any) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                createdAt: m.createdAt || m.timestamp,
            })))
        } catch {

            toast.error('Failed to send message')
            setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
        } finally {
            setLoading(false)
        }
    }

    const handleClear = async () => {
        if (!conversationId) return

        try {
            await initConversation()
            toast.success('Conversation cleared')
        } catch {
            toast.error('Failed to clear conversation')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Chat with AI</DialogTitle>
                        {messages.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleClear}>
                                <FiTrash2 className="w-4 h-4 mr-2" />
                                New Chat
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-4">
                    {loadingMessages ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <LoadingLogo size="md" text="Loading conversation..." />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FiMessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Start a conversation with AI</p>
                            <p className="text-sm mt-1">Ask questions about your knowledge base</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <Card
                                    key={msg.id}
                                    className={`p-4 ${msg.role === 'user'
                                        ? 'bg-muted ml-8'
                                        : 'bg-primary/5 border-primary/20 mr-8'
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="font-medium text-xs text-muted-foreground uppercase">
                                            {msg.role === 'user' ? 'You' : 'AI'}
                                        </div>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap mt-1">{msg.content}</p>
                                </Card>
                            ))}
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <LoadingLogo size="sm" text="Thinking..." />
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={(e) => e.key === 'Enter' && !loading && handleChat()}
                        disabled={loading}
                    />
                    <Button onClick={handleChat} loading={loading} disabled={!message.trim()}>
                        {!loading && <FiMessageSquare className="w-4 h-4" />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

