import { Injectable } from '@nestjs/common';
import {
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';
import { BaseNodeExecutor } from '../base-node-executor';
import { KBRagService } from '../../../knowledge-base/services/kb-rag.service';

@Injectable()
export class KBQueryExecutor extends BaseNodeExecutor {
  constructor(private readonly ragService: KBRagService) {
    super();
  }

  protected async run(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const { query, knowledgeBaseId, limit = 5, minScore = 0.5 } = input.data;

      if (!query) {
        return {
          success: false,
          output: null,
          error: 'Query is required for KB Query node',
        };
      }

      if (!knowledgeBaseId) {
        return {
          success: false,
          output: null,
          error: 'Knowledge Base ID is required',
        };
      }

      const results = await this.ragService.query(
        query,
        input.context.workspaceId!,
        knowledgeBaseId,
        limit,
        minScore,
      );

      // Filter by score if minScore is provided
      const filteredResults = results.filter((r) => r.score >= minScore);

      return {
        success: true,
        output: {
          results: filteredResults,
          context: filteredResults.map((r) => r.content).join('\n\n'),
          count: filteredResults.length,
          hasResults: filteredResults.length > 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: `KB Query failed: ${error.message}`,
      };
    }
  }
}
