import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ExecutionService } from './execution.service';

@ApiTags('Executions')
@Controller({ path: 'executions', version: '1' })
export class ExecutionsController {
  constructor(private readonly executionService: ExecutionService) { }

  @Get()
  @ApiOperation({ summary: 'Get all executions' })
  @ApiQuery({ name: 'flow_id', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('flow_id') flowId?: string,
    @Query('limit') limit?: string,
  ) {
    const executions = await this.executionService.findAll(
      flowId,
      undefined,
      limit ? limit : '100',
    );

    return executions.map((exec) => {
      // Calculate execution stats
      const nodeExecutions = exec.nodeExecutions || [];
      const totalNodes = nodeExecutions.length;
      const completedNodes = nodeExecutions.filter(
        (n) => n.status === 'success',
      ).length;
      const successRate =
        totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

      // Safely convert timestamps
      let startedAt: string;
      let duration: number | undefined;

      try {
        if (exec.startTime && typeof exec.startTime === 'number') {
          startedAt = new Date(exec.startTime).toISOString();
        } else {
          startedAt = exec.createdAt?.toISOString() || new Date().toISOString();
        }
      } catch (error) {
        startedAt = exec.createdAt?.toISOString() || new Date().toISOString();
      }

      try {
        if (
          exec.endTime &&
          exec.startTime &&
          typeof exec.endTime === 'number' &&
          typeof exec.startTime === 'number'
        ) {
          duration = exec.endTime - exec.startTime;
        }
      } catch (error) {
        // Keep duration undefined
      }

      return {
        id: exec.id,
        execution_id: exec.executionId,
        flow_id: exec.flowId,
        status: exec.status,
        started_at: startedAt,
        duration_ms: duration,
        total_nodes: totalNodes,
        completed_nodes: completedNodes,
        success_rate: successRate,
        result: exec.result,
        error: exec.error,
        workspace_id: exec.workspaceId,
        created_at: exec.createdAt,
        updated_at: exec.updatedAt,
      };
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get execution by ID' })
  async findOne(@Param('id') id: string) {
    console.log('Fetching execution by ID:', id);
    const exec = await this.executionService.findOne(id);

    if (!exec) {
      console.log('Execution not found for ID:', id);
      return { error: 'Execution not found' };
    }

    console.log('Found execution:', {
      id: exec.id,
      executionId: exec.executionId,
      status: exec.status,
      nodeExecutionsCount: exec.nodeExecutions?.length || 0,
      hasResult: !!exec.result,
      hasError: !!exec.error,
      workspaceId: exec.workspaceId,
    });

    // Transform to match frontend expectations
    const nodeExecutions =
      exec.nodeExecutions?.map((node) => {
        // Safely convert timestamps to ISO strings
        let started_at: string | undefined;
        let completed_at: string | undefined;

        try {
          if (node.startTime && typeof node.startTime === 'number') {
            started_at = new Date(node.startTime).toISOString();
          }
        } catch (error) {
          console.warn(
            'Invalid startTime for node:',
            node.nodeId,
            node.startTime,
          );
        }

        try {
          if (node.endTime && typeof node.endTime === 'number') {
            completed_at = new Date(node.endTime).toISOString();
          }
        } catch (error) {
          console.warn('Invalid endTime for node:', node.nodeId, node.endTime);
        }

        const execution_time_ms =
          node.endTime &&
            node.startTime &&
            typeof node.endTime === 'number' &&
            typeof node.startTime === 'number'
            ? node.endTime - node.startTime
            : undefined;

        return {
          id: parseInt(node.id),
          node_id: node.nodeId,
          node_type: node.type,
          node_label: node.nodeName,
          status: node.status,
          started_at,
          completed_at,
          execution_time_ms,
          input_data: node.input,
          output_data: node.output,
          error_message: node.error,
        };
      }) || [];

    const totalNodes = nodeExecutions.length;
    const completedNodes = nodeExecutions.filter(
      (n) => n.status === 'success',
    ).length;
    const successRate =
      totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

    // Safely convert execution timestamps
    let started_at: string;
    let completed_at: string | undefined;
    let duration_ms: number | undefined;

    try {
      if (exec.startTime && typeof exec.startTime === 'number') {
        started_at = new Date(exec.startTime).toISOString();
      } else {
        started_at = new Date().toISOString(); // Fallback
      }
    } catch (error) {
      console.warn(
        'Invalid startTime for execution:',
        exec.executionId,
        exec.startTime,
      );
      started_at = new Date().toISOString();
    }

    try {
      if (exec.endTime && typeof exec.endTime === 'number') {
        completed_at = new Date(exec.endTime).toISOString();
        if (exec.startTime && typeof exec.startTime === 'number') {
          duration_ms = exec.endTime - exec.startTime;
        }
      }
    } catch (error) {
      console.warn(
        'Invalid endTime for execution:',
        exec.executionId,
        exec.endTime,
      );
    }

    return {
      id: parseInt(exec.id),
      flow_version_id: 1, // Default for now
      status: exec.status,
      started_at,
      completed_at,
      total_nodes: totalNodes,
      completed_nodes: completedNodes,
      duration_ms,
      success_rate: successRate,
      input_data: {}, // Default empty input
      output_data: exec.result,
      error_message: exec.error,
      node_executions: nodeExecutions,
    };
  }
}
