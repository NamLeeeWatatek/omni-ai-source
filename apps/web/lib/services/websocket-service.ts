/**
 * Centralized WebSocket Service
 * Uses Socket.IO for real-time communication
 */
import { io, Socket } from 'socket.io-client'

type MessageHandler = (data: any) => void
type ErrorHandler = (error: any) => void
type CloseHandler = () => void

interface WebSocketConnection {
    socket: Socket
    handlers: Map<string, MessageHandler[]>
    errorHandlers: ErrorHandler[]
    closeHandlers: CloseHandler[]
}

class WebSocketService {
    private connections: Map<string, WebSocketConnection> = new Map()
    private baseUrl: string

    constructor() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
        this.baseUrl = apiUrl.replace('/api/v1', '')
    }

    /**
     * Connect to a Socket.IO namespace
     */
    connect(namespace: string, onOpen?: () => void): Socket {
        const url = `${this.baseUrl}/${namespace}`
        
        // Reuse existing connection if available
        if (this.connections.has(namespace)) {
            const conn = this.connections.get(namespace)!
            if (conn.socket.connected) {
                console.log('♻️ Reusing existing Socket.IO connection:', namespace)
                onOpen?.()
                return conn.socket
            } else {
                // Clean up stale connection
                this.disconnect(namespace)
            }
        }

        console.log('🔌 Connecting to Socket.IO:', url)
        const socket = io(url, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        })

        const connection: WebSocketConnection = {
            socket,
            handlers: new Map(),
            errorHandlers: [],
            closeHandlers: []
        }

        socket.on('connect', () => {
            console.log('✅ Socket.IO connected:', namespace)
            onOpen?.()
        })

        socket.on('disconnect', () => {
            console.log('🔌 Socket.IO disconnected:', namespace)
            connection.closeHandlers.forEach(handler => handler())
        })

        socket.on('connect_error', (error) => {
            console.error('❌ Socket.IO connection error:', error)
            connection.errorHandlers.forEach(handler => handler(error))
        })

        // Listen for all events
        socket.onAny((eventName, data) => {
            // Call handlers for this event type
            const handlers = connection.handlers.get(eventName) || []
            handlers.forEach(handler => handler(data))

            // Call wildcard handlers
            const wildcardHandlers = connection.handlers.get('*') || []
            wildcardHandlers.forEach(handler => handler({ type: eventName, data }))
        })

        this.connections.set(namespace, connection)
        return socket
    }

    /**
     * Emit event to Socket.IO
     */
    send(namespace: string, event: string, data?: any): boolean {
        const connection = this.connections.get(namespace)
        if (!connection || !connection.socket.connected) {
            console.error('❌ Socket.IO not connected:', namespace)
            return false
        }

        try {
            connection.socket.emit(event, data)
            return true
        } catch (e) {
            console.error('❌ Failed to emit Socket.IO event:', e)
            return false
        }
    }

    /**
     * Subscribe to message type
     */
    on(endpoint: string, messageType: string, handler: MessageHandler): () => void {
        const connection = this.connections.get(endpoint)
        if (!connection) {
            console.warn('⚠️ Cannot subscribe, connection not found:', endpoint)
            return () => {}
        }

        if (!connection.handlers.has(messageType)) {
            connection.handlers.set(messageType, [])
        }

        connection.handlers.get(messageType)!.push(handler)

        // Return unsubscribe function
        return () => {
            const handlers = connection.handlers.get(messageType)
            if (handlers) {
                const index = handlers.indexOf(handler)
                if (index > -1) {
                    handlers.splice(index, 1)
                }
            }
        }
    }

    /**
     * Subscribe to errors
     */
    onError(endpoint: string, handler: ErrorHandler): () => void {
        const connection = this.connections.get(endpoint)
        if (!connection) return () => {}

        connection.errorHandlers.push(handler)

        return () => {
            const index = connection.errorHandlers.indexOf(handler)
            if (index > -1) {
                connection.errorHandlers.splice(index, 1)
            }
        }
    }

    /**
     * Subscribe to close event
     */
    onClose(endpoint: string, handler: CloseHandler): () => void {
        const connection = this.connections.get(endpoint)
        if (!connection) return () => {}

        connection.closeHandlers.push(handler)

        return () => {
            const index = connection.closeHandlers.indexOf(handler)
            if (index > -1) {
                connection.closeHandlers.splice(index, 1)
            }
        }
    }

    /**
     * Disconnect from Socket.IO
     */
    disconnect(namespace: string) {
        const connection = this.connections.get(namespace)
        if (connection) {
            connection.socket.disconnect()
            this.connections.delete(namespace)
            console.log('🔌 Disconnected:', namespace)
        }
    }

    /**
     * Disconnect all WebSockets
     */
    disconnectAll() {
        this.connections.forEach((_, endpoint) => {
            this.disconnect(endpoint)
        })
    }

    /**
     * Get connection status
     */
    isConnected(namespace: string): boolean {
        const connection = this.connections.get(namespace)
        return connection?.socket.connected || false
    }

    /**
     * Get all active connections
     */
    getActiveConnections(): string[] {
        return Array.from(this.connections.keys()).filter(endpoint => 
            this.isConnected(endpoint)
        )
    }
}

// Global singleton instance
export const wsService = new WebSocketService()

// Cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        wsService.disconnectAll()
    })
}
