import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@ApiTags('AI Conversations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'ai/conversations', version: '1' })
export class AiConversationsController {
  constructor(private readonly aiService: AiService) {}

  @Get()
  @ApiOperation({ summary: 'Get AI conversation history' })
  async getConversations(@Request() req) {
    const userId = req.user.id;
    
    // Return user's AI conversation history
    // For now, return empty array - implement storage later
    return {
      success: true,
      conversations: [],
      message: 'AI conversations feature coming soon',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new AI conversation' })
  async createConversation(@Request() req, @Body() body: { title?: string }) {
    const userId = req.user.id;
    
    return {
      success: true,
      conversation: {
        id: `conv-${Date.now()}`,
        title: body.title || 'New Conversation',
        userId,
        createdAt: new Date().toISOString(),
        messages: [],
      },
    };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send message to AI' })
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() body: { message: string },
    @Request() req,
  ) {
    const userId = req.user.id;

    // Use AI service to generate response
    const response = await this.aiService.chat(body.message);

    return {
      success: true,
      message: {
        id: `msg-${Date.now()}`,
        conversationId,
        role: 'assistant',
        content: response,
        createdAt: new Date().toISOString(),
      },
    };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  async getMessages(@Param('id') conversationId: string) {
    return {
      success: true,
      messages: [],
      message: 'Message history coming soon',
    };
  }
}
