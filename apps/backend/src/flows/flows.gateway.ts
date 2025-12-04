import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface FlowUpdate {
  flowId: string;
  userId: string;
  nodes?: any[];
  edges?: any[];
  timestamp: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_DOMAIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/flows',
})
export class FlowsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
  }

  handleDisconnect(client: Socket) {
    this.activeUsers.forEach((users, flowId) => {
      users.delete(client.id);
      if (users.size === 0) {
        this.activeUsers.delete(flowId);
      }
    });
  }

  @SubscribeMessage('join-flow')
  handleJoinFlow(
    @MessageBody() data: { flowId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { flowId, userId } = data;

    client.join(`flow-${flowId}`);

    if (!this.activeUsers.has(flowId)) {
      this.activeUsers.set(flowId, new Set());
    }
    this.activeUsers.get(flowId)!.add(client.id);

    client.to(`flow-${flowId}`).emit('user-joined', {
      userId,
      socketId: client.id,
      timestamp: Date.now(),
    });

    return {
      activeUsers: Array.from(this.activeUsers.get(flowId) || []),
    };
  }

  @SubscribeMessage('leave-flow')
  handleLeaveFlow(
    @MessageBody() data: { flowId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { flowId, userId } = data;

    client.leave(`flow-${flowId}`);

    this.activeUsers.get(flowId)?.delete(client.id);

    client.to(`flow-${flowId}`).emit('user-left', {
      userId,
      socketId: client.id,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('flow-update')
  handleFlowUpdate(
    @MessageBody() data: FlowUpdate,
    @ConnectedSocket() client: Socket,
  ) {
    const { flowId, userId, nodes, edges, timestamp } = data;

    client.to(`flow-${flowId}`).emit('flow-updated', {
      userId,
      nodes,
      edges,
      timestamp,
    });

    return { success: true };
  }

  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @MessageBody()
    data: { flowId: string; userId: string; x: number; y: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { flowId, userId, x, y } = data;

    client.to(`flow-${flowId}`).emit('cursor-moved', {
      userId,
      socketId: client.id,
      x,
      y,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('node-select')
  handleNodeSelect(
    @MessageBody()
    data: { flowId: string; userId: string; nodeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { flowId, userId, nodeId } = data;

    client.to(`flow-${flowId}`).emit('node-selected', {
      userId,
      nodeId,
      timestamp: Date.now(),
    });
  }

  emitFlowSaved(flowId: string, data: any) {
    this.server.to(`flow-${flowId}`).emit('flow-saved', {
      flowId,
      data,
      timestamp: Date.now(),
    });
  }

  emitFlowExecutionStarted(flowId: string, executionId: string) {
    this.server.to(`flow-${flowId}`).emit('execution-started', {
      flowId,
      executionId,
      timestamp: Date.now(),
    });
  }

  emitFlowExecutionCompleted(flowId: string, executionId: string, result: any) {
    this.server.to(`flow-${flowId}`).emit('execution-completed', {
      flowId,
      executionId,
      result,
      timestamp: Date.now(),
    });
  }

  emitFlowExecutionError(flowId: string, executionId: string, error: any) {
    this.server.to(`flow-${flowId}`).emit('execution-error', {
      flowId,
      executionId,
      error,
      timestamp: Date.now(),
    });
  }
}
