import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserAiProviderEntity,
  WorkspaceAiProviderEntity,
  AiUsageLogEntity,
} from './infrastructure/persistence/relational/entities/ai-provider.entity';
import {
  CreateUserAiProviderDto,
  UpdateUserAiProviderDto,
  CreateWorkspaceAiProviderDto,
  UpdateWorkspaceAiProviderDto,
} from './dto/ai-provider.dto';
import * as crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiProvidersService {
  private readonly logger = new Logger(AiProvidersService.name);
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(UserAiProviderEntity)
    private userProviderRepo: Repository<UserAiProviderEntity>,
    @InjectRepository(WorkspaceAiProviderEntity)
    private workspaceProviderRepo: Repository<WorkspaceAiProviderEntity>,
    @InjectRepository(AiUsageLogEntity)
    private usageLogRepo: Repository<AiUsageLogEntity>,
  ) {
    this.encryptionKey =
      process.env.ENCRYPTION_KEY || 'default-key-32-chars-long!!!!!';
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32)),
      iv,
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(text: string): string {
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32)),
      iv,
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async createUserProvider(userId: string, dto: CreateUserAiProviderDto) {
    const provider = this.userProviderRepo.create({
      userId,
      provider: dto.provider,
      displayName: dto.displayName,
      apiKeyEncrypted: this.encrypt(dto.apiKey),
      modelList: dto.modelList,
      isActive: true,
      isVerified: false,
    });
    return this.userProviderRepo.save(provider);
  }

  async getUserProviders(userId: string) {
    return this.userProviderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserProvider(userId: string, id: string) {
    const provider = await this.userProviderRepo.findOne({
      where: { id, userId },
    });
    if (!provider) {
      throw new NotFoundException('AI provider not found');
    }
    return provider;
  }

  async updateUserProvider(
    userId: string,
    id: string,
    dto: UpdateUserAiProviderDto,
  ) {
    const provider = await this.getUserProvider(userId, id);

    if (dto.displayName) provider.displayName = dto.displayName;
    if (dto.apiKey) {
      provider.apiKeyEncrypted = this.encrypt(dto.apiKey);
      provider.isVerified = false;
    }
    if (dto.modelList) provider.modelList = dto.modelList;
    if (dto.isActive !== undefined) provider.isActive = dto.isActive;

    return this.userProviderRepo.save(provider);
  }

  async deleteUserProvider(userId: string, id: string) {
    const provider = await this.getUserProvider(userId, id);
    await this.userProviderRepo.remove(provider);
  }

  async verifyUserProvider(userId: string, id: string) {
    const provider = await this.getUserProvider(userId, id);
    const apiKey = this.decrypt(provider.apiKeyEncrypted!);

    const isValid = await this.verifyApiKey(provider.provider, apiKey);
    if (!isValid) {
      throw new BadRequestException('Invalid API key');
    }

    provider.isVerified = true;
    provider.verifiedAt = new Date();
    return this.userProviderRepo.save(provider);
  }

  async createWorkspaceProvider(
    workspaceId: string,
    dto: CreateWorkspaceAiProviderDto,
  ) {
    const provider = this.workspaceProviderRepo.create({
      workspaceId,
      provider: dto.provider,
      displayName: dto.displayName,
      apiKeyEncrypted: this.encrypt(dto.apiKey),
      modelList: dto.modelList,
      isActive: true,
    });
    return this.workspaceProviderRepo.save(provider);
  }

  async getWorkspaceProviders(workspaceId: string) {
    return this.workspaceProviderRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async getWorkspaceProvider(workspaceId: string, id: string) {
    const provider = await this.workspaceProviderRepo.findOne({
      where: { id, workspaceId },
    });
    if (!provider) {
      throw new NotFoundException('AI provider not found');
    }
    return provider;
  }

  async updateWorkspaceProvider(
    workspaceId: string,
    id: string,
    dto: UpdateWorkspaceAiProviderDto,
  ) {
    const provider = await this.getWorkspaceProvider(workspaceId, id);

    if (dto.displayName) provider.displayName = dto.displayName;
    if (dto.apiKey) provider.apiKeyEncrypted = this.encrypt(dto.apiKey);
    if (dto.modelList) provider.modelList = dto.modelList;
    if (dto.isActive !== undefined) provider.isActive = dto.isActive;

    return this.workspaceProviderRepo.save(provider);
  }

  async deleteWorkspaceProvider(workspaceId: string, id: string) {
    const provider = await this.getWorkspaceProvider(workspaceId, id);
    await this.workspaceProviderRepo.remove(provider);
  }

  async logUsage(data: {
    workspaceId: string;
    userId: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost?: number;
  }) {
    const log = this.usageLogRepo.create({
      ...data,
      cost: data.cost ?? 0,
      requestedAt: new Date(),
    });
    return this.usageLogRepo.save(log);
  }

  async getUsageLogs(
    workspaceId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      provider?: string;
    },
  ) {
    const query = this.usageLogRepo
      .createQueryBuilder('log')
      .where('log.workspaceId = :workspaceId', { workspaceId });

    if (options?.startDate) {
      query.andWhere('log.requestedAt >= :startDate', {
        startDate: options.startDate,
      });
    }
    if (options?.endDate) {
      query.andWhere('log.requestedAt <= :endDate', {
        endDate: options.endDate,
      });
    }
    if (options?.userId) {
      query.andWhere('log.userId = :userId', { userId: options.userId });
    }
    if (options?.provider) {
      query.andWhere('log.provider = :provider', {
        provider: options.provider,
      });
    }

    return query.orderBy('log.requestedAt', 'DESC').getMany();
  }

  async getUsageStats(workspaceId: string, period: 'day' | 'week' | 'month') {
    const startDate = new Date();
    if (period === 'day') startDate.setDate(startDate.getDate() - 1);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else startDate.setMonth(startDate.getMonth() - 1);

    const result = await this.usageLogRepo
      .createQueryBuilder('log')
      .select('log.provider', 'provider')
      .addSelect('log.model', 'model')
      .addSelect('SUM(log.inputTokens)', 'totalInputTokens')
      .addSelect('SUM(log.outputTokens)', 'totalOutputTokens')
      .addSelect('SUM(log.cost)', 'totalCost')
      .addSelect('COUNT(*)', 'requestCount')
      .where('log.workspaceId = :workspaceId', { workspaceId })
      .andWhere('log.requestedAt >= :startDate', { startDate })
      .groupBy('log.provider')
      .addGroupBy('log.model')
      .getRawMany();

    return result;
  }

  private async verifyApiKey(
    provider: string,
    apiKey: string,
  ): Promise<boolean> {
    try {
      switch (provider) {
        case 'openai':
          const openaiRes = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          return openaiRes.ok;

        case 'anthropic':
          const anthropicRes = await fetch(
            'https://api.anthropic.com/v1/messages',
            {
              method: 'POST',
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'Hi' }],
              }),
            },
          );
          return anthropicRes.ok || anthropicRes.status === 400;

        case 'google':
          return true;

        default:
          return true;
      }
    } catch {
      return false;
    }
  }

  async getDecryptedApiKey(
    type: 'user' | 'workspace',
    id: string,
  ): Promise<string | null> {
    if (type === 'user') {
      const provider = await this.userProviderRepo.findOne({ where: { id } });
      if (!provider?.apiKeyEncrypted) return null;
      return this.decrypt(provider.apiKeyEncrypted);
    } else {
      const provider = await this.workspaceProviderRepo.findOne({
        where: { id },
      });
      if (!provider?.apiKeyEncrypted) return null;
      return this.decrypt(provider.apiKeyEncrypted);
    }
  }

  private getApiKey(provider: string): string {
    const envKeys: Record<string, string | undefined> = {
      google: process.env.GOOGLE_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
    };
    const key = envKeys[provider];
    if (!key) {
      throw new BadRequestException(
        `API key not configured for provider: ${provider}. Please set ${provider.toUpperCase()}_API_KEY in .env or add it in Settings > AI Providers`,
      );
    }
    return key;
  }

  private async getApiKeyForModel(
    model: string,
    userId?: string,
    workspaceId?: string,
  ): Promise<string | null> {
    const provider = this.getProviderFromModel(model);

    // Try workspace provider first
    if (workspaceId) {
      const workspaceProviders = await this.workspaceProviderRepo.find({
        where: { 
          workspaceId, 
          provider: provider as any,
          isActive: true,
        },
      });

      for (const wp of workspaceProviders) {
        if (!wp.modelList || wp.modelList.length === 0 || wp.modelList.includes(model)) {
          if (wp.apiKeyEncrypted) {
            return this.decrypt(wp.apiKeyEncrypted);
          }
        }
      }
    }

    // Try user provider
    if (userId) {
      const userProviders = await this.userProviderRepo.find({
        where: { 
          userId, 
          provider: provider as any,
          isActive: true,
        },
      });

      for (const up of userProviders) {
        if (!up.modelList || up.modelList.length === 0 || up.modelList.includes(model)) {
          if (up.apiKeyEncrypted) {
            return this.decrypt(up.apiKeyEncrypted);
          }
        }
      }
    }

    // Fallback to environment variable
    return null;
  }

  async chat(
    prompt: string, 
    model?: string,
    userId?: string,
    workspaceId?: string
  ): Promise<string> {
    const modelName = model || 'gemini-2.0-flash';
    
    // Try to get user/workspace provider first
    const apiKey = await this.getApiKeyForModel(modelName, userId, workspaceId);
    const provider = this.getProviderFromModel(modelName);

    this.logger.log(
      `Chat request - Provider: ${provider}, Model: ${modelName}`,
    );

    switch (provider) {
      case 'google':
        return this.chatWithGoogle(prompt, modelName, apiKey);
      case 'openai':
        return this.chatWithOpenAI(prompt, modelName, apiKey);
      case 'anthropic':
        return this.chatWithAnthropic(prompt, modelName, apiKey);
      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
  }

  async chatWithHistory(
    messages: ChatMessage[],
    model?: string,
    userId?: string,
    workspaceId?: string,
  ): Promise<string> {
    const modelName = model || 'gemini-2.0-flash';
    const apiKey = await this.getApiKeyForModel(modelName, userId, workspaceId);
    const provider = this.getProviderFromModel(modelName);

    this.logger.log(
      `Chat with history - Provider: ${provider}, Model: ${modelName}`,
    );

    switch (provider) {
      case 'google':
        return this.chatWithGoogleHistory(messages, modelName, apiKey);
      case 'openai':
        return this.chatWithOpenAIHistory(messages, modelName, apiKey);
      case 'anthropic':
        return this.chatWithAnthropicHistory(messages, modelName, apiKey);
      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
  }

  async generateEmbedding(
    text: string,
    provider: string = 'google',
    options?: { model?: string },
  ): Promise<number[]> {
    const model = options?.model || 'text-embedding-004';

    this.logger.log(
      `Generating embedding - Provider: ${provider}, Model: ${model}`,
    );

    switch (provider) {
      case 'google':
        return this.generateGoogleEmbedding(text, model);
      case 'openai':
        return this.generateOpenAIEmbedding(text, model);
      default:
        throw new BadRequestException(
          `Embedding not supported for provider: ${provider}`,
        );
    }
  }

  private getProviderFromModel(model: string): string {
    if (model.startsWith('gemini') || model.startsWith('text-embedding')) {
      return 'google';
    }
    if (
      model.startsWith('gpt') ||
      model.startsWith('text-embedding-ada') ||
      model.startsWith('text-embedding-3')
    ) {
      return 'openai';
    }
    if (model.startsWith('claude')) {
      return 'anthropic';
    }
    return 'google';
  }

  private async chatWithGoogle(prompt: string, model: string, apiKey?: string | null): Promise<string> {
    const key = apiKey || this.getApiKey('google');
    const genAI = new GoogleGenerativeAI(key);
    const genModel = genAI.getGenerativeModel({ model });
    const result = await genModel.generateContent(prompt);
    return result.response.text();
  }

  private async chatWithGoogleHistory(
    messages: ChatMessage[],
    model: string,
    apiKey?: string | null,
  ): Promise<string> {
    const key = apiKey || this.getApiKey('google');
    const genAI = new GoogleGenerativeAI(key);
    
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const modelConfig: any = { 
      model,
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        },
      ],
    };
    
    if (systemMessage?.content) {
      modelConfig.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }
    
    const genModel = genAI.getGenerativeModel(modelConfig);

    const history = chatMessages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = genModel.startChat({
      history,
    });

    const lastMessage = chatMessages[chatMessages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  }

  private async generateGoogleEmbedding(
    text: string,
    model: string,
  ): Promise<number[]> {
    const apiKey = this.getApiKey('google');
    const genAI = new GoogleGenerativeAI(apiKey);
    const embeddingModel = genAI.getGenerativeModel({ model });
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  }

  private async chatWithOpenAI(prompt: string, model: string, apiKey?: string | null): Promise<string> {
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
  ): Promise<number[]> {
    const apiKey = this.getApiKey('openai');
    const openai = new OpenAI({ apiKey });
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
}
