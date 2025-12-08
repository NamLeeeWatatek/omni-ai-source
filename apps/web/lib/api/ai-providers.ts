import { axiosClient } from '../axios-client';

export interface UserAiProvider {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  displayName: string;
  apiKeyMasked?: string;  // ✅ Masked API key for display (e.g., "sk-...xyz123")
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
  // User providers
  getUserProviders: () => 
    axiosClient.get<UserAiProvider[]>('/ai-providers/user'),
  
  getUserProvider: (id: string) => 
    axiosClient.get<UserAiProvider>(`/ai-providers/user/${id}`),
  
  createUserProvider: (data: CreateUserAiProviderDto) => 
    axiosClient.post<UserAiProvider>('/ai-providers/user', data),
  
  updateUserProvider: (id: string, data: UpdateUserAiProviderDto) => 
    axiosClient.patch<UserAiProvider>(`/ai-providers/user/${id}`, data),
  
  deleteUserProvider: (id: string) => 
    axiosClient.delete(`/ai-providers/user/${id}`),
  
  verifyUserProvider: (id: string) => 
    axiosClient.post<UserAiProvider>(`/ai-providers/user/${id}/verify`),

  // Models
  getAvailableModels: () => 
    axiosClient.get('/ai-providers/models'),
};
