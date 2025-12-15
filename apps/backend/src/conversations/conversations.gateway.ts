import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@WebSocketGateway({
  cors: {
    origin:
      process.env.FRONTEND_DOMAIN ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000',
    credentials: true,
  },
  namespace: '/conversations',
})
@UseGuards(AuthGuard('jwt'))
export class ConversationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConversationsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client joins a conversation room to receive real-time updates
   * âœ… Use dash for consistency with frontend
   */
  @SubscribeMessage('join-conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string } | string,
  ) {
    // âœ… Support both object and string format
    const conversationId =
      typeof data === 'string' ? data : data.conversationId;
    client.join(`conversation:${conversationId}`);
    this.logger.log(
      `Client ${client.id} joined conversation ${conversationId}`,
    );
    return { event: 'joined', conversationId };
  }

  /**
   * Client leaves a conversation room
   * âœ… Use dash for consistency with frontend
   */
  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string } | string,
  ) {
    // âœ… Support both object and string format
    const conversationId =
      typeof data === 'string' ? data : data.conversationId;
    client.leave(`conversation:${conversationId}`);
    this.logger.log(`Client ${client.id} left conversation ${conversationId}`);
    return { event: 'left', conversationId };
  }

  /**
   * Emit new message to all clients in a conversation room
   * Called from ConversationsService when new message is created
   * âœ… Use dash for consistency with frontend
   */
  emitNewMessage(conversationId: string, message: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('new-message', message); // âœ… Changed from 'new_message' to 'new-message'
    this.logger.log(`Emitted new message to conversation ${conversationId}`);
  }

  /**
   * Emit conversation update to specific room (for conversation detail page)
   * âœ… Use dash for consistency with frontend
   */
  emitConversationUpdate(conversationId: string, data: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('conversation-updated', data); // âœ… Changed from 'conversation_updated' to 'conversation-updated'
  }

  /**
   * Broadcast conversation update to ALL clients (for conversations list page)
   * Use this when a new conversation is created or updated from webhook
   * âœ… Format conversation data before emitting
   */
  broadcastConversationUpdate(conversation: any) {
    // âœ… Ensure all required fields are present
    const formattedConversation = {
      id: conversation.id,
      externalId: conversation.externalId,
      channelId: conversation.channelId,
      channelType: conversation.channelType,
      channelName: conversation.channelName || conversation.channelType,
      contactName:
        conversation.contactName || conversation.customerName || 'Unknown',
      contactAvatar: conversation.contactAvatar || conversation.customerAvatar,
      customerName:
        conversation.contactName || conversation.customerName || 'Unknown', // âœ… Alias for frontend
      customerAvatar: conversation.contactAvatar || conversation.customerAvatar,
      lastMessage: conversation.lastMessage || 'New message',
      lastMessageAt: conversation.lastMessageAt || new Date().toISOString(),
      unreadCount: conversation.unreadCount || 0,
      status: conversation.status || 'active',
      metadata: conversation.metadata || {},
    };

    this.server.emit('conversation-update', formattedConversation);
    this.logger.log(
      `Broadcasted conversation update: ${conversation.id} (${formattedConversation.contactName})`,
    );
  }

  /**
   * Broadcast new conversation to ALL clients
   * âœ… Format conversation data before emitting
   */
  broadcastNewConversation(conversation: any) {
    // âœ… Ensure all required fields are present
    const formattedConversation = {
      id: conversation.id,
      externalId: conversation.externalId,
      channelId: conversation.channelId,
      channelType: conversation.channelType,
      channelName: conversation.channelName || conversation.channelType,
      contactName:
        conversation.contactName || conversation.customerName || 'Unknown',
      contactAvatar: conversation.contactAvatar || conversation.customerAvatar,
      customerName:
        conversation.contactName || conversation.customerName || 'Unknown', // âœ… Alias for frontend
      customerAvatar: conversation.contactAvatar || conversation.customerAvatar,
      lastMessage: conversation.lastMessage || 'New conversation',
      lastMessageAt: conversation.lastMessageAt || new Date().toISOString(),
      unreadCount: conversation.unreadCount || 0,
      status: conversation.status || 'active',
      metadata: conversation.metadata || {},
    };

    this.server.emit('new-conversation', formattedConversation);
    this.logger.log(
      `Broadcasted new conversation: ${conversation.id} (${formattedConversation.contactName})`,
    );
  }
}
