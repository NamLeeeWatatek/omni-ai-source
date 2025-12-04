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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { KBDocumentsService } from '../services/kb-documents.service';
import { KBCrawlerService } from '../services/kb-crawler.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  CrawlWebsiteDto,
  CrawlSitemapDto,
} from '../dto/kb-document.dto';
import { sanitizeFilename } from '../utils/text-sanitizer';

@ApiTags('Knowledge Base - Documents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'knowledge-bases', version: '1' })
export class KBDocumentsController {
  constructor(
    private readonly documentsService: KBDocumentsService,
    private readonly crawlerService: KBCrawlerService,
  ) {}

  @Post('documents')
  @ApiOperation({ summary: 'Create document' })
  async create(@Request() req, @Body() createDto: CreateDocumentDto) {
    const userId = req.user.id;
    return this.documentsService.create(userId, createDto);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get documents in knowledge base' })
  async getDocuments(
    @Param('id') id: string,
    @Request() req,
    @Query('folderId') folderId?: string,
  ) {
    const userId = req.user.id;
    return this.documentsService.findAll(id, userId, folderId);
  }

  @Get('documents/:documentId')
  @ApiOperation({ summary: 'Get document by ID' })
  async getDocument(@Param('documentId') documentId: string, @Request() req) {
    const userId = req.user.id;
    return this.documentsService.findOne(documentId, userId);
  }

  @Get('documents/:documentId/download')
  @ApiOperation({ summary: 'Download document file' })
  async downloadDocument(
    @Param('documentId') documentId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.documentsService.getDownloadUrl(documentId, userId);
  }

  @Patch('documents/:documentId')
  @ApiOperation({ summary: 'Update document' })
  async update(
    @Param('documentId') documentId: string,
    @Request() req,
    @Body() updateDto: UpdateDocumentDto,
  ) {
    const userId = req.user.id;
    return this.documentsService.update(documentId, userId, updateDto);
  }

  @Delete('documents/:documentId')
  @ApiOperation({ summary: 'Delete document' })
  async remove(@Param('documentId') documentId: string, @Request() req) {
    const userId = req.user.id;
    return this.documentsService.remove(documentId, userId);
  }

  @Patch('documents/:documentId/move')
  @ApiOperation({ summary: 'Move document to folder' })
  async moveDocument(
    @Param('documentId') documentId: string,
    @Request() req,
    @Body('folderId') folderId: string | null,
  ) {
    const userId = req.user.id;
    return this.documentsService.moveToFolder(documentId, userId, folderId);
  }

  @Post('documents/upload')
  @ApiOperation({ summary: 'Upload document file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Body('knowledgeBaseId') knowledgeBaseId: string,
    @Body('folderId') folderId?: string,
  ) {
    const userId = req.user.id;

    if (!file) {
      return { success: false, error: 'No file uploaded' };
    }

    const sanitizedFilename = sanitizeFilename(file.originalname);

    let fileUrl: string | null = null;
    let fileId: string | null = null;

    try {
      const uploadResult = await this.documentsService.uploadFileToStorage(
        file.buffer,
        sanitizedFilename,
        file.mimetype,
      );
      fileUrl = uploadResult.fileUrl;
      fileId = uploadResult.fileId;
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload file to storage: ${error.message}`,
      };
    }

    let content: string;
    try {
      content = await this.documentsService.extractTextFromFile(
        file.buffer,
        file.mimetype,
      );
    } catch (error) {
      return {
        success: false,
        error: `Failed to extract text: ${error.message}`,
      };
    }

    if (!content || content.length === 0) {
      return { success: false, error: 'File content is empty or invalid' };
    }

    return this.documentsService.create(userId, {
      knowledgeBaseId,
      folderId,
      name: sanitizedFilename,
      content,
      fileType: file.mimetype,
      mimeType: file.mimetype,
      fileUrl,
      metadata: {
        originalName: file.originalname,
        size: file.size,
        extractedLength: content.length,
        uploadedAt: new Date().toISOString(),
        fileId,
      },
    });
  }

  @Post('crawl/website')
  @ApiOperation({ summary: 'Crawl website and add to knowledge base' })
  async crawlWebsite(@Request() req, @Body() crawlDto: CrawlWebsiteDto) {
    const userId = req.user.id;
    const result = await this.crawlerService.crawlWebsite(
      crawlDto.url,
      crawlDto.knowledgeBaseId,
      userId,
      {
        maxPages: crawlDto.maxPages,
        maxDepth: crawlDto.maxDepth,
        followLinks: crawlDto.followLinks,
        includePatterns: crawlDto.includePatterns,
        excludePatterns: crawlDto.excludePatterns,
      },
    );

    return {
      success: true,
      ...result,
    };
  }

  @Post('crawl/sitemap')
  @ApiOperation({ summary: 'Crawl from sitemap.xml and add to knowledge base' })
  async crawlSitemap(@Request() req, @Body() crawlDto: CrawlSitemapDto) {
    const userId = req.user.id;
    const result = await this.crawlerService.crawlSitemap(
      crawlDto.sitemapUrl,
      crawlDto.knowledgeBaseId,
      userId,
      {
        maxPages: crawlDto.maxPages,
      },
    );

    return {
      success: true,
      ...result,
    };
  }
}
