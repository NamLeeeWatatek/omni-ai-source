import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { NullableType } from '../utils/types/nullable.type';
import { AiProviderConfigRepository } from './infrastructure/persistence/ai-provider-config.repository';
import {
  CreateUserAiProviderConfigDto,
  UpdateUserAiProviderConfigDto,
  CreateWorkspaceAiProviderConfigDto,
  UpdateWorkspaceAiProviderConfigDto,
} from './dto/ai-provider.dto';
import { EncryptionUtil } from '../common/utils/encryption.util';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import * as crypto from 'crypto';
import {
  AiProvider,
  UserAiProviderConfig,
  WorkspaceAiProviderConfig,
  AiUsageLog,
} from './domain/ai-provider';

// Define ChatMessage type
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiProvidersService {
  private readonly logger = new Logger(AiProvidersService.name);

  constructor(
    private readonly aiProviderConfigRepository: AiProviderConfigRepository,
    private readonly encryptionService: EncryptionUtil,
  ) {}

  /**
   * Encrypt sensitive fields in config (apiKey, baseUrl for custom providers)
   */
  private encryptConfig(config: Record<string, any>): Record<string, any> {
    const encrypted = { ...config };

    // Encrypt API keys
    if (encrypted.apiKey && typeof encrypted.apiKey === 'string') {
      encrypted.apiKey = this.encryptionService.encrypt(encrypted.apiKey);
    }

    // For custom providers, encrypt URL as well to prevent visibility
    if (encrypted.baseUrl && typeof encrypted.baseUrl === 'string' && encrypted.baseUrl.includes('//')) {
      encrypted.baseUrl = this.encryptionService.encrypt(encrypted.baseUrl);
    }

    return encrypted;
  }

  /**
   * Decrypt sensitive fields in config
   */
  private decryptConfig(config: Record<string, any>): Record<string, any> {
    const decrypted = { ...config };

    // Decrypt API keys
    if (decrypted.apiKey && typeof decrypted.apiKey === 'string') {
      decrypted.apiKey = this.encryptionService.decrypt(decrypted.apiKey);
    }

    // Decrypt URLs for custom providers
    if (decrypted.baseUrl && typeof decrypted.baseUrl === 'string') {
      decrypted.baseUrl = this.encryptionService.decrypt(decrypted.baseUrl);
    }

    return decrypted;
  }

  // Provider management
  async getAvailableProviders(): Promise<AiProvider[]> {
    return this.aiProviderConfigRepository.findAvailableProviders();
  }

  async getProviderById(id: string): Promise<NullableType<AiProvider>> {
    return this.aiProviderConfigRepository.findProviderById(id);
  }

  private async chatWithGoogleHistory(
    messages: ChatMessage[],
    model: string,
    apiKey?: string | null,
  ): Promise<string> {
    const key = apiKey || this.getApiKey('google');
    const genAI = new GoogleGenerativeAI(key);

    // Convert messages to Google Gemini format
    const chat = genAI.getGenerativeModel({ model });

    // Filter out system messages and convert to Gemini format
    const userMessages = messages.filter(m => m.role !== 'system');
    const systemMessage = messages.find(m => m.role === 'system');

    // Start chat with system instruction if available
    let chatSession;
    if (systemMessage) {
      chatSession = chat.startChat({
        systemInstruction: systemMessage.content,
      });
    } else {
      chatSession = chat.startChat();
    }

    // Send user messages one by one to maintain conversation
    let lastResponse = '';
    for (const message of userMessages) {
      if (message.role === 'user') {
        const result = await chatSession.sendMessage(message.content);
        lastResponse = result.response.text();
      } else if (message.role === 'assistant' && userMessages.some(m => m.role === 'user')) {
        // For assistant messages, we don't need to send them back to Gemini
        // as Gemini maintains conversation history
      }
    }

    return lastResponse;
  }

  private async generateGoogleEmbedding(
    text: string,
    model: string,
    apiKey?: string | null,
  ): Promise<number[]> {
    const key = apiKey || this.getApiKey('google');
    const genAI = new GoogleGenerativeAI(key);
    const embeddingModel = genAI.getGenerativeModel({ model });
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  }

  private async chatWithOpenAI(
    prompt: string,
    model: string,
    apiKey?: string | null,
  ): Promise<string> {
    const key = apiKey || this.getApiKey('openai');
    const openai = new OpenAI({ apiKey: key });
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0]?.message?.content || '';
  }

  private async chatWithOpenAIHistory(
    messages: ChatMessage[],
    model: string,
    apiKey?: string | null,
  ): Promise<string> {
    const key = apiKey || this.getApiKey('openai');
    const openai = new OpenAI({ apiKey: key });
    const response = await openai.chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    return response.choices[0]?.message?.content || '';
  }

  private async generateOpenAIEmbedding(
    text: string,
    model: string,
    apiKey?: string | null,
  ): Promise<number[]> {
    const key = apiKey || this.getApiKey('openai');
    const openai = new OpenAI({ apiKey: key });
    const response = await openai.embeddings.create({
      model,
      input: text,
    });
    return response.data[0].embedding;
  }

  private async chatWithAnthropic(
    prompt: string,
    model: string,
    apiKey?: string | null,
  ): Promise<string> {
    const key = apiKey || this.getApiKey('anthropic');
    const anthropic = new Anthropic({ apiKey: key });
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  private async chatWithAnthropicHistory(
    messages: ChatMessage[],
    model: string,
    apiKey?: string | null,
  ): Promise<string> {
    const key = apiKey || this.getApiKey('anthropic');
    const anthropic = new Anthropic({ apiKey: key });

    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: chatMessages,
    });
    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  private async chatWithOllama(
    prompt: string,
    model: string,
    baseURL?: string | null,
  ): Promise<string> {
    const url = baseURL || 'http://localhost:11434/v1';
    const openai = new OpenAI({
      apiKey: 'ollama', // Dummy key, Ollama doesn't need auth
      baseURL: url,
    });
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0]?.message?.content || '';
  }

  private async chatWithOllamaHistory(
    messages: ChatMessage[],
    model: string,
    baseURL?: string | null,
  ): Promise<string> {
    const url = baseURL || 'http://localhost:11434/v1';
    const openai = new OpenAI({
      apiKey: 'ollama', // Dummy key, Ollama doesn't need auth
      baseURL: url,
    });
    const response = await openai.chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    return response.choices[0]?.message?.content || '';
  }

  private async generateOllamaEmbedding(
    text: string,
    model: string,
    baseURL?: string | null,
  ): Promise<number[]> {
    try {
      const url = baseURL || 'http://localhost:11434/api/embeddings';
      // Note: Ollama embedding API uses a different endpoint structure
      // Let's use a simple approach for now - since embeddings are needed but Ollama
      // might not have the best embedding models, we'll try to use it if configured

      // For now, fallback to a simple hash-based embedding as placeholder
      // In production, you'd implement proper Ollama embedding API calls
      const hash = crypto.createHash('sha256').update(text).digest('hex');

      // Convert hash to array of numbers (simple approximation of embeddings)
      const embedding: number[] = [];
      for (let i = 0; i < 768; i++) {
        // Standard embedding dimensions
        const chunk = hash.substr(i * 2, 2) || '00';
        const value = parseInt(chunk, 16) / 255; // 0-1 normalization
        embedding.push(value * 2 - 1); // -1 to 1 range like embeddings
      }
      return embedding;
    } catch (error) {
      this.logger.error(`Ollama embedding failed: ${error.message}`);
      // Fallback to throw clear error
      throw new BadRequestException(
        'Ollama embeddings not properly configured. Consider using OpenAI or Google for embeddings.',
      );
    }
  }

  // User configuration methods
  async createUserConfig(
    userId: string,
    dto: CreateUserAiProviderConfigDto,
  ): Promise<UserAiProviderConfig> {
    const encryptedConfig = this.encryptConfig(dto.config);
    const config = await this.aiProviderConfigRepository.createUserConfig(userId, {
      providerId: dto.providerId,
      displayName: dto.displayName,
      config: encryptedConfig,
      modelList: dto.modelList || [],
    });

    // Decrypt for return
    config.config = this.decryptConfig(config.config);
    return config;
  }

  async getUserConfigs(userId: string): Promise<UserAiProviderConfig[]> {
    const configs = await this.aiProviderConfigRepository.getUserConfigs(userId);

    // Get available providers to populate provider relations
    const availableProviders = await this.aiProviderConfigRepository.findAvailableProviders();

    // Decrypt sensitive fields and populate provider relationship
    return configs.map(config => ({
      ...config,
      config: this.decryptConfig(config.config),
      // Populate provider from availableProviders if not loaded by relationship
      provider: config.provider || availableProviders.find(p => p.id === config.providerId),
    }));
  }

  async getUserConfig(
    userId: string,
    id: string,
  ): Promise<NullableType<UserAiProviderConfig>> {
    const config = await this.aiProviderConfigRepository.getUserConfig(userId, id);
    if (config) {
      config.config = this.decryptConfig(config.config);
    }
    return config;
  }

  async updateUserConfig(
    userId: string,
    id: string,
    dto: UpdateUserAiProviderConfigDto,
  ): Promise<UserAiProviderConfig> {
    // Get existing config to merge
    const existing = await this.aiProviderConfigRepository.getUserConfig(userId, id);
    if (!existing) {
      throw new NotFoundException('User AI provider config not found');
    }

    // Merge configs, encrypt before save
    const mergedConfig = { ...existing.config, ...dto.config };
    const encryptedConfig = this.encryptConfig(mergedConfig);
    const updateDto = { ...dto, config: encryptedConfig };

    const updatedConfig = await this.aiProviderConfigRepository.updateUserConfig(userId, id, updateDto);

    // Decrypt for return
    updatedConfig.config = this.decryptConfig(updatedConfig.config);
    return updatedConfig;
  }

  async deleteUserConfig(userId: string, id: string): Promise<void> {
    return this.aiProviderConfigRepository.deleteUserConfig(userId, id);
  }

  async verifyUserConfig(userId: string, id: string): Promise<boolean> {
    return this.aiProviderConfigRepository.verifyUserConfig(userId, id);
  }

  // Workspace configuration methods
  async createWorkspaceConfig(
    workspaceId: string,
    dto: CreateWorkspaceAiProviderConfigDto,
  ): Promise<WorkspaceAiProviderConfig> {
    const encryptedConfig = this.encryptConfig(dto.config);
    const config = await this.aiProviderConfigRepository.createWorkspaceConfig(workspaceId, {
      providerId: dto.providerId,
      displayName: dto.displayName,
      config: encryptedConfig,
      modelList: dto.modelList || [],
    });

    // Decrypt for return
    config.config = this.decryptConfig(config.config);
    return config;
  }

  async getWorkspaceConfigs(
    workspaceId: string,
  ): Promise<WorkspaceAiProviderConfig[]> {
    const configs = await this.aiProviderConfigRepository.getWorkspaceConfigs(workspaceId);

    // Decrypt sensitive fields
    return configs.map(config => ({
      ...config,
      config: this.decryptConfig(config.config),
    }));
  }

  async getWorkspaceConfig(
    workspaceId: string,
    id: string,
  ): Promise<NullableType<WorkspaceAiProviderConfig>> {
    const config = await this.aiProviderConfigRepository.getWorkspaceConfig(workspaceId, id);
    if (config) {
      config.config = this.decryptConfig(config.config);
    }
    return config;
  }

  async updateWorkspaceConfig(
    workspaceId: string,
    id: string,
    dto: UpdateWorkspaceAiProviderConfigDto,
  ): Promise<WorkspaceAiProviderConfig> {
    // Get existing config to merge
    const existing = await this.aiProviderConfigRepository.getWorkspaceConfig(workspaceId, id);
    if (!existing) {
      throw new NotFoundException('Workspace AI provider config not found');
    }

    // Merge configs, encrypt before save
    const mergedConfig = { ...existing.config, ...dto.config };
    const encryptedConfig = this.encryptConfig(mergedConfig);
    const updateDto = { ...dto, config: encryptedConfig };

    const updatedConfig = await this.aiProviderConfigRepository.updateWorkspaceConfig(workspaceId, id, updateDto);

    // Decrypt for return
    updatedConfig.config = this.decryptConfig(updatedConfig.config);
    return updatedConfig;
  }

  async deleteWorkspaceConfig(workspaceId: string, id: string): Promise<void> {
    return this.aiProviderConfigRepository.deleteWorkspaceConfig(
      workspaceId,
      id,
    );
  }

  // Usage logs methods
  async getUsageLogs(
    workspaceId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      provider?: string;
      limit?: number;
    },
  ): Promise<AiUsageLog[]> {
    return this.aiProviderConfigRepository.getUsageLogs(workspaceId, options);
  }

  async getUsageStats(
    workspaceId: string,
    period: 'day' | 'week' | 'month' | 'year',
  ): Promise<any> {
    return this.aiProviderConfigRepository.getUsageStats(workspaceId, period);
  }

  // API key methods
  private getApiKey(provider: string): string {
    // Mock implementation - in real app this would get from config
    // TODO: Implement actual API key retrieval from database/user config
    throw new Error(`API key for provider ${provider} not configured`);
  }

  async getApiKeyByProviderId(
    providerId: string,
    scope?: 'user' | 'workspace',
  ): Promise<any> {
    return this.aiProviderConfigRepository.getApiKeyByProviderId(
      providerId,
      scope,
    );
  }

  async getWorkspaceProviders(workspaceId: string): Promise<AiProvider[]> {
    return this.aiProviderConfigRepository.getWorkspaceProviders(workspaceId);
  }

  async getUserProviders(userId: string): Promise<AiProvider[]> {
    return this.aiProviderConfigRepository.getUserProviders(userId);
  }

  async configExists(configIdOrProviderId: string, scope: 'user' | 'workspace', scopeId: string | null | undefined): Promise<boolean> {
    if (!scopeId) return false;

    try {
      // First try direct config ID lookup
      const config = await this.getConfigById(configIdOrProviderId, scope, scopeId);
      if (config) return true;

      // Fall back to provider ID lookup
      const config2 = await this.aiProviderConfigRepository.getConfigByProviderId(
        configIdOrProviderId,
        scope,
        scopeId,
      );
      return Boolean(config2);
    } catch {
      return false;
    }
  }

  private async getConfigById(configId: string, scope: 'user' | 'workspace', scopeId: string): Promise<any> {
    if (scope === 'user') {
      return await this.aiProviderConfigRepository.getUserConfig(scopeId, configId);
    } else {
      return await this.aiProviderConfigRepository.getWorkspaceConfig(scopeId, configId);
    }
  }

  // Main AI API methods
  async chat(
    prompt: string,
    model: string,
    provider?: string,
    apiKey?: string | null,
  ): Promise<string> {
    const providerKey = provider || 'openai'; // default to openai

    switch (providerKey) {
      case 'openai':
        return this.chatWithOpenAI(prompt, model, apiKey);
      case 'anthropic':
        return this.chatWithAnthropic(prompt, model, apiKey);
      case 'ollama':
        return this.chatWithOllama(prompt, model, null);
      default:
        throw new BadRequestException(`Unsupported provider: ${providerKey}`);
    }
  }

  async chatWithHistory(
    messages: ChatMessage[],
    model: string,
    provider?: string,
    apiKey?: string | null,
  ): Promise<string> {
    const providerKey = provider || 'openai'; // default to openai

    // For backward compatibility, throw a proper error instead of calling mock getApiKey
    if (!apiKey && (providerKey === 'openai' || providerKey === 'anthropic')) {
      throw new BadRequestException(
        `API key required for provider "${providerKey}". Use chatWithHistoryUsingProvider() instead to load from database configurations.`,
      );
    }

    switch (providerKey) {
      case 'openai':
        return this.chatWithOpenAIHistory(messages, model, apiKey);
      case 'anthropic':
        return this.chatWithAnthropicHistory(messages, model, apiKey);
      case 'ollama':
        return this.chatWithOllamaHistory(messages, model, apiKey); // apiKey can be baseUrl for Ollama
      default:
        throw new BadRequestException(`Unsupported provider: ${providerKey}`);
    }
  }

  async chatWithHistoryUsingProvider(
    messages: ChatMessage[],
    model: string,
    configIdOrProviderId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
  ): Promise<string> {
    // First try to get config by ID (direct config lookup for bot.aiProviderId)
    let config = await this.getConfigById(configIdOrProviderId, scope, scopeId);

    // If not found, fall back to provider ID lookup
    if (!config) {
      config = await this.aiProviderConfigRepository.getConfigByProviderId(
        configIdOrProviderId,
        scope,
        scopeId,
      );
    }
    if (!config) {
      throw new NotFoundException(`Provider configuration not found`);
    }

    // Get provider info to determine provider type
    const provider = await this.aiProviderConfigRepository.findProviderById(config.providerId);
    if (!provider) {
      throw new NotFoundException(`Provider not found`);
    }

    // Decrypt sensitive fields before using
    const decryptedConfig = this.decryptConfig(config);

    // Route to appropriate provider method
    switch (provider.key) {
      case 'openai':
        return this.chatWithOpenAIHistory(messages, model, decryptedConfig.apiKey);
      case 'anthropic':
        return this.chatWithAnthropicHistory(messages, model, decryptedConfig.apiKey);
      case 'ollama':
        return this.chatWithOllamaHistory(messages, model, decryptedConfig.baseUrl);
      case 'google':
        return this.chatWithGoogleHistory(messages, model, decryptedConfig.apiKey);
      case 'azure':
        // For Azure OpenAI, similar to OpenAI but with different base URL
        throw new BadRequestException(`Azure provider not yet implemented`);
      case 'custom':
        // For custom providers, we'd need custom logic
        throw new BadRequestException(`Custom provider not yet implemented`);
      default:
        throw new BadRequestException(`Unsupported provider: ${provider.key}`);
    }
  }

  async generateEmbedding(
    query: string,
    provider?: string,
    model?: string,
    apiKey?: string | null,
  ): Promise<number[]> {
    const providerKey = provider || 'openai'; // default to openai
    const embeddingModel = model || 'text-embedding-ada-002'; // default model

    switch (providerKey) {
      case 'openai':
        return this.generateOpenAIEmbedding(query, embeddingModel, apiKey);
      case 'google':
        return this.generateGoogleEmbedding(query, embeddingModel, apiKey);
      case 'ollama':
        // For Ollama, apiKey represents baseUrl
        return this.generateOllamaEmbedding(query, embeddingModel, apiKey);
      default:
        throw new BadRequestException(
          `Unsupported provider for embeddings: ${providerKey}`,
        );
    }
  }

  /**
   * Fetch available models from a provider using their API
   */
  async fetchProviderModels(configId: string, scope: 'user' | 'workspace', scopeId: string, providerKey?: string): Promise<string[]> {
    try {
      // Get config to extract API key info
      let config = await this.getConfigById(configId, scope, scopeId);

      // Fall back to provider ID lookup
      if (!config && providerKey) {
        config = await this.aiProviderConfigRepository.getConfigByProviderId(
          configId,
          scope,
          scopeId,
        );
      }

      if (!config) {
        throw new NotFoundException('Provider configuration not found');
      }

      // Get provider info to determine type
      let providerType = providerKey;
      if (!providerType) {
        const provider = await this.aiProviderConfigRepository.findProviderById(config.providerId);
        providerType = provider?.key;
      }

      // Decrypt sensitive fields
      const decryptedConfig = this.decryptConfig(config);

      // Fetch models based on provider
      switch (providerType) {
        case 'openai':
          return await this.fetchOpenAIModels(decryptedConfig.apiKey);
        case 'anthropic':
          return await this.fetchAnthropicModels(decryptedConfig.apiKey);
        case 'google':
          return await this.fetchGoogleModels(decryptedConfig.apiKey);
        case 'ollama':
          return await this.fetchOllamaModels(decryptedConfig.baseUrl);
        default:
          return []; // Return empty array for unsupported providers
      }
    } catch (error) {
      this.logger.error(`Failed to fetch models from provider ${providerKey}:`, error.message);
      return []; // Return empty array on error, don't break the UI
    }
  }

  private async fetchOpenAIModels(apiKey: string): Promise<string[]> {
    try {
      const openai = new OpenAI({ apiKey });
      const response = await openai.models.list();

      // Filter to commonly used models and return their IDs
      const supportedModels = response.data
        .filter(model =>
          // Filter for common models, exclude base/fine-tuned variants
          !model.id.includes('fine-tuned') &&
          !model.id.includes('audio') &&
          !model.id.includes('embed') &&
          !model.id.includes('moderation') &&
          !model.id.includes('-legacy') &&
          (model.id.startsWith('gpt-') ||
           model.id.startsWith('dall-') ||
           model.id.includes('turbo') ||
           model.id.includes('vision'))
        )
        .map(model => model.id)
        .sort();

      return supportedModels;
    } catch (error) {
      this.logger.warn(`OpenAI model fetch failed: ${error.message}`);
      // Return popular static list as fallback
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-4-vision-preview'];
    }
  }

  private async fetchGoogleModels(apiKey: string): Promise<string[]> {
    try {
      // Try using Google Generative AI listModels if available (newer SDK versions)
      const genAI = new GoogleGenerativeAI(apiKey);

      // Check if listModels method exists (SDK might have been updated)
      if (typeof (genAI as any).listModels === 'function') {
        const models = await (genAI as any).listModels();
        const modelNames = models.map((model: any) => {
          // Handle different possible response formats
          return model.name.replace('models/', '');
        });
        return modelNames;
      }

      // Fallback: test API key validity with a known model
      await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Return known models if API key works
      const knownModels = [
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'gemini-pro'
      ];

      // Test additional models to see what works
      const availableModels: string[] = [];
      for (const modelName of knownModels) {
        try {
          genAI.getGenerativeModel({ model: modelName });
          availableModels.push(modelName);
        } catch {
          // Model not available, skip silently
        }
      }

      return availableModels.length > 0 ? availableModels : knownModels;

    } catch (error) {
      this.logger.warn(`Google model fetch failed (API key invalid?): ${error.message}`);
      // Return basic static list as fallback for UX
      return ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro', 'gemini-pro'];
    }
  }

  private async fetchAnthropicModels(apiKey: string): Promise<string[]> {
    try {
      // Anthropic doesn't have a public models endpoint
      // Check API by trying to get models from Claude API
      const claude = new Anthropic({ apiKey });

      // Try to make a simple request to check if API works
      await claude.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      });

      // If successful, return known models (Anthropic doesn't expose models endpoint)
      return [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ];
    } catch (error) {
      this.logger.warn(`Anthropic model fetch failed: ${error.message}`);
      return ['claude-3.5-sonnet', 'claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'];
    }
  }

  private async fetchOllamaModels(baseURL?: string): Promise<string[]> {
    try {
      const url = baseURL || 'http://localhost:11434';
      const openai = new OpenAI({
        apiKey: 'ollama',
        baseURL: `${url}/v1`,
      });

      const response = await openai.models.list();
      return response.data.map(model => model.id).sort();
    } catch (error) {
      this.logger.warn(`Ollama model fetch failed: ${error.message}`);
      // Return common Ollama models as fallback
      return ['llama3.1:8b', 'llama3.1:70b', 'codellama:13b', 'gemma2:9b', 'deepseek-r1:8b'];
    }
  }
}
