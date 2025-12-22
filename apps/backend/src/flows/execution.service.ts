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

@Injectable()
export class ExecutionService {
  constructor(
    private readonly executionGateway: ExecutionGateway,
    private readonly nodeExecutorStrategy: NodeExecutorStrategy,
    @InjectRepository(FlowExecutionEntity)
    private flowExecutionRepository: Repository<FlowExecutionEntity>,
    @InjectRepository(NodeExecutionEntity)
    private nodeExecutionRepository: Repository<NodeExecutionEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async executeFlow(
    flowId: string,
    flowData: any,
    inputData?: any,
    metadata?: any,
  ): Promise<string> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const workspaceId = metadata?.workspaceId;

    // workspaceId is now required
    if (!workspaceId) {
      throw new Error('workspaceId is required for flow execution');
    }

    // 1. Create and save FlowExecution record immediately
    const flowExecution = this.flowExecutionRepository.create({
      executionId,
      flowId,
      status: 'pending', // Start as pending
      startTime: Date.now(),
      workspaceId: workspaceId, // workspaceId is now required
    });

    const savedExecution =
      await this.flowExecutionRepository.save(flowExecution);

    // Fire and forget execution to avoid blocking the request
    this.runExecution(savedExecution, flowData, inputData, metadata).catch(
      (err) => {
        console.error(`Flow execution ${executionId} failed:`, err);
      },
    );

    return executionId;
  }

  private async runExecution(
    execution: FlowExecutionEntity,
    flowData: any,
    inputData: any,
    metadata: any,
  ) {
    const executionId = execution.executionId;
    const flowId = execution.flowId;

    try {
      // Update status to running
      execution.status = 'running';
      await this.flowExecutionRepository.save(execution);

      this.executionGateway.emitExecutionStart(executionId, flowId);

      const { nodes, edges } = flowData;
      const executionOrder = this.buildExecutionOrder(nodes, edges);

      let currentInput = inputData;
      const executionResults: Record<string, any> = {
        input: currentInput,
        flow: {
          id: flowId,
          executionId: execution.id,
          startTime: execution.startTime,
        },
      };

      for (const nodeId of executionOrder) {
        const node = nodes.find((n: any) => n.id === nodeId);
        if (!node) continue;

        // 2. Create and save NodeExecution record
        const nodeExecution = this.nodeExecutionRepository.create({
          executionId: execution.id,
          nodeId: node.id,
          nodeName: node.data?.label || node.id,
          type: node.type,
          input: currentInput,
          startTime: Date.now(),
          status: 'running',
          workspaceId: execution.workspaceId,
        });

        const savedNodeExecution =
          await this.nodeExecutionRepository.save(nodeExecution);
        this.executionGateway.emitNodeExecutionStart(executionId, nodeId);

        try {
          const output = await this.nodeExecutorStrategy.execute({
            nodeId: node.id,
            nodeType: node.type,
            data: node.data,
            input: currentInput,
            context: {
              executionId,
              flowId,
              workspaceId: execution.workspaceId ?? undefined,
              flowExecutionId: execution.id,
              results: executionResults,
            },
          });

          if (!output.success) {
            throw new Error(output.error || 'Unknown execution error');
          }

          // 3. Update NodeExecution with output
          savedNodeExecution.output = output.output;
          savedNodeExecution.status = 'success';
          savedNodeExecution.endTime = Date.now();
          await this.nodeExecutionRepository.save(savedNodeExecution);

          // âœ… Store results for cross-node interpolation
          const nodeName = (node.data?.label || node.id)
            .replace(/\s+/g, '_')
            .toLowerCase();
          executionResults[node.id] = output.output;
          executionResults[nodeName] = output.output;

          this.executionGateway.emitNodeExecutionComplete(
            executionId,
            nodeId,
            output.output,
          );
          currentInput = output.output;
        } catch (error) {
          savedNodeExecution.error = error.message;
          savedNodeExecution.status = 'error';
          savedNodeExecution.endTime = Date.now();
          await this.nodeExecutionRepository.save(savedNodeExecution);

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
          savedNodeExecution.status,
          savedNodeExecution.output,
        );
      }

      // 4. Finalize FlowExecution
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.result = currentInput;
      await this.flowExecutionRepository.save(execution);

      this.executionGateway.emitExecutionComplete(
        executionId,
        execution.result,
      );

      const completionEvent = new FlowExecutionCompletedEvent(
        flowId,
        executionId,
        execution.result || {},
        true,
        metadata || {},
      );
      this.eventEmitter.emit('flow.execution.completed', completionEvent);
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = Date.now();
      await this.flowExecutionRepository.save(execution);

      this.executionGateway.emitExecutionError(executionId, error.message);

      const failureEvent = new FlowExecutionFailedEvent(
        flowId,
        executionId,
        error.message,
        metadata || {},
      );
      this.eventEmitter.emit('flow.execution.failed', failureEvent);
    }
  }

  private buildExecutionOrder(nodes: any[], edges: any[]): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const adjacencyList = new Map<string, string[]>();

    edges.forEach((edge: any) => {
      if (!adjacencyList.has(edge.source)) adjacencyList.set(edge.source, []);
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
      if (!visited.has(node.id)) order.push(node.id);
    });

    return order;
  }

  async findAll(
    flowId?: string,
    workspaceId?: string,
    limit: string | number = 100,
  ): Promise<FlowExecutionEntity[]> {
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const where: any = {};
    if (flowId) where.flowId = flowId;
    if (workspaceId) where.workspaceId = workspaceId;

    // Use query builder to avoid column naming issues with relations
    const queryBuilder = this.flowExecutionRepository.createQueryBuilder('fe')
      .leftJoinAndSelect('fe.nodeExecutions', 'ne')
      .where(where)
      .orderBy('fe.created_at', 'DESC')
      .take(limitNum);

    return queryBuilder.getMany();
  }

  async findOne(
    id: string,
    workspaceId?: string,
  ): Promise<FlowExecutionEntity | null> {
    const where: any = { id };
    if (workspaceId) where.workspaceId = workspaceId;
    return this.flowExecutionRepository.findOne({
      where,
      relations: ['nodeExecutions'],
    });
  }

  async findByExecutionId(
    executionId: string,
    workspaceId?: string,
  ): Promise<FlowExecutionEntity | null> {
    const where: any = { executionId };
    if (workspaceId) where.workspaceId = workspaceId;
    return this.flowExecutionRepository.findOne({
      where,
      relations: ['nodeExecutions'],
    });
  }

  // Alias methods for controller compatibility
  async getAllExecutions(flowId: string): Promise<FlowExecutionEntity[]> {
    return this.findAll(flowId);
  }

  async getExecution(executionId: string): Promise<FlowExecutionEntity | null> {
    return this.findByExecutionId(executionId);
  }
}
