/**
 * Centralized WebSocket Service
 * Manages all WebSocket connections in the application
 */

type MessageHandler = (data: any) => void
type ErrorHandler = (error: any) => void
type CloseHandler = () => void

interface WebSocketConnection {
    ws: WebSocket
    handlers: Map<string, MessageHandler[]>
    errorHandlers: ErrorHandler[]
    closeHandlers: CloseHandler[]
}

class WebSocketService {
    private connections: Map<string, WebSocketConnection> = new Map()
    private baseUrl: string

    constructor() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
        this.baseUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://')
    }

    /**
     * Connect to a WebSocket endpoint
     */
    connect(endpoint: string, onOpen?: () => void): WebSocket {
        const url = `${this.baseUrl}${endpoint}`
        
        // Reuse existing connection if available
        if (this.connections.has(endpoint)) {
            const conn = this.connections.get(endpoint)!
            if (conn.ws.readyState === WebSocket.OPEN) {
                console.log('♻️ Reusing existing WebSocket connection:', endpoint)
                onOpen?.()
                return conn.ws
            } else {
                // Clean up stale connection
                this.disconnect(endpoint)
            }
        }

        console.log('🔌 Connecting to WebSocket:', url)
        const ws = new WebSocket(url)

        const connection: WebSocketConnection = {
            ws,
            handlers: new Map(),
            errorHandlers: [],
            closeHandlers: []
        }

        ws.onopen = () => {
            console.log('✅ WebSocket connected:', endpoint)
            onOpen?.()
        }

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data)
                const { type, data } = message

                // Call handlers for this message type
                const handlers = connection.handlers.get(type) || []
                handlers.forEach(handler => handler(data))

                // Call wildcard handlers
                const wildcardHandlers = connection.handlers.get('*') || []
                wildcardHandlers.forEach(handler => handler(message))

            } catch (e) {
                console.error('⚠️ Failed to parse WebSocket message:', e)
            }
        }

        ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error)
            connection.errorHandlers.forEach(handler => handler(error))
        }

        ws.onclose = () => {
            console.log('🔌 WebSocket closed:', endpoint)
            connection.closeHandlers.forEach(handler => handler())
            this.connections.delete(endpoint)
        }

        this.connections.set(endpoint, connection)
        return ws
    }

    /**
     * Send message to WebSocket
     */
    send(endpoint: string, data: any): boolean {
        const connection = this.connections.get(endpoint)
        if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
            console.error('❌ WebSocket not connected:', endpoint)
            return false
        }

        try {
            connection.ws.send(JSON.stringify(data))
            return true
        } catch (e) {
            console.error('❌ Failed to send WebSocket message:', e)
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
     * Disconnect from WebSocket
     */
    disconnect(endpoint: string) {
        const connection = this.connections.get(endpoint)
        if (connection) {
            connection.ws.close()
            this.connections.delete(endpoint)
            console.log('🔌 Disconnected:', endpoint)
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
    isConnected(endpoint: string): boolean {
        const connection = this.connections.get(endpoint)
        return connection?.ws.readyState === WebSocket.OPEN
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
