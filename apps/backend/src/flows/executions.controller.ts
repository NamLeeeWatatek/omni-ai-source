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
            flowId ? parseInt(flowId) : undefined,
            limit ? parseInt(limit) : 100,
        );

        return executions.map((exec) => ({
            id: exec.id,
            execution_id: exec.executionId,
            flow_id: exec.flowId,
            status: exec.status,
            start_time: exec.startTime,
            end_time: exec.endTime,
            result: exec.result,
            error: exec.error,
            created_at: exec.createdAt,
            node_executions: exec.nodeExecutions?.map((node) => ({
                id: node.id,
                node_id: node.nodeId,
                node_name: node.nodeName,
                type: node.type,
                input: node.input,
                output: node.output,
                error: node.error,
                start_time: node.startTime,
                end_time: node.endTime,
                status: node.status,
            })),
        }));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get execution by ID' })
    async findOne(@Param('id') id: string) {
        const exec = await this.executionService.findOne(parseInt(id));

        if (!exec) {
            return { error: 'Execution not found' };
        }

        return {
            id: exec.id,
            execution_id: exec.executionId,
            flow_id: exec.flowId,
            status: exec.status,
            start_time: exec.startTime,
            end_time: exec.endTime,
            result: exec.result,
            error: exec.error,
            created_at: exec.createdAt,
            node_executions: exec.nodeExecutions?.map((node) => ({
                id: node.id,
                node_id: node.nodeId,
                node_name: node.nodeName,
                type: node.type,
                input: node.input,
                output: node.output,
                error: node.error,
                start_time: node.startTime,
                end_time: node.endTime,
                status: node.status,
            })),
        };
    }
}
