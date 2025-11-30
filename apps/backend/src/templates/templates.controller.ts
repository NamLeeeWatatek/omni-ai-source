import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { Template, TemplateCategory } from './domain/template';

@ApiTags('Templates')
@Controller({ path: 'templates', version: '1' })
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all workflow templates' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ): Promise<Template[]> {
    if (search) {
      return this.templatesService.search(search);
    }
    return this.templatesService.findAll(category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all template categories' })
  getCategories(): TemplateCategory[] {
    return this.templatesService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  async findOne(@Param('id') id: string): Promise<Template | null> {
    return this.templatesService.findOne(id);
  }
}
