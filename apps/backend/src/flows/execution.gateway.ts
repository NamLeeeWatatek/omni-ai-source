import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'executions',
})
@UseGuards(AuthGuard('jwt'))
export class ExecutionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {}

  handleDisconnect(client: any) {}

  emitExecutionStart(executionId: string, flowId: string) {
    this.server.emit('execution:start', {
      executionId,
      flowId,
      timestamp: Date.now(),
    });
  }

  emitExecutionProgress(
    executionId: string,
    nodeId: string,
    status: string,
    data?: any,
  ) {
    this.server.emit('execution:progress', {
      executionId,
      nodeId,
      status,
      data,
      timestamp: Date.now(),
    });
  }

  emitExecutionComplete(executionId: string, result: any) {
    this.server.emit('execution:complete', {
      executionId,
      result,
      timestamp: Date.now(),
    });
  }

  emitExecutionError(executionId: string, error: any) {
    this.server.emit('execution:error', {
      executionId,
      error,
      timestamp: Date.now(),
    });
  }

  emitNodeExecutionStart(executionId: string, nodeId: string) {
    this.server.emit('execution:node:start', {
      executionId,
      nodeId,
      timestamp: Date.now(),
    });
  }

  emitNodeExecutionComplete(executionId: string, nodeId: string, output: any) {
    this.server.emit('execution:node:complete', {
      executionId,
      nodeId,
      output,
      timestamp: Date.now(),
    });
  }

  emitNodeExecutionError(executionId: string, nodeId: string, error: any) {
    this.server.emit('execution:node:error', {
      executionId,
      nodeId,
      error,
      timestamp: Date.now(),
    });
  }
}
