import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseConversationsSocketOptions {
  onConversationUpdate?: (conversation: any) => void;
  onNewConversation?: (conversation: any) => void;
  onNewMessage?: (message: any) => void;
  enabled?: boolean;
}

export function useConversationsSocket({
  onConversationUpdate,
  onNewConversation,
  onNewMessage,
  enabled = true,
}: UseConversationsSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!enabled) return;

    // Remove /api/v1 suffix from API URL for WebSocket connection
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const SOCKET_URL = apiUrl.replace(/\/api\/v1$/, '');
    
    const socket = io(`${SOCKET_URL}/conversations`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] ✅ Connected to', `${SOCKET_URL}/conversations`, 'Socket ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] ❌ Disconnected:', reason);
      
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WebSocket] 🔄 Attempting to reconnect...');
          socket.connect();
        }, 3000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] ❌ Connection error:', error.message);
    });

    socket.on('conversation-update', (conversation) => {
      console.log('[WebSocket] 📥 conversation-update:', conversation);
      onConversationUpdate?.(conversation);
    });

    socket.on('new-conversation', (conversation) => {
      console.log('[WebSocket] 📥 new-conversation:', conversation);
      onNewConversation?.(conversation);
    });

    socket.on('new-message', (message) => {
      console.log('[WebSocket] 📥 new-message:', message);
      onNewMessage?.(message);
    });

    socketRef.current = socket;

    return socket;
  }, [enabled, onConversationUpdate, onNewConversation, onNewMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      // Remove all listeners before disconnecting
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    
    if (!socket) {
      console.warn('[WebSocket] ⚠️ Cannot join conversation - socket not initialized');
      return;
    }

    if (socket.connected) {
      console.log('[WebSocket] 🚪 Joining conversation:', conversationId);
      socket.emit('join-conversation', conversationId);
    } else {
      // Wait for connection before joining
      console.log('[WebSocket] ⏳ Waiting for connection to join:', conversationId);
      const onConnect = () => {
        console.log('[WebSocket] 🚪 Now joining conversation:', conversationId);
        socket.emit('join-conversation', conversationId);
        socket.off('connect', onConnect);
      };
      socket.once('connect', onConnect);
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      console.log('[WebSocket] 🚪 Leaving conversation:', conversationId);
      socketRef.current.emit('leave-conversation', conversationId);
    }
  }, []);

  useEffect(() => {
    const socket = connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    joinConversation,
    leaveConversation,
    reconnect: connect,
  };
}
