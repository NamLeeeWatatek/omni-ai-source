import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCreationToolDto } from './dto/create-creation-tool.dto';
import { UpdateCreationToolDto } from './dto/update-creation-tool.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterCreationToolDto,
  SortCreationToolDto,
} from './dto/query-creation-tool.dto';
import { CreationToolRepository } from './infrastructure/persistence/creation-tool.repository';
import { CreationTool } from './domain/creation-tool';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class CreationToolsService {
  constructor(private readonly repository: CreationToolRepository) {}

  async create(createDto: CreateCreationToolDto): Promise<CreationTool> {
    return this.repository.create({
      name: createDto.name,
      slug: createDto.slug,
      description: createDto.description,
      icon: createDto.icon,
      coverImage: createDto.coverImage,
      category: createDto.category,
      formConfig: createDto.formConfig,
      executionFlow: createDto.executionFlow,
      isActive: createDto.isActive ?? true,
      workspaceId: createDto.workspaceId,
      sortOrder: createDto.sortOrder ?? 0,
    });
  }

  async findAll(filters?: {
    isActive?: boolean;
    workspaceId?: string;
  }): Promise<CreationTool[]> {
    return this.repository.findAll(filters);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterCreationToolDto | null;
    sortOptions?: SortCreationToolDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<CreationTool[]> {
    return this.repository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: CreationTool['id']): Promise<NullableType<CreationTool>> {
    return this.repository.findById(id);
  }

  async findBySlug(slug: string): Promise<NullableType<CreationTool>> {
    return this.repository.findBySlug(slug);
  }

  async findByWorkspace(workspaceId: string): Promise<CreationTool[]> {
    return this.repository.findByWorkspace(workspaceId);
  }

  async update(
    id: CreationTool['id'],
    updateDto: UpdateCreationToolDto,
  ): Promise<CreationTool> {
    const tool = await this.repository.update(id, updateDto);

    if (!tool) {
      throw new NotFoundException('Creation tool not found');
    }

    return tool;
  }

  async remove(id: CreationTool['id']): Promise<void> {
    await this.repository.remove(id);
  }

  async activate(id: CreationTool['id']): Promise<CreationTool> {
    const tool = await this.repository.update(id, { isActive: true });

    if (!tool) {
      throw new NotFoundException('Creation tool not found');
    }

    return tool;
  }

  async deactivate(id: CreationTool['id']): Promise<CreationTool> {
    const tool = await this.repository.update(id, { isActive: false });

    if (!tool) {
      throw new NotFoundException('Creation tool not found');
    }

    return tool;
  }
}
