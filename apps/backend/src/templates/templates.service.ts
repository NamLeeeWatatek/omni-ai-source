import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterTemplateDto, SortTemplateDto } from './dto/query-template.dto';
import { TemplateRepository } from './infrastructure/persistence/template.repository';
import { Template } from './domain/template';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly templatesRepository: TemplateRepository) {}

  async create(createTemplateDto: CreateTemplateDto, userId?: string): Promise<Template> {
    // Check for duplicate name within workspace (optional)
    if (createTemplateDto.workspaceId) {
      const existingTemplate = await this.templatesRepository.findByNameAndWorkspace(
        createTemplateDto.name,
        createTemplateDto.workspaceId,
      );
      if (existingTemplate) {
        throw new UnprocessableEntityException({
          status: 422,
          errors: {
            name: 'templateNameAlreadyExistsInWorkspace',
          },
        });
      }
    }

    return this.templatesRepository.create({
      name: createTemplateDto.name,
      description: createTemplateDto.description,
      prompt: createTemplateDto.prompt,
      mediaFiles: createTemplateDto.mediaFiles,
      styleConfig: createTemplateDto.styleConfig,
      category: createTemplateDto.category,
      isActive: createTemplateDto.isActive ?? true,
      createdBy: userId,
      workspaceId: createTemplateDto.workspaceId,
    });
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTemplateDto | null;
    sortOptions?: SortTemplateDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Template[]> {
    return this.templatesRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Template['id']): Promise<NullableType<Template>> {
    return this.templatesRepository.findById(id);
  }

  findByIds(ids: Template['id'][]): Promise<Template[]> {
    return this.templatesRepository.findByIds(ids);
  }

  findByWorkspace(workspaceId: string): Promise<Template[]> {
    return this.templatesRepository.findByWorkspace(workspaceId);
  }

  async update(
    id: Template['id'],
    updateTemplateDto: UpdateTemplateDto,
  ): Promise<Template | null> {
    // Check for duplicate name if name is being updated
    if (updateTemplateDto.name) {
      const currentTemplate = await this.templatesRepository.findById(id);
      if (currentTemplate && currentTemplate.workspaceId) {
        const existingTemplate = await this.templatesRepository.findByNameAndWorkspace(
          updateTemplateDto.name,
          currentTemplate.workspaceId,
        );
        if (existingTemplate && existingTemplate.id !== id) {
          throw new UnprocessableEntityException({
            status: 422,
            errors: {
              name: 'templateNameAlreadyExistsInWorkspace',
            },
          });
        }
      }
    }

    return this.templatesRepository.update(id, {
      name: updateTemplateDto.name,
      description: updateTemplateDto.description,
      prompt: updateTemplateDto.prompt,
      mediaFiles: updateTemplateDto.mediaFiles,
      styleConfig: updateTemplateDto.styleConfig,
      category: updateTemplateDto.category,
      isActive: updateTemplateDto.isActive,
      workspaceId: updateTemplateDto.workspaceId,
    });
  }

  async remove(id: Template['id']): Promise<void> {
    await this.templatesRepository.remove(id);
  }

  async deactivate(id: Template['id']): Promise<Template | null> {
    return this.templatesRepository.update(id, {
      isActive: false,
    });
  }

  async activate(id: Template['id']): Promise<Template | null> {
    return this.templatesRepository.update(id, {
      isActive: true,
    });
  }
}
