import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseConversationSocketOptions {
    conversationId: string;
    onNewMessage: (message: any) => void;
    enabled?: boolean;
}

/**
 * Custom hook for WebSocket connection to a conversation
 * Automatically connects, joins room, and handles reconnection
 */
export function useConversationSocket({
    conversationId,
    onNewMessage,
    enabled = true,
}: UseConversationSocketOptions) {
    const socketRef = useRef<Socket | null>(null);
    const isConnectedRef = useRef(false);

    const connect = useCallback(() => {
        if (!enabled || !conversationId) return;

        // Remove /api/v1 suffix from API URL for WebSocket connection
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const backendUrl = apiUrl.replace(/\/api\/v1$/, '');

        // Create socket connection
        const socket = io(`${backendUrl}/conversations`, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        // Connection handlers
        socket.on('connect', () => {
            console.log('[WebSocket] Connected:', socket.id);
            isConnectedRef.current = true;

            // Join conversation room
            socket.emit('join_conversation', { conversationId });
        });

        socket.on('disconnect', () => {
            console.log('[WebSocket] Disconnected');
            isConnectedRef.current = false;
        });

        socket.on('connect_error', (error) => {
            console.error('[WebSocket] Connection error:', error);
        });

        // Listen for joined confirmation
        socket.on('joined', (data) => {
            console.log('[WebSocket] Joined conversation:', data?.conversationId || conversationId);
        });

        // Listen for new messages
        socket.on('new_message', (message) => {
            console.log('[WebSocket] New message received:', message);
            onNewMessage(message);
        });

        return socket;
    }, [conversationId, onNewMessage, enabled]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            if (conversationId && isConnectedRef.current) {
                // Leave conversation room before disconnect
                socketRef.current.emit('leave_conversation', { conversationId });
            }

            socketRef.current.disconnect();
            socketRef.current = null;
            isConnectedRef.current = false;
        }
    }, [conversationId]);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        if (!enabled) return;

        const socket = connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect, enabled]);

    return {
        socket: socketRef.current,
        isConnected: isConnectedRef.current,
        disconnect,
    };
}
