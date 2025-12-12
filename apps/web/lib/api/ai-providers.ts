import { axiosClient } from '../axios-client';

export interface UserAiProvider {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  displayName: string;
  apiKeyMasked?: string;  // âœ… Masked API key for display (e.g., "sk-...xyz123")
  modelList?: string[];
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: string;
  quotaUsed: number;
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreateUserAiProviderDto {
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  displayName: string;
  apiKey: string;
  modelList?: string[];
}

export interface UpdateUserAiProviderDto {
  displayName?: string;
  apiKey?: string;
  modelList?: string[];
  isActive?: boolean;
}

export const aiProvidersApi = {
  // Available providers (global list)
  getAvailableProviders: () =>
    axiosClient.get<UserAiProvider[]>('/ai-providers'),

  // User provider configs
  getUserConfigs: () =>
    axiosClient.get<UserAiProvider[]>('/ai-providers/user/configs'),

  getUserConfig: (id: string) =>
    axiosClient.get<UserAiProvider>(`/ai-providers/user/configs/${id}`),

  createUserConfig: (data: CreateUserAiProviderDto) =>
    axiosClient.post<UserAiProvider>('/ai-providers/user/configs', data),

  updateUserConfig: (id: string, data: UpdateUserAiProviderDto) =>
    axiosClient.patch<UserAiProvider>(`/ai-providers/user/configs/${id}`, data),

  deleteUserConfig: (id: string) =>
    axiosClient.delete(`/ai-providers/user/configs/${id}`),

  verifyUserConfig: (id: string) =>
    axiosClient.post<UserAiProvider>(`/ai-providers/user/configs/${id}/verify`),

  // Legacy methods (for backward compatibility)
  getUserProviders: () =>
    axiosClient.get<UserAiProvider[]>('/ai-providers/user/configs'),

  getUserProvider: (id: string) =>
    axiosClient.get<UserAiProvider>(`/ai-providers/user/configs/${id}`),

  createUserProvider: (data: CreateUserAiProviderDto) =>
    axiosClient.post<UserAiProvider>('/ai-providers/user/configs', data),

  updateUserProvider: (id: string, data: UpdateUserAiProviderDto) =>
    axiosClient.patch<UserAiProvider>(`/ai-providers/user/configs/${id}`, data),

  deleteUserProvider: (id: string) =>
    axiosClient.delete(`/ai-providers/user/configs/${id}`),

  verifyUserProvider: (id: string) =>
    axiosClient.post<UserAiProvider>(`/ai-providers/user/configs/${id}/verify`),

  // Models
  getAvailableModels: () => 
    axiosClient.get('/ai-providers/models'),
};
