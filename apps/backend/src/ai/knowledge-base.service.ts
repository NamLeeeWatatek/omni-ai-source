import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface QueryResult {
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private qdrantClient: QdrantClient;
  private genAI: GoogleGenerativeAI;
  private readonly collectionName = 'knowledge-base';
  private readonly embeddingModel = 'embedding-001';

  constructor(private configService: ConfigService) {
    // Initialize Qdrant client
    const qdrantUrl = process.env.QDRANT_URL;
    const qdrantApiKey = process.env.QDRANT_API_KEY;

    if (qdrantUrl && qdrantApiKey) {
      try {
        this.qdrantClient = new QdrantClient({
          url: qdrantUrl,
          apiKey: qdrantApiKey,
          // Disable compatibility check to avoid connection errors on startup
          checkCompatibility: false,
        });
        this.logger.log('✅ Qdrant client initialized');
      } catch (error) {
        this.logger.error(`❌ Failed to initialize Qdrant: ${error.message}`);
        this.logger.warn('⚠️ Knowledge base will be disabled');
      }
    } else {
      this.logger.warn('⚠️ Qdrant credentials not found - Knowledge base disabled');
    }

    // Initialize Google AI
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (googleApiKey) {
      this.genAI = new GoogleGenerativeAI(googleApiKey);
      this.logger.log('✅ Google AI initialized');
    } else {
      this.logger.warn('⚠️ Google API key not found - Embeddings disabled');
    }
  }

  /**
   * Initialize collection if not exists
   */
  async initializeCollection(): Promise<void> {
    if (!this.qdrantClient) {
      throw new Error('Qdrant client not initialized');
    }

    try {
      // Check if collection exists
      const collections = await this.qdrantClient.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName,
      );

      if (!exists) {
        // Create collection with 768 dimensions (Google embedding size)
        await this.qdrantClient.createCollection(this.collectionName, {
          vectors: {
            size: 768,
            distance: 'Cosine',
          },
        });
        this.logger.log(`✅ Collection '${this.collectionName}' created`);
      } else {
        this.logger.log(`✅ Collection '${this.collectionName}' already exists`);
      }
    } catch (error) {
      this.logger.error(`Error initializing collection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate embedding for text using Google AI
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.genAI) {
      throw new Error('Google AI not initialized');
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.embeddingModel,
      });

      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      this.logger.error(`Error generating embedding: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add document to knowledge base
   */
  async addDocument(
    document: Document,
    botId?: string,
  ): Promise<void> {
    if (!this.qdrantClient) {
      this.logger.warn('Qdrant client not available - skipping document add');
      return;
    }

    try {
      // Generate embedding
      const embedding = await this.generateEmbedding(document.content);

      // Add to Qdrant
      await this.qdrantClient.upsert(this.collectionName, {
        points: [
          {
            id: document.id,
            vector: embedding,
            payload: {
              content: document.content,
              botId: botId || 'default',
              ...document.metadata,
              createdAt: new Date().toISOString(),
            },
          },
        ],
      });

      this.logger.log(`✅ Document added: ${document.id}`);
    } catch (error) {
      this.logger.error(`Error adding document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add multiple documents in batch
   */
  async addDocuments(
    documents: Document[],
    botId?: string,
  ): Promise<void> {
    if (!this.qdrantClient) {
      this.logger.warn('Qdrant client not available - skipping documents add');
      return;
    }

    try {
      // Generate embeddings for all documents
      const embeddings = await Promise.all(
        documents.map((doc) => this.generateEmbedding(doc.content)),
      );

      // Prepare points
      const points = documents.map((doc, index) => ({
        id: doc.id,
        vector: embeddings[index],
        payload: {
          content: doc.content,
          botId: botId || 'default',
          ...doc.metadata,
          createdAt: new Date().toISOString(),
        },
      }));

      // Batch upsert
      await this.qdrantClient.upsert(this.collectionName, {
        points,
      });

      this.logger.log(`✅ ${documents.length} documents added`);
    } catch (error) {
      this.logger.error(`Error adding documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Query knowledge base
   */
  async query(
    query: string,
    botId?: string,
    limit: number = 5,
  ): Promise<QueryResult[]> {
    if (!this.qdrantClient) {
      this.logger.warn('Qdrant client not available - returning empty results');
      return [];
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Search in Qdrant
      const searchResult = await this.qdrantClient.search(
        this.collectionName,
        {
          vector: queryEmbedding,
          limit,
          filter: botId
            ? {
                must: [
                  {
                    key: 'botId',
                    match: { value: botId },
                  },
                ],
              }
            : undefined,
        },
      );

      // Format results
      return searchResult.map((result) => ({
        content: result.payload?.content as string,
        score: result.score,
        metadata: result.payload as Record<string, any> | undefined,
      }));
    } catch (error) {
      this.logger.error(`Error querying knowledge base: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate answer using RAG (Retrieval Augmented Generation)
   */
  async generateAnswer(
    question: string,
    botId?: string,
  ): Promise<string> {
    if (!this.qdrantClient || !this.genAI) {
      return 'Knowledge base is not available at the moment. Please try again later.';
    }

    try {
      // 1. Query knowledge base
      const relevantDocs = await this.query(question, botId, 3);

      if (relevantDocs.length === 0) {
        return 'I don\'t have enough information to answer that question.';
      }

      // 2. Build context from relevant documents
      const context = relevantDocs
        .map((doc, index) => `[${index + 1}] ${doc.content}`)
        .join('\n\n');

      // 3. Generate answer using Google AI
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-pro',
      });

      const prompt = `Based on the following context, answer the question. If the context doesn't contain relevant information, say so.

Context:
${context}

Question: ${question}

Answer:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      this.logger.log(`✅ Answer generated for: "${question}"`);

      return answer;
    } catch (error) {
      this.logger.error(`Error generating answer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete document from knowledge base
   */
  async deleteDocument(documentId: string): Promise<void> {
    if (!this.qdrantClient) {
      this.logger.warn('Qdrant client not available - skipping delete');
      return;
    }

    try {
      await this.qdrantClient.delete(this.collectionName, {
        points: [documentId],
      });

      this.logger.log(`✅ Document deleted: ${documentId}`);
    } catch (error) {
      this.logger.error(`Error deleting document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete all documents for a bot
   */
  async deleteAllDocuments(botId: string): Promise<void> {
    if (!this.qdrantClient) {
      this.logger.warn('Qdrant client not available - skipping delete all');
      return;
    }

    try {
      await this.qdrantClient.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: 'botId',
              match: { value: botId },
            },
          ],
        },
      });

      this.logger.log(`✅ All documents deleted for bot: ${botId}`);
    } catch (error) {
      this.logger.error(`Error deleting documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get document count for a bot
   */
  async getDocumentCount(botId?: string): Promise<number> {
    if (!this.qdrantClient) {
      throw new Error('Qdrant client not initialized');
    }

    try {
      const result = await this.qdrantClient.count(this.collectionName, {
        filter: botId
          ? {
              must: [
                {
                  key: 'botId',
                  match: { value: botId },
                },
              ],
            }
          : undefined,
      });

      return result.count;
    } catch (error) {
      this.logger.error(`Error getting document count: ${error.message}`);
      return 0;
    }
  }
}
