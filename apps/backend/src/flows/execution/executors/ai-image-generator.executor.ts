import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';
import { AiProvidersService } from '../../../ai-providers/ai-providers.service';
import { FilesService } from '../../../files/files.service';
import { ExecutionArtifactService } from '../../services/execution-artifact.service';

@Injectable()
export class AIImageGeneratorExecutor implements NodeExecutor {
  constructor(
    private readonly aiProvidersService: AiProvidersService,
    private readonly filesService: FilesService,
    private readonly artifactService: ExecutionArtifactService,
  ) { }

  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const { prompt, style, size, model } = input.data;
      const { executionId, workspaceId, flowExecutionId } = input.context;

      if (!prompt) {
        return {
          success: false,
          output: null,
          error: 'Prompt is required for image generation',
        };
      }

      // Generate image using AI provider
      const imageBuffer = await this.generateImage({
        prompt,
        style,
        size: size || '1024x1024',
        model: model || 'dall-e-3',
        workspaceId,
      });

      if (!imageBuffer) {
        return {
          success: false,
          output: null,
          error: 'Failed to generate image',
        };
      }

      const output: any = {
        fileId: null,
        downloadUrl: null,
        artifactType: 'image',
        name: `AI Generated Image: ${prompt.substring(0, 50)}...`,
        metadata: {
          prompt,
          style,
          size,
          model,
          generator: 'ai-image-generator',
        },
      };

      // Upload to file storage
      const filename = `ai-generated-${Date.now()}.png`;
      const fileEntity = await this.filesService.create({
        file: imageBuffer,
        filename,
        mimeType: 'image/png',
        path: `executions/${executionId}/artifacts`,
      });

      output.fileId = fileEntity.id;

      // Get download URL
      const downloadUrl = await this.filesService.generateDownloadUrl(
        fileEntity.id,
      );
      output.downloadUrl = downloadUrl;

      // Create artifact record only if flowExecutionId is available
      if (flowExecutionId) {
        const artifact = await this.artifactService.createArtifact({
          executionId: flowExecutionId,
          fileId: fileEntity.id,
          artifactType: 'image',
          name: `AI Generated Image: ${prompt.substring(0, 50)}...`,
          description: `Generated with prompt: ${prompt}`,
          metadata: {
            prompt,
            style,
            size,
            model,
            generator: 'ai-image-generator',
          },
          size: imageBuffer.length,
          mimeType: 'image/png',
        });

        output.artifactId = artifact.id;
      }

      return {
        success: true,
        output,
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: `AI image generation failed: ${error.message}`,
      };
    }
  }

  private async generateImage(params: {
    prompt: string;
    style?: string;
    size: string;
    model: string;
    workspaceId?: string;
  }): Promise<Buffer | null> {
    const { prompt, style, size, model, workspaceId } = params;

    try {
      let apiKey: string | null = null;
      let providerKey = 'openai';

      // 1. Try workspace config
      if (workspaceId) {
        try {
          const workspaceConfigs =
            await this.aiProvidersService.getWorkspaceConfigs(workspaceId);
          // Look for OpenAI config or any config that supports image generation
          // For now hardcoded to OpenAI as it's the only one we implemented
          const imageConfig = workspaceConfigs.find(
            (config) => config.provider?.key === 'openai' && config.isActive,
          );

          if (imageConfig) {
            // Access decrypted config
            // Note: In a real scenario we might need a method to get decrypted config specifically
            // But getWorkspaceConfigs returns decrypted configs in the service
            apiKey = imageConfig.config.apiKey;
            providerKey = imageConfig.provider?.key || 'openai';
          }
        } catch (workspaceError) {
          console.warn('Workspace AI config failed:', workspaceError.message);
        }
      }

      // 2. Call AI Service
      // If apiKey is null, the service will try to use system default
      return await this.aiProvidersService.generateImage(
        prompt,
        providerKey,
        model,
        size,
        apiKey,
      );

    } catch (error) {
      console.error('Image generation error:', error);
      return null;
    }
  }
}
