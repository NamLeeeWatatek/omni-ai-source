import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DocumentApplicationService } from '../application/document.service';
import { KnowledgeBaseApplicationService } from '../application/knowledge-base.service';
import { CreateKnowledgeBaseDto } from '../dto/kb-management.dto';

@ApiTags('Knowledge Base - Domain Architecture')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'knowledge-bases', version: '2' })
export class KBDomainController {
  constructor(
    private readonly documentService: DocumentApplicationService,
    private readonly kbService: KnowledgeBaseApplicationService,
  ) {}

  @Post('knowledge-bases')
  @ApiOperation({ summary: 'Create knowledge base (DDD)' })
  async createKnowledgeBase(@Body() dto: CreateKnowledgeBaseDto) {
    // TODO: Extract userId from JWT token
    const userId = 'temp-user-id'; // Placeholder

    const kb = await this.kbService.createKnowledgeBase(
      {
        name: dto.name,
        description: dto.description,
        // TODO: Add aiProviderId support in CreateKnowledgeBaseDto
        aiProviderId: undefined,
      },
      userId,
      undefined, // workspaceId - TODO: extract from JWT
    );

    return {
      success: true,
      data: kb,
    };
  }

  @Get('knowledge-bases')
  @ApiOperation({ summary: 'Get user knowledge bases (DDD)' })
  async getKnowledgeBases() {
    // TODO: Extract userId and workspaceId from JWT token
    const userId = 'temp-user-id'; // Placeholder

    const kbs = await this.kbService.getUserKnowledgeBases(userId);
    return {
      success: true,
      data: kbs,
    };
  }

  @Post('documents')
  @ApiOperation({ summary: 'Create document (DDD)' })
  async createDocument(
    @Body() dto: { knowledgeBaseId: string; folderId?: string },
  ) {
    // TODO: Extract userId from JWT token
    const userId = 'temp-user-id'; // Placeholder

    const doc = await this.documentService.createDocument(
      dto.knowledgeBaseId,
      userId,
      {
        name: 'Test Document', // TODO: Add proper DTO
        content: 'Test content', // TODO: Add proper DTO
        folderId: dto.folderId,
      },
    );

    return {
      success: true,
      data: doc,
    };
  }

  @Get(':kbId/documents')
  @ApiOperation({ summary: 'Get documents in knowledge base (DDD)' })
  async getDocuments(@Param('kbId') kbId: string) {
    // TODO: Extract userId from JWT token
    const userId = 'temp-user-id'; // Placeholder

    const docs = await this.documentService.getDocuments(kbId, userId);
    return {
      success: true,
      data: docs,
    };
  }
}
