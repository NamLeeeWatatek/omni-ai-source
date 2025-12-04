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

    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const socket = io(`${SOCKET_URL}/conversations`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
    });

    socket.on('disconnect', (reason) => {
      
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          socket.connect();
        }, 3000);
      }
    });

    socket.on('connect_error', (error) => {
    });

    socket.on('conversation-update', (conversation) => {
      onConversationUpdate?.(conversation);
    });

    socket.on('new-conversation', (conversation) => {
      onNewConversation?.(conversation);
    });

    socket.on('new-message', (message) => {
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
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-conversation', conversationId);
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
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
