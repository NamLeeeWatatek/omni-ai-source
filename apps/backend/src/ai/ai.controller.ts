import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

class ChatDto {
  message: string;
  model?: string;
  conversation_history?: Array<{ role: string; content: string }>;
}

@ApiTags('AI')
@Controller({
  path: 'ai',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Get('models')
  @ApiOperation({ summary: 'Get supported AI models' })
  getModels() {
    const models = this.aiService.getModels();
    
    // Group models by provider
    const grouped = models.reduce((acc, model) => {
      const existing = acc.find(g => g.provider === model.provider);
      if (existing) {
        existing.models.push({
          model_name: model.id,
          display_name: model.name,
          api_key_configured: model.is_available,
          is_available: model.is_available,
          capabilities: ['chat', 'text-generation'],
          max_tokens: model.id.includes('gemini') ? 1000000 : 
                      model.id.includes('gpt-4') ? 128000 : 
                      model.id.includes('claude') ? 200000 : 4096,
        });
      } else {
        acc.push({
          provider: model.provider,
          models: [{
            model_name: model.id,
            display_name: model.name,
            api_key_configured: model.is_available,
            is_available: model.is_available,
            capabilities: ['chat', 'text-generation'],
            max_tokens: model.id.includes('gemini') ? 1000000 : 
                        model.id.includes('gpt-4') ? 128000 : 
                        model.id.includes('claude') ? 200000 : 4096,
          }],
        });
      }
      return acc;
    }, [] as any[]);
    
    return grouped;
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI' })
  async chat(@Body() chatDto: ChatDto) {
    const response = await this.aiService.chat(
      chatDto.message,
      chatDto.model || 'gemini-2.5-flash',
    );
    return { response };
  }
}
