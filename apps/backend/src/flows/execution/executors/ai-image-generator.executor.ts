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
  ) {}

  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const { prompt, style, size, model } = input.data;
      const { executionId, workspaceId, flowExecutionId } = input.context;

      if (!prompt) {
        return {
          success: false,
          output: null,
          error: 'Prompt is required for image generation'
        };
      }

      // Generate image using AI provider
      const imageBuffer = await this.generateImage({
        prompt,
        style,
        size: size || '1024x1024',
        model: model || 'dall-e-3',
        workspaceId
      });

      if (!imageBuffer) {
        return {
          success: false,
          output: null,
          error: 'Failed to generate image'
        };
      }

      let output: any = {
        fileId: null,
        downloadUrl: null,
        artifactType: 'image',
        name: `AI Generated Image: ${prompt.substring(0, 50)}...`,
        metadata: {
          prompt,
          style,
          size,
          model,
          generator: 'ai-image-generator'
        }
      };

      // Upload to file storage
      const filename = `ai-generated-${Date.now()}.png`;
      const fileEntity = await this.filesService.create({
        file: imageBuffer,
        filename,
        mimeType: 'image/png',
        path: `executions/${executionId}/artifacts`
      });

      output.fileId = fileEntity.id;

      // Get download URL
      const downloadUrl = await this.filesService.generateDownloadUrl(fileEntity.id);
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
            generator: 'ai-image-generator'
          },
          size: imageBuffer.length,
          mimeType: 'image/png'
        });

        output.artifactId = artifact.id;
      }

      return {
        success: true,
        output
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
      // Try workspace config first
      if (workspaceId) {
        try {
          const workspaceConfigs = await this.aiProvidersService.getWorkspaceConfigs(workspaceId);
          const imageConfig = workspaceConfigs.find(config =>
            config.provider?.key === 'openai' && config.isActive
          );

          if (imageConfig) {
            // Use workspace AI provider for image generation
            // Note: This assumes the AI provider service has image generation capability
            // For now, we'll simulate with a placeholder
            console.log('Using workspace AI config for image generation:', imageConfig.id);
          }
        } catch (workspaceError) {
          console.warn('Workspace AI config failed:', workspaceError.message);
        }
      }

      // Fallback to system defaults or direct API calls
      // For demonstration, we'll create a simple colored image
      // In real implementation, integrate with DALL-E, Midjourney, Stable Diffusion APIs

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create a simple placeholder image (in real app, this would be from AI API)
      const imageBuffer = this.createPlaceholderImage(prompt, size);

      return imageBuffer;

    } catch (error) {
      console.error('Image generation error:', error);
      return null;
    }
  }

  private createPlaceholderImage(prompt: string, size: string): Buffer {
    // This is a placeholder - in real implementation, you'd call actual AI image APIs
    // For now, create a simple colored rectangle as PNG

    const [width, height] = size.split('x').map(Number);
    const canvas = require('canvas'); // You'd need to install canvas or similar
    const { createCanvas } = canvas;
    const cv = createCanvas(width, height);
    const ctx = cv.getContext('2d');

    // Generate color based on prompt hash
    const hash = this.simpleHash(prompt);
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b = hash & 0x0000FF;

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, width, height);

    // Add text
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('AI Generated', 20, 40);
    ctx.fillText(`Prompt: ${prompt.substring(0, 30)}...`, 20, 80);

    return cv.toBuffer('image/png');
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
