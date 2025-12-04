'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, AlertCircle, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { axiosClient } from '@/lib/axios-client';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
}

interface ChatInterfaceProps {
    conversationId: string;
    botName?: string;
    onSendMessage: (content: string) => Promise<void>;
    onLoadMore?: (before: string) => Promise<Message[]>;
    className?: string;
}

export function ChatInterface({
    conversationId,
    botName = 'AI Assistant',
    onSendMessage,
    onLoadMore,
    className,
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageIdRef = useRef<string | null>(null);
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        loadInitialMessages();
    }, [conversationId]);

    const loadInitialMessages = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axiosClient.get(`/conversations/${conversationId}/messages`, {
                params: { limit: 50 }
            });
            
            const msgs = Array.isArray(response.data) ? response.data : response.data.messages || [];
            
            setMessages(msgs.reverse());
            setHasMore(msgs.length >= 50);
            
            if (msgs.length > 0) {
                lastMessageIdRef.current = msgs[0].id;
            }
        } catch (err) {
            setError('Failed to load conversation');
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
            isInitialLoadRef.current = false;
        }
    };

    useEffect(() => {
        if (!isInitialLoadRef.current && messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleScroll = useCallback(
        async (e: React.UIEvent<HTMLDivElement>) => {
            const target = e.target as HTMLDivElement;
            const scrollTop = target.scrollTop;

            if (scrollTop < 50 && hasMore && !loadingMore && onLoadMore) {
                setLoadingMore(true);

                try {
                    const oldScrollHeight = target.scrollHeight;
                    const oldScrollTop = target.scrollTop;

                    const firstMessageId = messages[0]?.id;
                    if (!firstMessageId) return;

                    const olderMessages = await onLoadMore(firstMessageId);

                    if (olderMessages.length === 0) {
                        setHasMore(false);
                    } else {
                        setMessages((prev) => [...olderMessages.reverse(), ...prev]);

                        setTimeout(() => {
                            const newScrollHeight = target.scrollHeight;
                            target.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
                        }, 0);
                    }
                } catch (err) {
                    toast.error('Failed to load more messages');
                } finally {
                    setLoadingMore(false);
                }
            }
        },
        [messages, hasMore, loadingMore, onLoadMore]
    );

    const handleSend = async () => {
        if (!input.trim() || sending) return;

        const userMessage: Message = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setSending(true);

        try {
            await onSendMessage(input.trim());
        } catch (err) {
            toast.error('Failed to send message');
            setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (loading) {
        return (
            <div className={cn('flex items-center justify-center h-full', className)}>
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn('flex flex-col items-center justify-center h-full', className)}>
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={loadInitialMessages} variant="outline" className="mt-4">
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {}
            <ScrollArea
                ref={scrollAreaRef}
                className="flex-1 px-4"
                onScroll={handleScroll}
            >
                {}
                {loadingMore && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                )}

                {}
                {!hasMore && messages.length > 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                        Beginning of conversation
                    </div>
                )}

                {}
                <div className="space-y-4 py-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                Start a conversation with {botName}
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                botName={botName}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {}
            <div className="border-t p-4">
                <div className="flex gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        className="min-h-[60px] max-h-[200px] resize-none"
                        disabled={sending}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        size="icon"
                        className="h-[60px] w-[60px]"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}

interface MessageBubbleProps {
    message: Message;
    botName: string;
}

function MessageBubble({ message, botName }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={cn(isUser ? 'bg-primary' : 'bg-muted')}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </AvatarFallback>
            </Avatar>

            <div className={cn('flex flex-col gap-1', isUser && 'items-end')}>
                <span className="text-xs text-muted-foreground">
                    {isUser ? 'You' : botName}
                </span>
                <div
                    className={cn(
                        'rounded-lg px-4 py-2 max-w-[80%]',
                        isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                    )}
                >
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                    </p>
                </div>
                <span className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString()}
                </span>
            </div>
        </div>
    );
}
