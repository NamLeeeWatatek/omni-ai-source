import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: Record<string, any>;
}

export interface SearchResult {
  id: string;
  score: number;
  payload: Record<string, any>;
}

@Injectable()
export class KBVectorService {
  private readonly logger = new Logger(KBVectorService.name);
  private qdrantClient: QdrantClient | null = null;
  private readonly collectionName = 'knowledge-base';
  private readonly isAvailable: boolean;

  constructor() {
    const qdrantUrl = process.env.QDRANT_URL;
    const qdrantApiKey = process.env.QDRANT_API_KEY;
    if (qdrantUrl && qdrantApiKey) {
      try {

        this.qdrantClient = new QdrantClient({
          url: qdrantUrl,
          apiKey: qdrantApiKey,
        });
        this.isAvailable = true;
        this.logger.log('[SUCCESS] Qdrant vector service initialized');
        this.initializeCollection().catch((error) => {
          this.logger.error(
            `Failed to initialize collection: ${error.message}`,
          );
        });
      } catch (error) {
        this.isAvailable = false;
        this.logger.error(
          `[ERROR] Failed to initialize Qdrant: ${error.message}`,
        );
      }
    } else {
      this.isAvailable = false;
      this.logger.warn(
        '[WARNING] Qdrant credentials not found - Vector search disabled',
      );
    }
  }

  private async initializeCollection(): Promise<void> {
    if (!this.qdrantClient) {
      this.logger.warn(
        'Cannot initialize collection: Qdrant client not available',
      );
      return;
    }

    try {
      this.logger.log('Checking Qdrant connection and collection...');

      this.logger.log(
        '[INFO] Testing Qdrant connection by listing collections...',
      );
      const collections = await this.qdrantClient.getCollections();
      this.logger.log(
        `[SUCCESS] Successfully connected to Qdrant. Found ${collections.collections.length} collections`,
      );

      const exists = collections.collections.some(
        (c) => c.name === this.collectionName,
      );
      console.log('collections', collections);
      if (!exists) {
        this.logger.log(`Creating collection '${this.collectionName}'...`);
        await this.qdrantClient.createCollection(this.collectionName, {
          vectors: {
            size: 768,
            distance: 'Cosine',
          },
        });
        this.logger.log(
          `[SUCCESS] Collection '${this.collectionName}' created successfully`,
        );
      } else {
        this.logger.log(
          `[SUCCESS] Collection '${this.collectionName}' already exists`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[ERROR] Failed to initialize Qdrant collection: ${error.message}`,
      );

      // Provide specific troubleshooting info
      if (error.message.includes('fetch')) {
        this.logger.error(
          '[WARNING] NETWORK ERROR: Cannot connect to Qdrant server',
        );
        this.logger.error(`   URL: ${process.env.QDRANT_URL}`);
        this.logger.error('   Possible causes:');
        this.logger.error('   - Qdrant server is down');
        this.logger.error('   - Firewall blocking outbound connections');
        this.logger.error('   - DNS resolution issues');
        this.logger.error('   - HTTPS certificate validation failed');
        this.logger.error(
          '   [TIP] Test API access: curl -H "api-key: ' +
            process.env.QDRANT_API_KEY +
            '" ' +
            process.env.QDRANT_URL +
            '/collections',
        );
        this.logger.error(
          '   [TIP] Test with different API endpoints to check permissions',
        );
      }

      this.logger.error(
        '[WARNING] Knowledge base vector search will not work until Qdrant is accessible',
      );
      this.logger.error(
        '[WARNING] Document upload will create records but skip vectorization',
      );
    }
  }

  async upsertVector(point: VectorPoint): Promise<string> {
    if (!this.qdrantClient) {
      throw new Error('Qdrant client not available');
    }

    try {
      const sanitizedPayload = {
        ...point.payload,
        content: point.payload.content
          ? Buffer.from(point.payload.content, 'utf-8').toString('utf-8')
          : '',
      };

      await this.qdrantClient.upsert(this.collectionName, {
        points: [
          {
            id: point.id,
            vector: point.vector,
            payload: sanitizedPayload,
          },
        ],
      });

      return point.id;
    } catch (error) {
      this.logger.error(`Error upserting vector: ${error.message}`);
      throw error;
    }
  }

  async search(
    vector: number[],
    limit: number = 5,
    filter?: Record<string, any>,
  ): Promise<SearchResult[]> {
    if (!this.qdrantClient) {
      this.logger.warn('Qdrant client not available - returning empty results');
      return [];
    }

    try {
      const searchResult = await this.qdrantClient.search(this.collectionName, {
        vector,
        limit,
        filter: filter ? this.buildFilter(filter) : undefined,
      });

      return searchResult.map((result) => ({
        id: result.id as string,
        score: result.score,
        payload: result.payload as Record<string, any>,
      }));
    } catch (error) {
      this.logger.error(`Error searching vectors: ${error.message}`);
      throw error;
    }
  }

  async deleteVector(id: string): Promise<void> {
    if (!this.qdrantClient) {
      this.logger.warn('Qdrant client not available - skipping delete');
      return;
    }

    try {
      await this.qdrantClient.delete(this.collectionName, {
        points: [id],
      });
    } catch (error) {
      this.logger.error(`Error deleting vector: ${error.message}`);
      throw error;
    }
  }

  async deleteByFilter(filter: Record<string, any>): Promise<void> {
    if (!this.qdrantClient) {
      this.logger.warn('Qdrant client not available - skipping delete');
      return;
    }

    try {
      await this.qdrantClient.delete(this.collectionName, {
        filter: this.buildFilter(filter),
      });
    } catch (error) {
      this.logger.error(`Error deleting by filter: ${error.message}`);
      throw error;
    }
  }

  private buildFilter(filter: Record<string, any>): any {
    const must = Object.entries(filter).map(([key, value]) => ({
      key,
      match: { value },
    }));

    return { must };
  }

  isServiceAvailable(): boolean {
    return this.isAvailable && this.qdrantClient !== null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.qdrantClient) {
      return false;
    }

    try {
      await this.qdrantClient.getCollections();
      return true;
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  async ensureCollection(): Promise<boolean> {
    if (!this.qdrantClient) {
      return false;
    }

    try {
      const collections = await this.qdrantClient.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName,
      );

      if (!exists) {
        await this.qdrantClient.createCollection(this.collectionName, {
          vectors: {
            size: 768,
            distance: 'Cosine',
          },
        });
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to ensure collection: ${error.message}`);
      return false;
    }
  }
}
