import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    namespace: '/template-executions',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class TemplateFormsGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`[TemplateFormsGateway] Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`[TemplateFormsGateway] Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('subscribe:execution')
    handleSubscribe(client: Socket, executionId: string) {
        client.join(`execution:${executionId}`);
        console.log(
            `[TemplateFormsGateway] Client ${client.id} subscribed to execution:${executionId}`,
        );
        return { event: 'subscribed', data: { executionId } };
    }

    @SubscribeMessage('unsubscribe:execution')
    handleUnsubscribe(client: Socket, executionId: string) {
        client.leave(`execution:${executionId}`);
        console.log(
            `[TemplateFormsGateway] Client ${client.id} unsubscribed from execution:${executionId}`,
        );
        return { event: 'unsubscribed', data: { executionId } };
    }

    emitProgress(executionId: string, progress: number, message: string) {
        this.server.to(`execution:${executionId}`).emit('execution:progress', {
            executionId,
            progress,
            message,
            timestamp: new Date(),
        });
        console.log(`[TemplateFormsGateway] Progress update: ${executionId} - ${progress}% - ${message}`);
    }

    emitCompleted(executionId: string, result: any) {
        this.server.to(`execution:${executionId}`).emit('execution:completed', {
            executionId,
            result,
            timestamp: new Date(),
        });
        console.log(`[TemplateFormsGateway] Execution completed: ${executionId}`);
    }

    emitError(executionId: string, error: string) {
        this.server.to(`execution:${executionId}`).emit('execution:error', {
            executionId,
            error,
            timestamp: new Date(),
        });
        console.log(`[TemplateFormsGateway] Execution error: ${executionId} - ${error}`);
    }

    emitStatusUpdate(
        executionId: string,
        status: string,
        metadata?: Record<string, any>,
    ) {
        this.server.to(`execution:${executionId}`).emit('execution:status', {
            executionId,
            status,
            metadata,
            timestamp: new Date(),
        });
    }
}
