import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { NullableType } from '../utils/types/nullable.type';
import { Template } from './domain/template';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'templates',
  version: '1',
})
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleEnum.admin, RoleEnum.user)
  create(@Body() createTemplateDto: CreateTemplateDto): Promise<Template> {
    return this.templatesService.create(createTemplateDto);
  }

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
        paginationOptions: {
          page,
          limit,
        },
        filterOptions: query.filters,
        sortOptions: query.sort,
      }),
      { page, limit },
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<NullableType<Template>> {
    return this.templatesService.findById(id);
  }

  // Get all templates associated with a specific creation tool
  @Get('by-tool/:creationToolId')
  @HttpCode(HttpStatus.OK)
  async findByCreationTool(
    @Param('creationToolId') creationToolId: string,
  ): Promise<Template[]> {
    return this.templatesService.findByCreationTool(creationToolId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleEnum.admin, RoleEnum.user)
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ): Promise<Template | null> {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleEnum.admin)
  remove(@Param('id') id: string): Promise<void> {
    return this.templatesService.remove(id);
  }

  @Patch('bulk/update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleEnum.admin)
  async bulkUpdate(
    @Body()
    bulkUpdateDto: import('./dto/bulk-operation-template.dto').BulkUpdateTemplateDto,
  ): Promise<void> {
    return this.templatesService.bulkUpdate(
      bulkUpdateDto.ids,
      bulkUpdateDto.data,
    );
  }

  @Post('bulk/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleEnum.admin)
  async bulkRemove(
    @Body()
    bulkDeleteDto: import('./dto/bulk-operation-template.dto').BulkDeleteTemplateDto,
  ): Promise<void> {
    return this.templatesService.bulkRemove(bulkDeleteDto.ids);
  }
}
