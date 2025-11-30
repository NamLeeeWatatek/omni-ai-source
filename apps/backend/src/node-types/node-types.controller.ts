import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { NodeTypesService } from './node-types.service';
import { NodeType, NodeCategory } from './domain/node-type';
import { NodeTypeEntity } from './infrastructure/persistence/relational/entities/node-type.entity';

@ApiTags('Node Types')
@Controller({ path: 'node-types', version: '1' })
export class NodeTypesController {
  constructor(private readonly nodeTypesService: NodeTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all node types' })
  @ApiQuery({ name: 'category', required: false })
  async findAll(@Query('category') category?: string): Promise<NodeType[]> {
    return this.nodeTypesService.findAll(category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all node categories' })
  async getCategories(): Promise<NodeCategory[]> {
    return this.nodeTypesService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get node type by ID' })
  async findOne(@Param('id') id: string): Promise<NodeType | null> {
    return this.nodeTypesService.findOne(id);
  }

  // Admin endpoints for managing node types
  @Post()
  @ApiOperation({ summary: 'Create new node type (Admin)' })
  @ApiBody({ type: NodeTypeEntity })
  async create(@Body() data: Partial<NodeTypeEntity>): Promise<NodeTypeEntity> {
    return this.nodeTypesService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update node type (Admin)' })
  @ApiBody({ type: NodeTypeEntity })
  async update(
    @Param('id') id: string,
    @Body() data: Partial<NodeTypeEntity>,
  ): Promise<NodeTypeEntity> {
    return this.nodeTypesService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete node type (Admin)' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.nodeTypesService.remove(id);
  }
}
