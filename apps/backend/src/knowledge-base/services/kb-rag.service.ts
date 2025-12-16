import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KBEmbeddingsService } from './kb-embeddings.service';
import { KBVectorService } from './kb-vector.service';
import { AiProvidersService } from '../../ai-providers/ai-providers.service';
import type { ChatMessage } from '../../ai-providers/ai-providers.service';
import { BotEntity } from '../../bots/infrastructure/persistence/relational/entities/bot.entity';
import { KnowledgeBaseEntity } from '../infrastructure/persistence/relational/entities/knowledge-base.entity';

export interface RAGResult {
  answer: string;
  sources: Array<{
    content: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
}

@Injectable()
export class KBRagService {
  private readonly logger = new Logger(KBRagService.name);

  constructor(
    private readonly embeddingsService: KBEmbeddingsService,
    private readonly vectorService: KBVectorService,
    private readonly aiProvidersService: AiProvidersService,
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    @InjectRepository(KnowledgeBaseEntity)
    private readonly kbRepository: Repository<KnowledgeBaseEntity>,
  ) {}

  async query(
    query: string,
    knowledgeBaseId?: string,
    limit: number = 5,
    similarityThreshold: number = 0.7,
  ) {
    try {
      const queryEmbedding =
        await this.embeddingsService.generateQueryEmbedding(
          query,
          undefined,
          knowledgeBaseId,
        );
      const filter = knowledgeBaseId ? { knowledgeBaseId } : undefined;
      const results = await this.vectorService.search(
        queryEmbedding,
        limit,
        filter,
      );
      if (results.length > 0) {
        results.forEach((r, i) => {
          this.logger.log(
            `  [${i + 1}] Score: ${r.score.toFixed(4)} | Content: ${r.payload.content?.substring(0, 100)}...`,
          );
        });
      }

      const filteredResults = results.filter(
        (r) => r.score >= similarityThreshold,
      );

      const validResults = filteredResults.filter((r) => r.payload.content);

      return validResults.map((result) => ({
        content: result.payload.content,
        score: result.score,
        metadata: result.payload.metadata,
        documentId: result.payload.documentId,
        chunkIndex: result.payload.chunkIndex,
      }));
    } catch (error) {
      this.logger.error(`Error querying knowledge base: ${error.message}`);
      throw error;
    }
  }

  async generateAnswer(
    question: string,
    knowledgeBaseId?: string,
    model?: string,
    options?: {
      limit?: number;
      similarityThreshold?: number;
    },
  ): Promise<RAGResult> {
    try {
      const limit = options?.limit || 5;
      const threshold = options?.similarityThreshold || 0.5;

      const relevantChunks = await this.query(
        question,
        knowledgeBaseId,
        limit,
        threshold,
      );

      if (relevantChunks.length === 0) {
        this.logger.warn(
          `âš ï¸ No relevant chunks found for question: "${question}"`,
        );
        return {
          answer: "I don't have enough information to answer that question.",
          sources: [],
        };
      }

      this.logger.log(
        `âœ… Using ${relevantChunks.length} chunks for answer generation`,
      );

      const context = relevantChunks
        .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
        .join('\n\n');

      const prompt = `Based on the following context, answer the question. If the context doesn't contain relevant information, say so.

Context:
${context}

Question: ${question}

Answer:`;

      // âœ… Use configured AI provider for the knowledge base if available
      let answer: string;
      if (knowledgeBaseId) {
        // Try to get knowledge base and use its configured AI provider
        answer = await this.generateAnswerFromKb(
          prompt,
          knowledgeBaseId,
          model,
        );
      } else {
        // Fallback to default provider
        answer = await this.aiProvidersService.chat(
          prompt,
          model || 'gemini-2.0-flash',
        );
      }

      return {
        answer,
        sources: relevantChunks.map((chunk) => ({
          content: chunk.content,
          score: chunk.score,
          metadata: chunk.metadata,
        })),
      };
    } catch (error) {
      this.logger.error(`Error generating answer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate answer using knowledge base's configured AI provider
   */
  private async generateAnswerFromKb(
    prompt: string,
    knowledgeBaseId: string,
    model?: string,
  ): Promise<string> {
    try {
      const kb = await this.kbRepository.findOne({
        where: { id: knowledgeBaseId },
      });

      // Use KB's RAG model if configured, otherwise fall back to the model parameter or default
      const finalModel = kb?.ragModel || model || 'gemini-2.0-flash';

      if (kb && kb.aiProviderId) {
        const userId = kb.createdBy;

        // Try workspace provider first, then user provider
        if (
          kb.workspaceId &&
          (await this.aiProvidersService.configExists(
            kb.aiProviderId,
            'workspace',
            kb.workspaceId,
          )) &&
          kb.workspaceId
        ) {
          this.logger.log(
            `ðŸ”Ž Using KB's workspace AI provider: ${kb.aiProviderId} with model: ${finalModel}`,
          );
          return await this.aiProvidersService.chatWithHistoryUsingProvider(
            [{ role: 'user', content: prompt }],
            finalModel,
            kb.aiProviderId,
            'workspace',
            kb.workspaceId,
          );
        } else if (
          await this.aiProvidersService.configExists(
            kb.aiProviderId,
            'user',
            userId,
          )
        ) {
          this.logger.log(
            `ðŸ”Ž Using KB's user AI provider: ${kb.aiProviderId} with model: ${finalModel}`,
          );
          return await this.aiProvidersService.chatWithHistoryUsingProvider(
            [{ role: 'user', content: prompt }],
            finalModel,
            kb.aiProviderId,
            'user',
            userId,
          );
        } else {
          this.logger.log(
            `ðŸ”Ž KB AI provider ${kb.aiProviderId} not found, using default with model: ${finalModel}`,
          );
          return await this.aiProvidersService.chat(prompt, finalModel);
        }
      } else {
        this.logger.log(
          `ðŸ”Ž KB provider config incomplete, using default with model: ${finalModel}`,
        );
        return await this.aiProvidersService.chat(prompt, finalModel);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to use KB AI provider, falling back to default: ${error.message}`,
      );
      return await this.aiProvidersService.chat(
        prompt,
        model || 'gemini-2.0-flash',
      );
    }
  }

  async generateAnswerForAgent(
    question: string,
    agentId: string,
    conversationHistory?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>,
    model?: string,
    botSystemPrompt?: string,
  ): Promise<RAGResult> {
    try {
      const bot = await this.botRepository.findOne({
        where: { id: agentId },
        select: [
          'id',
          'name',
          'workspaceId',
          'aiProviderId',
          'aiModelName',
          'createdBy',
        ],
      });

      if (!bot) {
        throw new Error(`Bot ${agentId} not found`);
      }

      const workspaceId = bot.workspaceId ?? undefined;
      const aiProviderId = bot.aiProviderId ?? undefined;
      const modelName = model || bot.aiModelName || 'gemini-2.0-flash';

      this.logger.log(
        `ðŸ¤– Bot: ${bot.name}, Workspace: ${workspaceId}, AI Provider: ${aiProviderId || 'auto'}, Model: ${modelName}`,
      );

      let relevantChunks: any[] = [];

      // Try to query knowledge base, but don't fail if it errors
      try {
        relevantChunks = await this.query(question, undefined, 5, 0.5);
        this.logger.log(
          `âœ… Found ${relevantChunks.length} relevant chunks from KB`,
        );
      } catch (kbError) {
        this.logger.warn(
          `âš ï¸ Knowledge base query failed: ${kbError.message}. Continuing without KB context.`,
        );
        // Continue without KB context
      }

      let systemPrompt = botSystemPrompt || 'You are a helpful assistant.';

      if (relevantChunks.length > 0) {
        const context = relevantChunks
          .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
          .join('\n\n');

        systemPrompt += `\n\nUse the following context from the knowledge base to answer questions:\n\n${context}`;
        this.logger.log(`ðŸ“š Using KB context (${context.length} chars)`);
      } else {
        this.logger.log(`ðŸ’¬ No KB context available, using AI only`);
      }

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        ...(conversationHistory || []),
        {
          role: 'user' as const,
          content: question,
        },
      ];

      // âœ… Use chatWithHistoryUsingProvider to properly get API key from user settings
      const answer = aiProviderId
        ? await this.aiProvidersService.chatWithHistoryUsingProvider(
            messages,
            modelName,
            aiProviderId,
            workspaceId ? 'workspace' : 'user',
            workspaceId || bot.createdBy,
          )
        : await this.aiProvidersService.chatWithHistory(messages, modelName);

      return {
        answer,
        sources: relevantChunks.map((chunk) => ({
          content: chunk.content,
          score: chunk.score,
          metadata: chunk.metadata,
        })),
      };
    } catch (error) {
      this.logger.error(`Error generating answer for agent: ${error.message}`);
      throw error;
    }
  }

  async chatWithBot(
    message: string,
    botSystemPrompt?: string,
    conversationHistory?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>,
    model?: string,
  ): Promise<string> {
    try {
      const systemPrompt = botSystemPrompt || 'You are a helpful assistant.';

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        ...(conversationHistory || []),
        {
          role: 'user' as const,
          content: message,
        },
      ];

      return await this.aiProvidersService.chatWithHistory(
        messages,
        model || 'gemini-2.0-flash',
      );
    } catch (error) {
      this.logger.error(`Error in chat: ${error.message}`);
      throw error;
    }
  }

  async chatWithBotAndRAG(
    message: string,
    botId?: string,
    knowledgeBaseIds?: string[],
    conversationHistory?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>,
    model?: string,
  ): Promise<RAGResult> {
    try {
      // Load bot configuration first (if provided)
      const bot = botId
        ? await this.botRepository.findOne({
            where: { id: botId },
            select: [
              'id',
              'name',
              'workspaceId',
              'aiProviderId',
              'aiModelName',
              'systemPrompt',
              'createdBy',
            ],
          })
        : null;

      if (!bot && botId) {
        throw new Error(`Bot ${botId} not found`);
      }

      if (botId && !bot) {
        throw new Error(`Bot ${botId} not found`);
      }

      // Set system prompt and model (prioritize bot config, then parameters)
      const systemPrompt = bot?.systemPrompt || 'You are a helpful assistant.';
      const botModel = bot?.aiModelName || model || 'gemini-2.0-flash';

      this.logger.log(
        `🤖 Bot: ${bot?.name || 'No bot'} | Model: ${botModel} | KB Count: ${knowledgeBaseIds?.length || 0}`,
      );

      // Handle RAG context gathering (if knowledge bases provided)
      let ragContext = '';
      let ragSources: Array<{
        content: string;
        score: number;
        metadata?: Record<string, any>;
      }> = [];

      if (knowledgeBaseIds && knowledgeBaseIds.length > 0) {
        const allChunks = await this.gatherRAGContext(
          message,
          knowledgeBaseIds,
        );
        ragSources = allChunks.slice(0, 5); // Top 5 results

        if (ragSources.length > 0) {
          ragContext = ragSources
            .map((chunk, i) => `[Source ${i + 1}]\n${chunk.content}`)
            .join('\n\n');
        }

        this.logger.log(
          `📚 RAG Context gathered: ${ragSources.length} sources`,
        );
      }

      // Build messages with system prompt + RAG context + conversation history
      const messages = this.buildMessages(
        systemPrompt,
        ragContext,
        conversationHistory || [],
        message,
      );

      // Get AI provider using proper hierarchy: Bot > KB Workspace > KB User > User Configs > Error
      const providerConfig = await this.resolveAIProvider(
        bot,
        knowledgeBaseIds?.[0],
      );

      if (!providerConfig) {
        throw new Error(
          `No AI provider configured for bot. Please configure an AI provider in Settings first.`,
        );
      }

      // Chat with resolved provider
      const answer = await this.aiProvidersService.chatWithHistoryUsingProvider(
        messages,
        botModel,
        providerConfig.providerId,
        providerConfig.scope,
        providerConfig.scopeId,
      );

      this.logger.log(`💬 RAG Answer generated (${answer.length} chars)`);

      return {
        answer,
        sources: ragSources,
      };
    } catch (error) {
      this.logger.error(`Error in chatWithBotAndRAG: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gather RAG context from knowledge bases
   */
  private async gatherRAGContext(
    message: string,
    knowledgeBaseIds: string[],
  ): Promise<
    Array<{
      content: string;
      score: number;
      metadata?: Record<string, any>;
    }>
  > {
    const allChunks: Array<{
      content: string;
      score: number;
      metadata?: Record<string, any>;
    }> = [];

    for (const kbId of knowledgeBaseIds) {
      try {
        const chunks = await this.query(message, kbId, 3, 0.5);
        allChunks.push(...chunks);
      } catch (error) {
        this.logger.warn(`Failed to query KB ${kbId}: ${error.message}`);
      }
    }

    // Sort by score descending
    return allChunks.sort((a, b) => b.score - a.score);
  }

  /**
   * Build conversation messages with system prompt, RAG context, and history
   */
  private buildMessages(
    systemPrompt: string,
    ragContext: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    currentMessage: string,
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    let fullSystemPrompt = systemPrompt;

    if (ragContext) {
      fullSystemPrompt +=
        '\n\nYou have access to the following information from the knowledge base:\n\n' +
        `${ragContext}\n\n` +
        "Use this information to answer the user's question. If the information is not in the knowledge base, say so clearly.";
    }

    return [
      { role: 'system', content: fullSystemPrompt },
      ...conversationHistory,
      { role: 'user', content: currentMessage },
    ];
  }

  /**
   * Resolve AI provider with proper hierarchy
   * Priority: Bot Provider > KB Workspace Provider > KB User Provider > User Configs > Fail
   */
  private async resolveAIProvider(
    bot?: BotEntity | null,
    knowledgeBaseId?: string,
  ): Promise<{
    providerId: string;
    scope: 'workspace' | 'user';
    scopeId: string;
  } | null> {
    // 1. Bot's AI provider (highest priority)
    if (bot?.aiProviderId) {
      if (
        bot.workspaceId &&
        (await this.aiProvidersService.configExists(
          bot.aiProviderId,
          'workspace',
          bot.workspaceId,
        ))
      ) {
        this.logger.log(
          `🎯 Using bot's workspace AI provider: ${bot.aiProviderId}`,
        );
        return {
          providerId: bot.aiProviderId,
          scope: 'workspace',
          scopeId: bot.workspaceId,
        };
      }

      if (
        await this.aiProvidersService.configExists(
          bot.aiProviderId,
          'user',
          bot.createdBy,
        )
      ) {
        this.logger.log(`🎯 Using bot's user AI provider: ${bot.aiProviderId}`);
        return {
          providerId: bot.aiProviderId,
          scope: 'user',
          scopeId: bot.createdBy,
        };
      }
    }

    // 2. Knowledge Base AI provider (if KB provided)
    if (knowledgeBaseId) {
      const kb = await this.kbRepository.findOne({
        where: { id: knowledgeBaseId },
      });

      if (kb?.aiProviderId) {
        const userId = kb.createdBy;

        if (
          kb.workspaceId &&
          (await this.aiProvidersService.configExists(
            kb.aiProviderId,
            'workspace',
            kb.workspaceId,
          ))
        ) {
          this.logger.log(
            `📋 Using knowledge base's workspace AI provider: ${kb.aiProviderId}`,
          );
          return {
            providerId: kb.aiProviderId,
            scope: 'workspace',
            scopeId: kb.workspaceId,
          };
        }

        if (
          await this.aiProvidersService.configExists(
            kb.aiProviderId,
            'user',
            userId,
          )
        ) {
          this.logger.log(
            `📋 Using knowledge base's user AI provider: ${kb.aiProviderId}`,
          );
          return {
            providerId: kb.aiProviderId,
            scope: 'user',
            scopeId: userId,
          };
        }
      }
    }

    // 3. User's fallback providers (only if bot exists)
    if (bot) {
      const userProviders = await this.aiProvidersService.getUserConfigs(
        bot.createdBy,
      );
      const activeProviders = userProviders.filter((p) => p.isActive);

      if (activeProviders.length > 0) {
        const provider = activeProviders[0];
        this.logger.log(
          `🔄 Using user's fallback AI provider: ${provider.displayName} (${provider.providerId})`,
        );
        return {
          providerId: provider.providerId,
          scope: 'user',
          scopeId: bot.createdBy,
        };
      }
    }

    // No provider found
    this.logger.warn(
      `❌ No AI provider found for bot ${bot?.name || 'unknown'}`,
    );
    return null;
  }
}
