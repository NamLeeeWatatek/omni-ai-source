import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';
import { AiProvidersService } from '../../../ai-providers/ai-providers.service';

@Injectable()
export class AIChatExecutor implements NodeExecutor {
  constructor(private readonly aiProvidersService: AiProvidersService) {}

  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const { model, prompt, temperature, maxTokens } = input.data;
      const { workspaceId } = input.context;

      // Interpolate variables in prompt
      const interpolatedPrompt = this.interpolate(prompt, input.input);

      // Determine which provider to use based on model or user settings
      let providerId = 'openai'; // default
      let actualModel = model || 'gpt-4o-mini'; // default model

      // If model contains provider info (like 'anthropic/claude-3-haiku'), extract it
      if (model && model.includes('/')) {
        const [providerKey, modelName] = model.split('/');
        providerId = providerKey;
        actualModel = modelName;
      }

      // Try to find user's configured provider for the model
      if (workspaceId) {
        try {
          // Get workspace configs first
          const workspaceConfigs = await this.aiProvidersService.getWorkspaceConfigs(workspaceId);
          const matchingConfig = workspaceConfigs.find(config =>
            config.provider?.key === providerId && config.isActive
          );

          if (matchingConfig) {
            // Use workspace config
            const result = await this.aiProvidersService.chatWithHistoryUsingProvider(
              [{ role: 'user', content: interpolatedPrompt }],
              actualModel,
              matchingConfig.id,
              'workspace',
              workspaceId
            );

            return {
              success: true,
              output: {
                content: result,
                model: actualModel,
                provider: providerId,
                source: 'workspace-config',
              },
            };
          }
        } catch (workspaceError) {
          console.warn('Workspace AI config failed, trying user config:', workspaceError.message);
        }
      }

      // Fallback to system defaults or direct API keys
      try {
        const result = await this.aiProvidersService.chat(
          interpolatedPrompt,
          actualModel,
          providerId
        );

        return {
          success: true,
          output: {
            content: result,
            model: actualModel,
            provider: providerId,
            source: 'system-default',
          },
        };
      } catch (systemError) {
        console.warn('System AI chat failed:', systemError.message);

        // Final fallback: try to use any available user config
        if (workspaceId) {
          try {
            const workspaceConfigs = await this.aiProvidersService.getWorkspaceConfigs(workspaceId);
            const anyActiveConfig = workspaceConfigs.find(config => config.isActive);

            if (anyActiveConfig) {
              const result = await this.aiProvidersService.chatWithHistoryUsingProvider(
                [{ role: 'user', content: interpolatedPrompt }],
                actualModel,
                anyActiveConfig.id,
                'workspace',
                workspaceId
              );

              return {
                success: true,
                output: {
                  content: result,
                  model: actualModel,
                  provider: anyActiveConfig.provider?.key || 'unknown',
                  source: 'fallback-workspace-config',
                },
              };
            }
          } catch (fallbackError) {
            console.warn('Fallback AI config also failed:', fallbackError.message);
          }
        }

        return {
          success: false,
          output: null,
          error: `AI chat failed: ${systemError.message}. Please check your AI provider settings.`,
        };
      }

    } catch (error) {
      return {
        success: false,
        output: null,
        error: `AI chat execution failed: ${error.message}`,
      };
    }
  }

  private interpolate(template: string, data: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;
      for (const k of keys) {
        value = value?.[k];
      }
      return value !== undefined ? value : match;
    });
  }
}
