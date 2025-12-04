import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class KBProcessingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(KBProcessingGateway.name);
  private clientRooms = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clientRooms.delete(client.id);
  }

  subscribeToKnowledgeBase(clientId: string, knowledgeBaseId: string) {
    if (!this.clientRooms.has(clientId)) {
      this.clientRooms.set(clientId, new Set());
    }
    this.clientRooms.get(clientId)?.add(knowledgeBaseId);
  }

  @OnEvent('kb.processing.update')
  handleProcessingUpdate(payload: any) {
    this.server.emit('processing:update', payload);

    this.logger.log(
      `📡 Broadcasting update for KB ${payload.knowledgeBaseId}: ${payload.status} ${payload.progress}% (${payload.documentName || 'unnamed'})`,
    );
    this.logger.debug(`Full payload: ${JSON.stringify(payload)}`);
  }

  sendDocumentProgress(
    knowledgeBaseId: string,
    documentId: string,
    progress: number,
    status: string,
  ) {
    this.server.emit('processing:update', {
      knowledgeBaseId,
      documentId,
      progress,
      status,
    });
  }
}
