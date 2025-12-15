import { useEffect, useCallback, useRef } from 'react';
import { SocketEventHandlers } from '@/lib/types/socket';
import { useSocketConnection } from './use-socket-connection';

interface UseConversationsSocketOptions extends SocketEventHandlers {
  enabled?: boolean;
}

/**
 * WebSocket hook for conversation events using unified socket connection
 * Handles multiple conversations and real-time updates
 */
export function useConversationsSocket({
  onConversationUpdate,
  onNewConversation,
  onNewMessage,
  enabled = true,
}: UseConversationsSocketOptions) {
  const handlersRef = useRef({
    onConversationUpdate,
    onNewConversation,
    onNewMessage,
  });

  // Update handlers when they change
  useEffect(() => {
    handlersRef.current = {
      onConversationUpdate,
      onNewConversation,
      onNewMessage,
    };
  }, [onConversationUpdate, onNewConversation, onNewMessage]);

  const {
    socket,
    isConnected,
    isConnecting,
    error,
    emit,
    on,
    off,
  } = useSocketConnection({
    namespace: 'conversations',
    enabled,
  });

  // Set up conversation-specific event handlers
  useEffect(() => {
    if (!socket) return;

    const unsubscribeConversationUpdate = on('conversation-update', (conversation) => {
      console.log('[WebSocket] ðŸ“¥ conversation-update:', conversation);
      handlersRef.current.onConversationUpdate?.(conversation);
    });

    const unsubscribeNewConversation = on('new-conversation', (conversation) => {
      console.log('[WebSocket] ðŸ“¥ new-conversation:', conversation);
      handlersRef.current.onNewConversation?.(conversation);
    });

    const unsubscribeNewMessage = on('new-message', (message) => {
      console.log('[WebSocket] ðŸ“¥ new-message:', message);
      handlersRef.current.onNewMessage?.(message);
    });

    return () => {
      unsubscribeConversationUpdate();
      unsubscribeNewConversation();
      unsubscribeNewMessage();
    };
  }, [socket, on]);

  const joinConversation = useCallback((conversationId: string) => {
    if (isConnected) {
      console.log('[WebSocket] ðŸšª Joining conversation:', conversationId);
      emit('join-conversation', conversationId);
    } else {
      console.log('[WebSocket] â³ Conversation join queued:', conversationId);
      // Will join when connection is established via effect above
    }
  }, [isConnected, emit]);

  const leaveConversation = useCallback((conversationId: string) => {
    console.log('[WebSocket] ðŸšª Leaving conversation:', conversationId);
    emit('leave-conversation', conversationId);
  }, [emit]);

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    joinConversation,
    leaveConversation,
  };
}
