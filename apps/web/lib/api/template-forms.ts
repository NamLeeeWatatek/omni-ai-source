import axiosClient from '@/lib/axios-client';

export interface FormField {
    id: string;
    type: 'text' | 'textarea' | 'image' | 'multi-select' | 'select' | 'number' | 'file';
    label: string;
    required?: boolean;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    accept?: string; // For file inputs
    multiple?: boolean; // For file/image inputs
}

export interface TemplateForm {
    id: string;
    name: string;
    description?: string;
    category: string;
    icon?: string;
    formSchema: FormField[];
    flowTemplateId: string;
    inputMapping: Record<string, string>;
    uiConfig?: {
        submitButtonText?: string;
        successMessage?: string;
        theme?: any;
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ExecuteTemplateInput {
    inputData: Record<string, any>;
}

export interface ExecutionStatus {
    id: string;
    executionId: string;
    flowId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    startTime: number;
    endTime?: number;
    result?: any;
    error?: string;
}

export const templateFormsApi = {
    /**
     * Get all template forms, optionally filtered by category
     */
    async getAll(category?: string): Promise<TemplateForm[]> {
        const params = category ? { category } : {};
        const res = await axiosClient.get('/template-forms', { params });
        return res.data;
    },

    /**
     * Get a single template form by ID
     */
    async getOne(id: string): Promise<TemplateForm> {
        const res = await axiosClient.get(`/template-forms/${id}`);
        return res.data;
    },

    /**
     * Get form schema for rendering (may include additional UI metadata)
     */
    async getFormSchema(id: string): Promise<{ formSchema: FormField[]; uiConfig?: any }> {
        const res = await axiosClient.get(`/template-forms/${id}/schema`);
        return res.data;
    },

    /**
     * Execute a template form with provided input data
     */
    async execute(id: string, input: ExecuteTemplateInput): Promise<{ flowId: string; executionId: string; message: string }> {
        const res = await axiosClient.post(`/template-forms/${id}/execute`, input);
        return res.data;
    },

    /**
     * Get execution status
     */
    async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
        const res = await axiosClient.get(`/template-forms/executions/${executionId}`);
        return res.data;
    },

    /**
     * Cancel an execution
     */
    async cancelExecution(executionId: string): Promise<{ message: string }> {
        const res = await axiosClient.post(`/template-forms/executions/${executionId}/cancel`);
        return res.data;
    },

    /**
     * Get execution history for current user
     */
    async getHistory(templateId?: string): Promise<ExecutionStatus[]> {
        const params = templateId ? { templateId } : {};
        const res = await axiosClient.get('/template-forms/history/user', { params });
        return res.data;
    },
};
