import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateFormSchemaEntity } from './infrastructure/persistence/relational/entities/template-form-schema.entity';
import { FlowsService } from '../flows/flows.service';
import { ExecuteTemplateDto } from './dto/execute-template.dto';
import { FlowExecutionEntity } from '../flows/infrastructure/persistence/relational/entities/flow-execution.entity';

/**
 * TemplateExecutionService
 * 
 * This service is a thin UI wrapper that:
 * 1. Takes form input from users
 * 2. Maps form data to flow parameters
 * 3. Creates a Flow instance from the template
 * 4. Delegates execution to FlowsService (reuses existing execution infrastructure)
 * 
 * Template Forms = UI layer for low-level users to interact with Flows
 */
@Injectable()
export class TemplateExecutionService {
    constructor(
        @InjectRepository(TemplateFormSchemaEntity)
        private templateSchemaRepository: Repository<TemplateFormSchemaEntity>,
        @InjectRepository(FlowExecutionEntity)
        private flowExecutionRepository: Repository<FlowExecutionEntity>,
        private flowsService: FlowsService,
    ) { }

    /**
     * Execute a template form
     * 
     * Workflow:
     * 1. Get template schema
     * 2. Map form input to flow parameters
     * 3. Create Flow from template
     * 4. Execute the flow (using existing flow execution)
     */
    async executeTemplate(
        templateId: string,
        dto: ExecuteTemplateDto,
        userId: string,
        workspaceId: string,
    ): Promise<{ flowId: string; executionId: string }> {
        // Get template schema
        const template = await this.templateSchemaRepository.findOne({
            where: { id: templateId },
            relations: ['flowTemplate'],
        });

        if (!template) {
            throw new NotFoundException('Template not found');
        }

        if (!template.flowTemplate) {
            throw new NotFoundException('Flow template not configured');
        }

        // Map form input to flow parameters
        const flowInput = this.mapFormDataToFlowInput(
            dto.inputData,
            template.inputMapping,
        );

        // Create flow instance from template
        const flow = await this.flowsService.createFromTemplate(
            {
                templateId: template.flowTemplateId,
                name: `${template.name} - ${new Date().toISOString()}`,
                description: `Executed from template form: ${template.name}`,
            },
            userId,
        );

        // TODO: Execute the flow
        // This requires flow execution infrastructure
        // For now, we return the flow ID
        // In the future: await this.flowExecutionService.execute(flow.id, flowInput);

        console.log('[TemplateExecution] Flow created:', {
            flowId: flow.id,
            templateId,
            flowInput,
        });

        // Create a placeholder execution record
        // In real implementation, this would come from flow execution
        const executionId = `exec_${Date.now()}`;

        return {
            flowId: flow.id,
            executionId,
        };
    }

    /**
     * Map form field values to flow input parameters
     * 
     * Example:
     * Form data: { video_description: "...", product_images: [...] }
     * Input mapping: { video_description: "prompt", product_images: "images" }
     * Result: { prompt: "...", images: [...] }
     */
    private mapFormDataToFlowInput(
        formData: Record<string, any>,
        inputMapping: Record<string, string>,
    ): Record<string, any> {
        const flowInput: Record<string, any> = {};

        for (const [formFieldId, flowParamName] of Object.entries(inputMapping)) {
            const value = formData[formFieldId];
            if (value !== undefined) {
                // Support dot notation for nested parameters
                this.setNestedValue(flowInput, flowParamName, value);
            }
        }

        return flowInput;
    }

    /**
     * Set nested value using dot notation
     * Example: setNestedValue({}, "data.prompt", "value") => { data: { prompt: "value" } }
     */
    private setNestedValue(obj: any, path: string, value: any): void {
        const parts = path.split('.');
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }

        current[parts[parts.length - 1]] = value;
    }

    /**
     * Get execution status
     * Delegates to flow execution repository
     */
    async getExecutionStatus(executionId: string): Promise<any> {
        const execution = await this.flowExecutionRepository.findOne({
            where: { executionId },
            relations: ['nodeExecutions'],
        });

        if (!execution) {
            throw new NotFoundException('Execution not found');
        }

        return {
            id: execution.id,
            executionId: execution.executionId,
            flowId: execution.flowId,
            status: execution.status,
            startTime: execution.startTime,
            endTime: execution.endTime,
            result: execution.result,
            error: execution.error,
            nodeExecutions: execution.nodeExecutions,
        };
    }

    /**
     * Get execution history for a user
     */
    async getExecutionHistory(
        userId: string,
        templateId?: string,
    ): Promise<any[]> {
        // TODO: Query flow executions filtered by template
        // For now, return empty array
        return [];
    }

    /**
     * Cancel an execution
     */
    async cancelExecution(executionId: string): Promise<void> {
        // TODO: Implement cancel via flow execution service
        const execution = await this.flowExecutionRepository.findOne({
            where: { executionId },
        });

        if (!execution) {
            throw new NotFoundException('Execution not found');
        }

        if (execution.status === 'completed' || execution.status === 'failed') {
            throw new Error('Cannot cancel completed or failed execution');
        }

        // Update status
        execution.status = 'failed';
        execution.error = 'Cancelled by user';
        execution.endTime = Date.now();
        await this.flowExecutionRepository.save(execution);
    }
}
