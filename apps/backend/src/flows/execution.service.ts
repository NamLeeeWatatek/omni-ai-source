import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExecutionGateway } from './execution.gateway';
import { NodeExecutorStrategy } from './execution/node-executor.strategy';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FlowExecutionEntity } from './infrastructure/persistence/relational/entities/flow-execution.entity';
import { NodeExecutionEntity } from './infrastructure/persistence/relational/entities/node-execution.entity';
import {
  FlowExecutionCompletedEvent,
  FlowExecutionFailedEvent,
} from '../shared/events';

export interface NodeExecution {
  nodeId: string;
  nodeName: string;
  type: string;
  input: any;
  output?: any;
  error?: any;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'running' | 'success' | 'error';
}

export interface FlowExecution {
  executionId: string;
  flowId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  nodes: NodeExecution[];
  result?: any;
  error?: any;
  metadata?: any;
}

@Injectable()
export class ExecutionService {
  private executions = new Map<string, FlowExecution>();

  constructor(
    private readonly executionGateway: ExecutionGateway,
    private readonly nodeExecutorStrategy: NodeExecutorStrategy,
    @InjectRepository(FlowExecutionEntity)
    private flowExecutionRepository: Repository<FlowExecutionEntity>,
    @InjectRepository(NodeExecutionEntity)
    private nodeExecutionRepository: Repository<NodeExecutionEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  executeFlow(
    flowId: string,
    flowData: any,
    inputData?: any,
    metadata?: any,
  ): Promise<string> {
    return Promise.resolve(
      this.executeFlowSync(flowId, flowData, inputData, metadata),
    );
  }

  private async executeFlowSync(
    flowId: string,
    flowData: any,
    inputData?: any,
    metadata?: any,
  ): Promise<string> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const execution: FlowExecution = {
      executionId,
      flowId,
      status: 'running',
      startTime: Date.now(),
      nodes: [],
      metadata,
    };

    this.executions.set(executionId, execution);

    this.executionGateway.emitExecutionStart(executionId, flowId);

    let flowExecutionId: string | undefined;

    try {
      const flowExecution = await this.flowExecutionRepository.create({
        executionId: execution.executionId,
        flowId: flowId,
        status: execution.status,
        startTime: execution.startTime,
        workspaceId: execution.metadata?.workspaceId,
      });

      const savedExecution = await this.flowExecutionRepository.save(flowExecution);

      flowExecutionId = savedExecution.id;

      console.log('Execution created with UUID:', savedExecution.id);

    } catch (error) {
      // Database save failed, proceed without UUID
    }

    try {
      await this.executeNodes(executionId, flowData, inputData, flowExecutionId);
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = Date.now();
      this.executionGateway.emitExecutionError(executionId, error.message);

      const failureEvent = new FlowExecutionFailedEvent(
        flowId,
        executionId,
        error.message,
        execution.metadata,
      );
      this.eventEmitter.emit('flow.execution.failed', failureEvent);

      // Save failed execution to database
      await this.saveExecutionToDatabase(execution, flowId);
    }

    return executionId;
  }

  private async executeNodes(
    executionId: string,
    flowData: any,
    inputData: any,
    flowExecutionId?: string,
  ) {
    const execution = this.executions.get(executionId)!;
    const { nodes, edges } = flowData;

    const executionOrder = this.buildExecutionOrder(nodes, edges);

    let currentInput = inputData;

    for (const nodeId of executionOrder) {
      const node = nodes.find((n: any) => n.id === nodeId);
      if (!node) continue;

      const nodeExecution: NodeExecution = {
        nodeId: node.id,
        nodeName: node.data?.label || node.id,
        type: node.type,
        input: currentInput,
        startTime: Date.now(),
        status: 'running',
      };

      execution.nodes.push(nodeExecution);

      this.executionGateway.emitNodeExecutionStart(executionId, nodeId);

      try {
        const output = await this.nodeExecutorStrategy.execute({
          nodeId: node.id,
          nodeType: node.type,
          data: node.data,
          input: currentInput,
          context: {
            executionId,
            flowId: execution.flowId,
            workspaceId: execution.metadata?.workspaceId,
            flowExecutionId, // Pass the UUID of FlowExecutionEntity
          },
        });

        if (!output.success) {
          throw new Error(output.error || 'Unknown execution error');
        }

        nodeExecution.output = output.output;
        nodeExecution.status = 'success';
        nodeExecution.endTime = Date.now();

        this.executionGateway.emitNodeExecutionComplete(
          executionId,
          nodeId,
          output.output,
        );

        currentInput = output.output;
      } catch (error) {
        nodeExecution.error = error.message;
        nodeExecution.status = 'error';
        nodeExecution.endTime = Date.now();

        this.executionGateway.emitNodeExecutionError(
          executionId,
          nodeId,
          error.message,
        );

        throw error;
      }

      this.executionGateway.emitExecutionProgress(
        executionId,
        nodeId,
        nodeExecution.status,
        nodeExecution.output,
      );
    }

    execution.status = 'completed';
    execution.endTime = Date.now();
    execution.result = currentInput;

    this.executionGateway.emitExecutionComplete(executionId, execution.result);

    const completionEvent = new FlowExecutionCompletedEvent(
      execution.flowId,
      executionId,
      execution.result,
      true,
      undefined,
    );
    if (execution.metadata) {
      (completionEvent as any).metadata = execution.metadata;
    }
    this.eventEmitter.emit('flow.execution.completed', completionEvent);

    await this.saveExecutionToDatabase(execution, execution.flowId);
  }

  private async saveExecutionToDatabase(
    execution: FlowExecution,
    flowId: string,
  ) {
    try {
      console.log('Saving execution to database:', {
        executionId: execution.executionId,
        flowId,
        status: execution.status,
        nodeCount: execution.nodes.length,
        hasResult: !!execution.result,
        hasError: !!execution.error,
        workspaceId: execution.metadata?.workspaceId,
      });

      const flowExecution = this.flowExecutionRepository.create({
        executionId: execution.executionId,
        flowId: flowId,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        result: execution.result,
        error: execution.error,
        workspaceId: execution.metadata?.workspaceId,
      });

      const savedExecution =
        await this.flowExecutionRepository.save(flowExecution);

      console.log('Execution saved with ID:', savedExecution.id);

      if (execution.nodes.length > 0) {
        const nodeExecutions = execution.nodes.map((node) =>
          this.nodeExecutionRepository.create({
            executionId: savedExecution.id,
            nodeId: node.nodeId,
            nodeName: node.nodeName,
            type: node.type,
            input: node.input,
            output: node.output,
            error: node.error,
            startTime: node.startTime,
            endTime: node.endTime,
            status: node.status,
          }),
        );

        await this.nodeExecutionRepository.save(nodeExecutions);
      }
    } catch (error) {}
  }

  private buildExecutionOrder(nodes: any[], edges: any[]): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const adjacencyList = new Map<string, string[]>();

    edges.forEach((edge: any) => {
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, []);
      }
      adjacencyList.get(edge.source)!.push(edge.target);
    });

    const startNodes = nodes.filter(
      (node) => !edges.some((edge: any) => edge.target === node.id),
    );

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      order.push(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach((neighbor) => visit(neighbor));
    };

    startNodes.forEach((node) => visit(node.id));

    nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        order.push(node.id);
      }
    });

    return order;
  }

  getExecution(executionId: string): FlowExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllExecutions(flowId?: string): FlowExecution[] {
    const executions = Array.from(this.executions.values());
    if (flowId) {
      return executions.filter((e) => e.flowId === flowId);
    }
    return executions;
  }

  async findAll(
    flowId?: string,
    limit: number = 100,
  ): Promise<FlowExecutionEntity[]> {
    const where: any = {};
    if (flowId) {
      where.flowId = flowId;
    }

    return this.flowExecutionRepository.find({
      where,
      relations: ['nodeExecutions'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findOne(id: string): Promise<FlowExecutionEntity | null> {
    return this.flowExecutionRepository.findOne({
      where: { id },
      relations: ['nodeExecutions'],
    });
  }

  async findByExecutionId(
    executionId: string,
  ): Promise<FlowExecutionEntity | null> {
    return this.flowExecutionRepository.findOne({
      where: { executionId },
      relations: ['nodeExecutions'],
    });
  }
}
