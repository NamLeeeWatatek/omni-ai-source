'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useConversationsSocket } from '@/lib/hooks/useConversationsSocket';
import { useMessages } from '@/lib/hooks/useMessages';
import { useMessagesStore } from '@/lib/stores/messages-store';
import { MessagesList } from './MessagesList';
import { MessageInput } from './MessageInput';


interface ChatInterfaceProps {
    conversationId: string;
    botName?: string;
    customerName?: string;
    isChannelConversation?: boolean;
    onSendMessage: (content: string) => Promise<void>;
    className?: string;
    senderRole?: 'user' | 'assistant';
}

export function ChatInterface({
    conversationId,
    botName = 'AI Assistant',
    customerName = 'Customer',
    isChannelConversation = false,
    onSendMessage,
    className,
    senderRole = 'assistant',
}: ChatInterfaceProps) {
    const { data: session } = useSession();
    const currentUserName = session?.user?.name || session?.user?.email || 'You';

    // Track current conversation to prevent unnecessary joins/leaves
    const currentConversationRef = useRef<string | null>(null);

    // Use custom hook for messages management
    const {
        messages,
        loading,
        loadingMore,
        hasMore,
        error,
        loadMoreMessages,
        loadInitialMessages
    } = useMessages(conversationId);

    const appendMessage = useMessagesStore((state) => state.appendMessage);
    const removeMessage = useMessagesStore((state) => state.removeMessage);

    // Socket for real-time messages - use stable callbacks
    const onNewMessageCallback = useCallback((message: any) => {
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
    }, [conversationId, appendMessage]);

    const { joinConversation, leaveConversation } = useConversationsSocket({
        onNewMessage: onNewMessageCallback,
        enabled: true
    });

    // Join/leave socket room - only when conversationId actually changes
    useEffect(() => {
        // Ensure conversationId is valid
        if (!conversationId || typeof conversationId !== 'string' || conversationId.trim() === '') {
            console.warn('[ChatInterface] Invalid conversationId:', conversationId);
            return;
        }

        if (currentConversationRef.current === conversationId) {
            // Same conversation, no need to rejoin
            return;
        }

        // Leave previous conversation if exists
        if (currentConversationRef.current && leaveConversation) {
            console.log('[ChatInterface] Leaving previous conversation:', currentConversationRef.current);
            leaveConversation(currentConversationRef.current);
        }

        // Join new conversation
        if (conversationId && joinConversation) {
            console.log('[ChatInterface] Joining conversation:', conversationId);
            joinConversation(conversationId);
            currentConversationRef.current = conversationId;
        }

        return () => {
            // Cleanup on unmount
            if (currentConversationRef.current && leaveConversation) {
                console.log('[ChatInterface] Leaving conversation on cleanup:', currentConversationRef.current);
                leaveConversation(currentConversationRef.current);
                currentConversationRef.current = null;
            }
        };
    }, [conversationId]); // Only depend on conversationId, not the join/leave functions

    // Handle sending messages
    const handleSendMessage = useCallback(async (content: string) => {
        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
            id: tempId,
            role: senderRole,
            content: content.trim(),
            conversationId,
            createdAt: new Date().toISOString(),
        };

        appendMessage(conversationId, tempMessage);

        try {
            await onSendMessage(content.trim());
        } catch (err) {
            toast.error('Failed to send message');
            removeMessage(conversationId, tempId);
            throw err;
        }
    }, [conversationId, senderRole, onSendMessage, appendMessage, removeMessage]);

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
            <MessagesList
                messages={messages}
                botName={botName}
                customerName={customerName}
                currentUserName={currentUserName}
                isChannelConversation={isChannelConversation}
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onLoadMore={loadMoreMessages}
            />

            <MessageInput
                conversationId={conversationId}
                onSendMessage={handleSendMessage}
                senderRole={senderRole}
            />
        </div>
    );
}
