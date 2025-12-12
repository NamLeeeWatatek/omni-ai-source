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
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { NodeTypesService } from './node-types.service';
import { NodeCategory } from './types';
import { NodeType } from './domain/node-type';

@ApiTags('Node Types')
@Controller({ path: 'node-types', version: '1' })
export class NodeTypesController {
  constructor(private readonly nodeTypesService: NodeTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all node types' })
  async findAll(@Query('category') category?: string): Promise<NodeType[]> {
    return this.nodeTypesService.findAll(category as any);
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

  @Post()
  @ApiOperation({ summary: 'Create new node type (Admin)' })
  @ApiBody({ type: NodeType })
  async create(
    @Body() data: Omit<NodeType, 'createdAt' | 'updatedAt'>,
  ): Promise<NodeType> {
    return this.nodeTypesService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update node type (Admin)' })
  @ApiBody({ type: NodeType })
  async update(
    @Param('id') id: string,
    @Body() data: Partial<NodeType>,
  ): Promise<NodeType> {
    return this.nodeTypesService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete node type (Admin)' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.nodeTypesService.remove(id);
  }
}
