import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { KBManagementService } from './services/kb-management.service';
import { KBVectorService } from './services/kb-vector.service';
import { KBRagService } from './services/kb-rag.service';
import {
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
  AssignAgentDto,
} from './dto/kb-management.dto';

@ApiTags('Knowledge Base')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'knowledge-bases', version: '1' })
export class KnowledgeBaseController {
  constructor(
    private readonly kbService: KBManagementService,
    private readonly vectorService: KBVectorService,
    private readonly kbRagService: KBRagService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all knowledge bases' })
  async getAll(@Request() req, @Query('workspaceId') workspaceId?: string) {
    const userId = req.user.id;
    return this.kbService.findAll(userId, workspaceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create knowledge base' })
  async create(@Request() req, @Body() createDto: CreateKnowledgeBaseDto) {
    const userId = req.user.id;
    return this.kbService.create(userId, createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get knowledge base by ID' })
  async getOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.kbService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update knowledge base' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateKnowledgeBaseDto,
  ) {
    const userId = req.user.id;
    return this.kbService.update(id, userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete knowledge base' })
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.kbService.remove(id, userId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get knowledge base statistics' })
  async getStats(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.kbService.getStats(id, userId);
  }

  @Post(':id/agents')
  @ApiOperation({ summary: 'Assign agent to knowledge base' })
  async assignAgent(
    @Param('id') id: string,
    @Request() req,
    @Body() assignDto: AssignAgentDto,
  ) {
    const userId = req.user.id;
    return this.kbService.assignAgent(id, userId, assignDto);
  }

  @Delete(':id/agents/:agentId')
  @ApiOperation({ summary: 'Unassign agent from knowledge base' })
  async unassignAgent(
    @Param('id') id: string,
    @Param('agentId') agentId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.kbService.unassignAgent(id, userId, agentId);
  }

  @Get(':id/agents')
  @ApiOperation({ summary: 'Get agent assignments' })
  async getAgentAssignments(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.kbService.getAgentAssignments(id, userId);
  }

  @Get('vector/diagnostics')
  @ApiOperation({ summary: 'Get vector service diagnostics' })
  async getVectorDiagnostics() {
    return {
      isAvailable: this.vectorService.isServiceAvailable(),
      url: process.env.QDRANT_URL,
      hasApiKey: !!process.env.QDRANT_API_KEY,
      collectionName: 'knowledge-base',
    };
  }

  @Post('vector/test-connection')
  @ApiOperation({ summary: 'Test vector service connection' })
  async testVectorConnection() {
    try {
      const connected = await this.vectorService.testConnection();
      return {
        success: connected,
        message: connected
          ? 'Successfully connected to Qdrant'
          : 'Failed to connect to Qdrant',
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  @Post('vector/ensure-collection')
  @ApiOperation({ summary: 'Ensure vector collection exists' })
  async ensureVectorCollection() {
    try {
      const success = await this.vectorService.ensureCollection();
      return {
        success,
        message: success
          ? 'Collection exists or was created successfully'
          : 'Failed to create or verify collection',
      };
    } catch (error) {
      return {
        success: false,
        message: `Collection creation failed: ${error.message}`,
      };
    }
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with knowledge base using RAG' })
  async chatWithKnowledgeBase(
    @Request() req,
    @Body() body: {
      message: string;
      botId?: string;
      knowledgeBaseIds?: string[];
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
      model?: string;
    },
  ) {
    const userId = req.user.id;

    try {
      const result = await this.kbRagService.chatWithBotAndRAG(
        body.message,
        body.botId,
        body.knowledgeBaseIds,
        body.conversationHistory,
        body.model,
      );

      return {
        answer: result.answer,
        sources: result.sources,
      };
    } catch (error) {
      console.error('Chat with knowledge base failed:', error);
      throw error;
    }
  }
}
