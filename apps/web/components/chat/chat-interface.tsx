'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, AlertCircle, Bot, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import { TiptapEditor } from '@/components/chat/tiptap-editor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { axiosClient } from '@/lib/axios-client';
import { useConversationsSocket } from '@/lib/hooks/useConversationsSocket';
import { useMessagesStore, type Message } from '@/lib/stores/messages-store';

interface ChatInterfaceProps {
    conversationId: string;
    botName?: string;
    customerName?: string;
    isChannelConversation?: boolean;
    onSendMessage: (content: string) => Promise<void>;
    className?: string;
    // ✅ NEW: Specify who is sending (for correct role assignment)
    senderRole?: 'user' | 'assistant';
}

export function ChatInterface({
    conversationId,
    botName = 'AI Assistant',
    customerName = 'Customer',
    isChannelConversation = false,
    onSendMessage,
    className,
    senderRole = 'assistant', // ✅ Default: Agent/Bot sending (for channel conversations)
}: ChatInterfaceProps) {
    // ✅ Get current user info
    const { data: session } = useSession();
    const currentUserName = session?.user?.name || session?.user?.email || 'You';

    // ✅ Zustand store
    const messages = useMessagesStore((state) => state.getMessages(conversationId));
    const loading = useMessagesStore((state) => state.isLoading(conversationId));
    const loadingMore = useMessagesStore((state) => state.loadingMore[conversationId] || false);
    const hasMore = useMessagesStore((state) => state.hasMore[conversationId] ?? true);
    const oldestMessageId = useMessagesStore((state) => state.oldestMessageId[conversationId]);
    
    const setMessages = useMessagesStore((state) => state.setMessages);
    const prependMessages = useMessagesStore((state) => state.prependMessages);
    const appendMessage = useMessagesStore((state) => state.appendMessage);
    const removeMessage = useMessagesStore((state) => state.removeMessage);
    const setLoading = useMessagesStore((state) => state.setLoading);
    const setLoadingMore = useMessagesStore((state) => state.setLoadingMore);
    const setHasMore = useMessagesStore((state) => state.setHasMore);
    const setOldestMessageId = useMessagesStore((state) => state.setOldestMessageId);

    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isInitialLoadRef = useRef(true);
    const isLoadingOldMessagesRef = useRef(false);
    const lastMessageInListRef = useRef<string | null>(null);
    const lastLoadedOldestIdRef = useRef<string | null>(null); // Track last loaded ID to prevent duplicate loads

    // ✅ Professional: Use react-intersection-observer
    const { ref: loadMoreTriggerRef, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    // ✅ FIX: Socket for real-time messages
    const { joinConversation, leaveConversation } = useConversationsSocket({
        onNewMessage: useCallback((message: any) => {
            console.log('[Socket] New message received:', message);
            
            // Only add if it's for this conversation
            if (message.conversationId === conversationId) {
                console.log('[Socket] Adding new message to Zustand store:', message.id);
                
                appendMessage(conversationId, {
                    id: message.id,
                    role: message.role,
                    content: message.content,
                    conversationId: message.conversationId,
                    createdAt: message.sentAt || message.createdAt || new Date().toISOString()
                });
            } else {
                console.log('[Socket] Message for different conversation, skipping');
            }
        }, [conversationId, appendMessage]),
        enabled: true
    });

    // Join conversation room on mount
    useEffect(() => {
        console.log('[ChatInterface] Effect triggered:', { 
            conversationId, 
            hasJoinFunction: !!joinConversation,
            hasLeaveFunction: !!leaveConversation 
        });
        
        if (conversationId) {
            if (joinConversation) {
                console.log('[ChatInterface] Calling joinConversation for:', conversationId);
                joinConversation(conversationId);
            } else {
                console.error('[ChatInterface] joinConversation is undefined!');
            }
            
            return () => {
                if (leaveConversation) {
                    console.log('[ChatInterface] Calling leaveConversation for:', conversationId);
                    leaveConversation(conversationId);
                }
            };
        } else {
            console.warn('[ChatInterface] No conversationId provided');
        }
    }, [conversationId, joinConversation, leaveConversation]);

    // ✅ Define scrollToBottom first
    const scrollToBottom = useCallback((smooth = true) => {
        requestAnimationFrame(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({
                    behavior: smooth ? 'smooth' : 'auto',
                    block: 'end'
                });
            }
        });
    }, []);

    const loadInitialMessages = useCallback(async () => {
        try {
            setLoading(conversationId, true);
            setError(null);

            const response = await axiosClient.get(`/conversations/${conversationId}/messages`, {
                params: { limit: 10 }
            });

            const msgs = Array.isArray(response.data) ? response.data : response.data.messages || [];

            // ✅ Add conversationId to each message
            const messagesWithConvId = msgs.map((msg: any) => ({
                ...msg,
                conversationId
            }));

            console.log('[LoadInitial] Loaded messages:', {
                count: msgs.length,
                hasMore: msgs.length === 10,
                oldestId: msgs.length > 0 ? msgs[0].id : null
            });

            setMessages(conversationId, messagesWithConvId);
            setHasMore(conversationId, msgs.length === 10);

            if (msgs.length > 0) {
                setOldestMessageId(conversationId, msgs[0].id);
            }

            // ✅ Auto scroll to bottom after loading messages
            setTimeout(() => {
                scrollToBottom(false);
            }, 50);
        } catch (err) {
            console.error('Failed to load messages:', err);
            setError('Failed to load conversation');
            toast.error('Failed to load messages');
        } finally {
            setLoading(conversationId, false);
            isInitialLoadRef.current = false;
        }
    }, [conversationId, scrollToBottom, setLoading, setMessages, setHasMore, setOldestMessageId]);

    useEffect(() => {
        loadInitialMessages();
    }, [loadInitialMessages]);

    useEffect(() => {
        if (messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        const lastMessageId = lastMessage?.id;

        // ✅ Check if this is a NEW message at the END (not old messages prepended)
        const isNewMessage = lastMessageId !== lastMessageInListRef.current;
        
        if (isNewMessage && !isInitialLoadRef.current && !isLoadingOldMessagesRef.current) {
            // ✅ Use RAF to avoid layout thrashing
            requestAnimationFrame(() => {
                const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
                
                if (scrollContainer) {
                    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
                    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
                    
                    // Only auto-scroll if user is within 200px of bottom
                    if (distanceFromBottom < 200) {
                        scrollToBottom(true);
                    }
                } else {
                    scrollToBottom(true);
                }
            });
        }
        
        // Update last message ID
        lastMessageInListRef.current = lastMessageId;
    }, [messages, scrollToBottom]);

    const loadMoreMessages = useCallback(async () => {
        console.log('[LoadMore] Triggered:', { loadingMore, hasMore, oldestMessageId });
        
        if (loadingMore || !hasMore || !oldestMessageId) {
            console.log('[LoadMore] Skipped - conditions not met');
            return;
        }

        // ✅ Mark that we're loading old messages
        isLoadingOldMessagesRef.current = true;
        setLoadingMore(conversationId, true);
        console.log('[LoadMore] Starting load before:', oldestMessageId);

        try {
            // ✅ Find scroll container - try multiple selectors
            let scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
            
            if (!scrollContainer) {
                // Try alternative selector
                scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
            }
            
            if (!scrollContainer) {
                console.log('[LoadMore] ❌ No scroll container found, loading without scroll restoration');
                // Continue loading but without scroll restoration
            }

            const oldScrollHeight = scrollContainer?.scrollHeight || 0;
            const oldScrollTop = scrollContainer?.scrollTop || 0;
            
            console.log('[LoadMore] Scroll state:', { oldScrollHeight, oldScrollTop });

            // ✅ Load older messages using 'before' parameter
            const response = await axiosClient.get(`/conversations/${conversationId}/messages`, {
                params: { 
                    limit: 10, 
                    before: oldestMessageId
                }
            });

            const olderMessages = Array.isArray(response.data) ? response.data : response.data.messages || [];
            console.log('[LoadMore] Loaded messages:', olderMessages.length);

            if (olderMessages.length === 0) {
                console.log('[LoadMore] No more messages');
                setHasMore(conversationId, false);
                isLoadingOldMessagesRef.current = false;
            } else {
                // ✅ Add conversationId to each message
                const messagesWithConvId = olderMessages.map((msg: any) => ({
                    ...msg,
                    conversationId
                }));

                console.log('[LoadMore] Prepending messages, new oldest:', messagesWithConvId[0].id);
                
                // Prepend older messages
                prependMessages(conversationId, messagesWithConvId);
                setHasMore(conversationId, olderMessages.length === 10);

                // ✅ Restore scroll position - use double RAF for stability
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (scrollContainer) {
                            const newScrollHeight = scrollContainer.scrollHeight;
                            const scrollDiff = newScrollHeight - oldScrollHeight;
                            scrollContainer.scrollTop = oldScrollTop + scrollDiff;
                            console.log('[LoadMore] ✅ Scroll restored, diff:', scrollDiff);
                        } else {
                            console.log('[LoadMore] ⚠️ No scroll container for restoration');
                        }
                        isLoadingOldMessagesRef.current = false;
                    });
                });
            }
        } catch (err) {
            console.error('[LoadMore] Error:', err);
            toast.error('Failed to load more messages');
            isLoadingOldMessagesRef.current = false;
        } finally {
            setLoadingMore(conversationId, false);
        }
    }, [conversationId, loadingMore, hasMore, oldestMessageId, setLoadingMore, prependMessages, setHasMore]);

    // ✅ Professional: Trigger load more when trigger is in view
    useEffect(() => {
        // Only trigger when inView changes to true
        if (!inView) return;
        
        console.log('[LoadMore] InView = true, checking conditions:', {
            hasMore,
            loadingMore,
            oldestMessageId,
            lastLoadedId: lastLoadedOldestIdRef.current,
            isLoadingOldMessages: isLoadingOldMessagesRef.current
        });

        // Guard: Don't trigger if already loading
        if (loadingMore || isLoadingOldMessagesRef.current) {
            console.log('[LoadMore] ⏸️ Already loading, skipping');
            return;
        }

        // Guard: Don't trigger if we already loaded this ID
        if (oldestMessageId === lastLoadedOldestIdRef.current) {
            console.log('[LoadMore] ⏸️ Already loaded this batch, skipping');
            return;
        }

        if (hasMore && oldestMessageId) {
            console.log('[LoadMore] 🚀 Triggering load more!');
            lastLoadedOldestIdRef.current = oldestMessageId; // Mark as loaded
            loadMoreMessages();
        }
    }, [inView, hasMore, loadingMore, oldestMessageId, loadMoreMessages]);

    if (loading) {
        return (
            <div className={cn('flex flex-col h-full', className)}>
                <ScrollArea className="flex-1 px-4">
                    <div className="space-y-4 py-4">
                        {/* Skeleton loading */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <MessageSkeleton key={i} isAgent={i % 2 === 0} />
                        ))}
                    </div>
                </ScrollArea>
                <div className="border-t p-4">
                    <div className="h-10 bg-muted animate-pulse rounded-lg" />
                </div>
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
            <div ref={scrollAreaRef} className="flex-1 min-h-0">
                <ScrollArea className="h-full px-2 sm:px-4">
                <div className="space-y-4 py-4">
                    {/* Load more trigger - at the top */}
                    {hasMore && messages.length > 0 && !loadingMore && (
                        <div 
                            ref={loadMoreTriggerRef}
                            className="h-20 w-full flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-primary/20"
                        >
                            <div className="text-center">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Scroll up to load more</span>
                            </div>
                        </div>
                    )}

                    {loadingMore && (
                        <div className="space-y-4 py-4">
                            {[1, 2].map((i) => (
                                <MessageSkeleton key={`loading-${i}`} isAgent={i % 2 === 0} />
                            ))}
                        </div>
                    )}

                    {!hasMore && messages.length > 0 && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                            Beginning of conversation
                        </div>
                    )}

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
                                customerName={customerName}
                                currentUserName={currentUserName}
                                isChannelConversation={isChannelConversation}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
            </div>

            <div className="border-t bg-background shrink-0">
                <div className="p-2">
                    <TiptapEditor
                onSend={async (content) => {
                    if (sending) return;

                    // ✅ FIX: Use correct role based on who is sending
                    // In channel conversations: Agent sends = 'assistant'
                    // In AI chat: User sends = 'user'
                    const tempId = `temp-${Date.now()}`;
                    const tempMessage: Message = {
                        id: tempId,
                        role: senderRole,
                        content: content.trim(),
                        conversationId,
                        createdAt: new Date().toISOString(),
                    };

                    appendMessage(conversationId, tempMessage);
                    setSending(true);

                    try {
                        await onSendMessage(content.trim());
                    } catch (err) {
                        toast.error('Failed to send message');
                        removeMessage(conversationId, tempId);
                    } finally {
                        setSending(false);
                    }
                }}
                        placeholder="Type your message..."
                        disabled={sending}
                        className="max-w-full"
                    />
                </div>
            </div>
        </div>
    );
}

interface MessageBubbleProps {
    message: Message;
    botName: string;
    customerName: string;
    currentUserName: string;
    isChannelConversation: boolean;
}

// ✅ Skeleton loading component
function MessageSkeleton({ isAgent }: { isAgent: boolean }) {
    return (
        <div className={cn('flex gap-3 animate-pulse', isAgent && 'flex-row-reverse')}>
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            <div className={cn('flex flex-col gap-1.5 max-w-[70%]', isAgent && 'items-end')}>
                <div className="h-4 w-24 bg-muted rounded" />
                <div className={cn(
                    'rounded-2xl px-4 py-2.5 space-y-2',
                    isAgent ? 'rounded-tr-sm' : 'rounded-tl-sm'
                )}>
                    <div className="h-3 w-48 bg-muted rounded" />
                    <div className="h-3 w-32 bg-muted rounded" />
                </div>
            </div>
        </div>
    );
}

// ✅ Memoize MessageBubble to prevent unnecessary re-renders
const MessageBubble = React.memo(function MessageBubble({ message, botName, customerName, currentUserName, isChannelConversation }: MessageBubbleProps) {
    // ✅ CORRECT LOGIC:
    // In channel conversations:
    // - 'user' = Customer (from Facebook/Instagram) → LEFT side
    // - 'assistant' = Agent/Bot (our response) → RIGHT side
    const isCustomer = message.role === 'user';
    const isAgent = message.role === 'assistant';

    // ✅ FIX: Safe date formatting - memoize
    const formattedTime = React.useMemo(() => {
        try {
            const date = new Date(message.createdAt);
            if (isNaN(date.getTime())) {
                return '';
            }
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    }, [message.createdAt]);

    // ✅ Display names
    const displayName = isCustomer ? customerName : currentUserName;
    
    // ✅ Show "You" badge for agent messages
    const roleLabel = isAgent ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-medium">
            You
        </span>
    ) : null;

    return (
        <div className={cn('flex gap-3', isAgent && 'flex-row-reverse')}>
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={cn(
                    isCustomer
                        ? 'bg-gradient-to-br from-purple-500/30 to-purple-500/10'
                        : 'bg-gradient-to-br from-green-500/30 to-green-500/10'
                )}>
                    {isCustomer ? <User className="w-4 h-4 text-purple-600" /> : <User className="w-4 h-4 text-green-600" />}
                </AvatarFallback>
            </Avatar>

            <div className={cn('flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%] md:max-w-[70%]', isAgent && 'items-end')}>
                <div className={cn('flex items-center gap-1.5 sm:gap-2 flex-wrap', isAgent && 'flex-row-reverse')}>
                    <span className="text-xs font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                        {displayName}
                    </span>
                    {roleLabel}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formattedTime}
                    </span>
                </div>
                <div
                    className={cn(
                        'rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5',
                        isCustomer
                            ? 'bg-muted text-foreground rounded-tl-sm'
                            : 'bg-primary text-primary-foreground rounded-tr-sm'
                    )}
                >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {message.content}
                    </p>
                </div>
            </div>
        </div>
    );
}
);
