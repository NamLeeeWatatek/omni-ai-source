import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'conversations',
  cors: {
    origin: process.env.FRONTEND_DOMAIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class ConversationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConversationsGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Get user ID from handshake query or auth
    const userId = client.handshake.query.userId as string;
    
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(client.id);
      
      // Join user's personal room
      client.join(`user:${userId}`);
      this.logger.log(`User ${userId} joined with socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove socket from user's set
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }

  @SubscribeMessage('join-conversation')
  handleJoinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation:${conversationId}`);
    this.logger.log(`Client ${client.id} joined conversation ${conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation:${conversationId}`);
    this.logger.log(`Client ${client.id} left conversation ${conversationId}`);
    return { success: true };
  }

  // Emit new message to conversation room
  emitNewMessage(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('new-message', message);
    this.logger.log(`Emitted new message to conversation ${conversationId}`);
  }

  // Emit conversation update (new conversation or status change)
  emitConversationUpdate(userId: string, conversation: any) {
    this.server.to(`user:${userId}`).emit('conversation-update', conversation);
    this.logger.log(`Emitted conversation update to user ${userId}`);
  }

  // Emit new conversation to all users in workspace
  emitNewConversation(workspaceId: string, conversation: any) {
    this.server.to(`workspace:${workspaceId}`).emit('new-conversation', conversation);
    this.logger.log(`Emitted new conversation to workspace ${workspaceId}`);
  }

  // Broadcast to all connected clients (for testing)
  broadcastConversationUpdate(conversation: any) {
    this.server.emit('conversation-update', conversation);
    this.logger.log('Broadcasted conversation update to all clients');
  }
}
