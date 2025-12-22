import { Injectable } from '@nestjs/common';
import { TemplatesService } from '../../../../templates/templates.service';

@Injectable()
export class TemplatesSeedService {
  constructor(private readonly templatesService: TemplatesService) {}

  async run() {
    const templates = [
      {
        name: 'Social Media Post Template',
        description: 'A template for creating engaging social media posts with optimized prompts',
        prompt: 'Create an engaging social media post about [topic] that includes a compelling headline, engaging copy, relevant hashtags, and a call-to-action. Make it suitable for [platform] with a [tone] tone.',
        category: 'social-media',
        isActive: true,
      },
      {
        name: 'Image Generation Template',
        description: 'Template for generating creative images with detailed AI prompts',
        prompt: 'Generate a high-quality image of [subject] in [style] style, with [lighting] lighting, [colors] color scheme, and [additional details]. The image should be [resolution] resolution and suitable for [use case].',
        category: 'image-generation',
        isActive: true,
      },
      {
        name: 'Video Script Template',
        description: 'Template for creating video scripts and storyboards',
        prompt: 'Create a video script for a [duration]-minute video about [topic]. Include scene descriptions, dialogue, voiceover narration, background music suggestions, and visual effects. The script should follow a [structure] structure and target [audience].',
        category: 'video-editing',
        isActive: true,
      },
      {
        name: 'Marketing Email Template',
        description: 'Template for crafting effective marketing emails',
        prompt: 'Write a marketing email with subject line, compelling opening, main content about [product/service], benefits, social proof, call-to-action, and unsubscribe footer. The email should be [length] words long and use [tone] tone.',
        category: 'marketing',
        isActive: true,
      },
      {
        name: 'Blog Post Template',
        description: 'Template for writing SEO-optimized blog posts',
        prompt: 'Write a comprehensive blog post about [topic] that includes an engaging introduction, [number] main sections with subheadings, practical examples, conclusion with call-to-action, and SEO-optimized meta description. Target keyword: [keyword].',
        category: 'marketing',
        isActive: true,
      },
      {
        name: 'Product Description Template',
        description: 'Template for writing compelling product descriptions',
        prompt: 'Create a product description for [product name] that highlights key features, benefits, specifications, use cases, and includes a strong call-to-action. Write in [tone] tone and keep it [length] words long.',
        category: 'marketing',
        isActive: true,
      },
      {
        name: 'Text-to-Speech Script Template',
        description: 'Template for creating scripts optimized for text-to-speech conversion',
        prompt: 'Write a script for text-to-speech conversion about [topic]. Use natural language, include pauses for emphasis, vary sentence length, and ensure the content flows well when spoken. The script should be [duration] minutes long when spoken at normal pace.',
        category: 'text-to-speech',
        isActive: true,
      },
    ];

    for (const templateData of templates) {
      try {
        await this.templatesService.create(templateData);
        console.log(`Created template: ${templateData.name}`);
      } catch (error) {
        console.error(`Failed to create template ${templateData.name}:`, error);
      }
    }
  }
}
