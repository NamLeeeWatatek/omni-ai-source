import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  SerializeOptions,
} from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { QueryTemplateDto } from './dto/query-template.dto';
import { Template } from './domain/template';
import { TemplatesService } from './templates.service';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Templates')
@Controller({
  path: 'templates',
  version: '1',
})
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @ApiCreatedResponse({ type: Template })
  @ApiOperation({ summary: 'Create new template' })
  @SerializeOptions({ groups: ['admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTemplateDto: CreateTemplateDto): Promise<Template> {
    return this.templatesService.create(createTemplateDto);
  }

  @ApiOkResponse({ type: InfinityPaginationResponse(Template) })
  @ApiOperation({ summary: 'Get all templates with pagination' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryTemplateDto,
  ): Promise<InfinityPaginationResponseDto<Template>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.templatesService.findManyWithPagination({
        filterOptions: query?.filters,
        sortOptions: query?.sort,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }

  @ApiOkResponse({ type: Template })
  @ApiOperation({ summary: 'Get template by ID' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  findOne(@Param('id') id: Template['id']): Promise<NullableType<Template>> {
    return this.templatesService.findById(id);
  }

  @ApiOkResponse({ type: [Template] })
  @ApiOperation({ summary: 'Get templates by workspace ID' })
  @Get('workspace/:workspaceId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'workspaceId', type: String, required: true })
  findByWorkspace(@Param('workspaceId') workspaceId: string): Promise<Template[]> {
    return this.templatesService.findByWorkspace(workspaceId);
  }

  @ApiOkResponse({ type: Template })
  @ApiOperation({ summary: 'Update template' })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  update(
    @Param('id') id: Template['id'],
    @Body() updateTemplateDto: UpdateTemplateDto,
  ): Promise<Template | null> {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @ApiOperation({ summary: 'Delete template' })
  @Delete(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Template['id']): Promise<void> {
    return this.templatesService.remove(id);
  }

  @ApiOkResponse({ type: Template })
  @ApiOperation({ summary: 'Deactivate template' })
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  deactivate(@Param('id') id: Template['id']): Promise<Template | null> {
    return this.templatesService.deactivate(id);
  }

  @ApiOkResponse({ type: Template })
  @ApiOperation({ summary: 'Activate template' })
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  activate(@Param('id') id: Template['id']): Promise<Template | null> {
    return this.templatesService.activate(id);
  }
}
