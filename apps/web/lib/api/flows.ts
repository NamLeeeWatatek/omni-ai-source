import axiosClient from '@/lib/axios-client';


import type {
    Flow,
    FlowExecution,
    CreateFlowFromTemplateDto
} from '@/lib/types/flow';

export const flowsApi = {
    /**
     * Get all flows with pagination and filters
     */
    async getAll(params?: Record<string, any>): Promise<any> {
        return await axiosClient.get('/flows', { params });
    },

    /**
     * Get workflow statistics
     */
    async getStats(): Promise<any> {
        return await axiosClient.get('/flows/stats');
    },

    /**
     * Get flow by ID
     */
    async getOne(id: string): Promise<Flow> {
        return await axiosClient.get(`/flows/${id}`);
    },

    /**
     * Execute flow
     */
    async execute(id: string, input?: any): Promise<{ executionId: string; flowId: string; status: string; startedAt: string }> {
        return await axiosClient.post(`/flows/${id}/execute`, input);
    },

    /**
     * Get execution status
     */
    async getExecution(executionId: string): Promise<FlowExecution> {
        return await axiosClient.get(`/flows/executions/${executionId}`);
    },

    /**
     * Get flow executions
     */
    async getExecutions(flowId: string): Promise<FlowExecution[]> {
        return await axiosClient.get(`/flows/${flowId}/executions`);
    },

    /**
     * Create new flow
     */
    async create(data: Partial<Flow>): Promise<Flow> {
        return await axiosClient.post('/flows', data);
    },

    /**
     * Duplicate existing flow
     */
    async duplicate(id: string): Promise<Flow> {
        return await axiosClient.post(`/flows/${id}/duplicate`);
    },

    /**
     * Update flow
     */
    async update(id: string, data: Partial<Flow>): Promise<Flow> {
        return await axiosClient.patch(`/flows/${id}`, data);
    },

    /**
     * Delete flow
     */
    async delete(id: string): Promise<void> {
        await axiosClient.delete(`/flows/${id}`);
    },
};

