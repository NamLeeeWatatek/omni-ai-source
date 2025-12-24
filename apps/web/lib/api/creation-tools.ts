import { axiosClient } from '../axios-client';

export interface CreationTool {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    coverImage?: string;
    category?: string;
    formConfig: FormConfig;
    executionFlow: ExecutionFlow;
    isActive: boolean;
    workspaceId?: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface FormConfig {
    fields: FormField[];
    layout?: 'single-column' | 'two-column' | 'wizard';
    submitLabel?: string;
}

export interface FormField {
    name: string;
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'file' | 'slider' | 'color' | 'channel-selector';
    label: string;
    placeholder?: string;
    description?: string;
    defaultValue?: any;
    options?: Array<{ label: string; value: any; icon?: string }>;
    validation?: {
        required?: boolean;
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        customMessage?: string;
    };
    showIf?: {
        field: string;
        operator: 'equals' | 'not-equals' | 'contains';
        value: any;
    };
}

export interface ExecutionFlow {
    type: 'ai-generation' | 'bot-execution' | 'workflow';
    provider?: string;
    model?: string;
    endpoint?: string;
    parameters?: Record<string, any>;
    outputType?: 'image' | 'video' | 'audio' | 'text' | 'json';
}

export const creationToolsApi = {
    getActive: async (): Promise<CreationTool[]> => {
        // Active tokens only
        const data: any = await axiosClient.get('/creation-tools/active');
        return Array.isArray(data) ? data : [];
    },

    getAllAdmin: async (): Promise<CreationTool[]> => {
        // Fetch all tools (active & inactive) for admin management
        // Endpoint returns standard pagination: { data: [...], hasNextPage: boolean }
        const response: any = await axiosClient.get('/creation-tools?limit=100');
        return response?.data && Array.isArray(response.data) ? response.data : [];
    },

    getBySlug: async (slug: string): Promise<CreationTool> => {
        const data: any = await axiosClient.get(`/creation-tools/slug/${slug}`);
        return data;
    },

    getById: async (id: string): Promise<CreationTool> => {
        const data: any = await axiosClient.get(`/creation-tools/${id}`);
        return data;
    },

    create: async (data: Partial<CreationTool>): Promise<CreationTool> => {
        return await axiosClient.post('/creation-tools', data);
    },

    update: async (id: string, data: Partial<CreationTool>): Promise<CreationTool> => {
        return await axiosClient.patch(`/creation-tools/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        await axiosClient.delete(`/creation-tools/${id}`);
    },
};
