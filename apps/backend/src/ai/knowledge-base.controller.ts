import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeDocumentEntity } from './infrastructure/persistence/relational/entities/knowledge-document.entity';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Knowledge Base')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'knowledge-base', version: '1' })
export class KnowledgeBaseController {
  constructor(
    private readonly knowledgeBaseService: KnowledgeBaseService,
    @InjectRepository(KnowledgeDocumentEntity)
    private readonly documentRepository: Repository<KnowledgeDocumentEntity>,
  ) { }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize knowledge base collection' })
  async initialize() {
    await this.knowledgeBaseService.initializeCollection();
    return { success: true, message: 'Collection initialized' };
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get all documents' })
  async getDocuments(@Query('botId') botId?: string) {
    const query = this.documentRepository.createQueryBuilder('doc');

    if (botId) {
      query.where('doc.botId = :botId', { botId });
    }

    const documents = await query.orderBy('doc.createdAt', 'DESC').getMany();

    return documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      source: doc.source,
      metadata: doc.metadata,
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
      embedding_status: doc.embeddingStatus,
    }));
  }

  @Post('documents')
  @ApiOperation({ summary: 'Add document to knowledge base' })
  async addDocument(
    @Body() body: { title: string; content: string; source?: string; botId?: string; metadata?: any },
  ) {
    // Save to database
    const document = this.documentRepository.create({
      title: body.title,
      content: body.content,
      source: body.source || 'manual',
      botId: body.botId || null,
      metadata: body.metadata || null,
      embeddingStatus: 'processing',
    });

    await this.documentRepository.save(document);

    // Add to Qdrant in background
    try {
      await this.knowledgeBaseService.addDocument(
        {
          id: document.id,
          content: body.content,
          metadata: { title: body.title, ...body.metadata },
        },
        body.botId,
      );

      // Update status to completed
      document.embeddingStatus = 'completed';
      await this.documentRepository.save(document);
    } catch (error) {
      // Update status to failed
      document.embeddingStatus = 'failed';
      document.embeddingError = error.message;
      await this.documentRepository.save(document);
    }

    return {
      success: true,
      documentId: document.id,
      message: 'Document added successfully',
    };
  }

  @Patch('documents/:id')
  @ApiOperation({ summary: 'Update document' })
  async updateDocument(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; source?: string; metadata?: any },
  ) {
    const document = await this.documentRepository.findOne({ where: { id } });

    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    // Update fields
    if (body.title) document.title = body.title;
    if (body.content) document.content = body.content;
    if (body.source) document.source = body.source;
    if (body.metadata) document.metadata = body.metadata;

    // If content changed, re-embed
    if (body.content) {
      document.embeddingStatus = 'processing';
      await this.documentRepository.save(document);

      try {
        await this.knowledgeBaseService.addDocument(
          {
            id: document.id,
            content: body.content,
            metadata: { title: document.title, ...document.metadata },
          },
          document.botId || undefined,
        );

        document.embeddingStatus = 'completed';
      } catch (error) {
        document.embeddingStatus = 'failed';
        document.embeddingError = error.message;
      }
    }

    await this.documentRepository.save(document);

    return {
      success: true,
      message: 'Document updated successfully',
    };
  }

  @Post('documents/batch')
  @ApiOperation({ summary: 'Add multiple documents' })
  async addDocuments(
    @Body() body: { documents: Array<{ content: string; metadata?: any }>; botId?: string },
  ) {
    const documentsWithIds = body.documents.map((doc) => ({
      id: uuidv4(),
      content: doc.content,
      metadata: doc.metadata,
    }));

    await this.knowledgeBaseService.addDocuments(
      documentsWithIds,
      body.botId,
    );

    return {
      success: true,
      count: documentsWithIds.length,
      message: 'Documents added successfully',
    };
  }

  @Post('documents/upload')
  @ApiOperation({ summary: 'Upload and process document file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('botId') botId?: string,
  ) {
    if (!file) {
      return { success: false, error: 'No file uploaded' };
    }

    // Parse file content
    const content = file.buffer.toString('utf-8');

    // Split into chunks (simple chunking by paragraphs)
    const chunks = content
      .split('\n\n')
      .filter((chunk) => chunk.trim().length > 0)
      .map((chunk) => ({
        id: uuidv4(),
        content: chunk.trim(),
        metadata: {
          filename: file.originalname,
          mimeType: file.mimetype,
        },
      }));

    await this.knowledgeBaseService.addDocuments(chunks, botId);

    return {
      success: true,
      filename: file.originalname,
      chunks: chunks.length,
      message: 'File processed and added to knowledge base',
    };
  }

  @Post('query')
  @ApiOperation({ summary: 'Query knowledge base' })
  async query(
    @Body() body: { query: string; botId?: string; limit?: number },
  ) {
    const results = await this.knowledgeBaseService.query(
      body.query,
      body.botId,
      body.limit || 5,
    );

    return {
      success: true,
      query: body.query,
      results,
    };
  }

  @Post('answer')
  @ApiOperation({ summary: 'Generate answer using RAG' })
  async generateAnswer(
    @Body() body: { question: string; botId?: string },
  ) {
    const answer = await this.knowledgeBaseService.generateAnswer(
      body.question,
      body.botId,
    );

    return {
      success: true,
      question: body.question,
      answer,
    };
  }

  @Get('documents/count')
  @ApiOperation({ summary: 'Get document count' })
  async getCount(@Query('botId') botId?: string) {
    const count = await this.knowledgeBaseService.getDocumentCount(botId);

    return {
      success: true,
      count,
      botId: botId || 'all',
    };
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Delete document' })
  async deleteDocument(@Param('id') id: string) {
    // Delete from database first
    await this.documentRepository.delete(id);

    // Try to delete from Qdrant (may fail if API key doesn't have delete permission)
    try {
      await this.knowledgeBaseService.deleteDocument(id);
    } catch (error) {
      // Log warning but don't fail the request
      // Document is already deleted from database
      if (error.status === 403) {
        this.knowledgeBaseService['logger'].warn(
          `Qdrant API key doesn't have delete permission. Document removed from database only.`
        );
      } else {
        throw error;
      }
    }

    return {
      success: true,
      message: 'Document deleted',
    };
  }

  @Delete('bots/:botId/documents')
  @ApiOperation({ summary: 'Delete all documents for a bot' })
  async deleteAllDocuments(@Param('botId') botId: string) {
    // Delete from database first
    await this.documentRepository.delete({ botId });

    // Try to delete from Qdrant (may fail if API key doesn't have delete permission)
    try {
      await this.knowledgeBaseService.deleteAllDocuments(botId);
    } catch (error) {
      // Log warning but don't fail the request
      if (error.status === 403) {
        this.knowledgeBaseService['logger'].warn(
          `Qdrant API key doesn't have delete permission. Documents removed from database only.`
        );
      } else {
        throw error;
      }
    }

    return {
      success: true,
      message: `All documents deleted for bot ${botId}`,
    };
  }
}
