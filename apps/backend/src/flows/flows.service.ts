import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlowRepository } from './infrastructure/persistence/flow.repository';
import { FlowVersionEntity } from './infrastructure/persistence/relational/entities/flow-version.entity';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { CreateFlowFromTemplateDto } from './dto/create-flow-from-template.dto';
import { FormDiscoveryService } from './services/form-discovery.service';
import { FilterFlowDto, SortFlowDto } from './dto/query-flow.dto';
import {
  Flow,
  FlowCreateData,
  FlowStatus,
  FlowVisibility,
  FlowUpdateData,
} from './domain/flow';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';

@Injectable()
export class FlowsService {
  constructor(
    private readonly flowRepository: FlowRepository,
    @InjectRepository(FlowVersionEntity)
    private readonly versionRepository: Repository<FlowVersionEntity>,
    private readonly formDiscoveryService: FormDiscoveryService,
  ) { }

  async create(createDto: CreateFlowDto, ownerId: string): Promise<Flow> {
    const flowData: FlowCreateData = {
      name: createDto.name,
      description: createDto.description,
      status: (createDto.status as FlowStatus) || 'draft',
      nodes: createDto.nodes || createDto.data?.nodes || [],
      edges: createDto.edges || createDto.data?.edges || [],
      workspaceId: createDto.workspaceId!,
      ownerId,
      visibility: (createDto.visibility as FlowVisibility) || 'private',
      tags: createDto.tags,
      category: createDto.category,
      teamId: createDto.teamId,
    };

    return this.flowRepository.create(flowData as any);
  }

  async findAll(ownerId?: string, published?: boolean, workspaceId?: string): Promise<Flow[]> {
    return this.flowRepository.findAllComplex({
      ownerId,
      published,
      workspaceId,
    });
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterFlowDto | null;
    sortOptions?: SortFlowDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<{
    data: Flow[];
    hasNextPage: boolean;
    total: number;
  }> {
    return this.flowRepository.findAllPaginated({
      workspaceId: filterOptions?.workspaceId,
      ownerId: filterOptions?.ownerId,
      published: filterOptions?.published,
      search: filterOptions?.search,
      status: filterOptions?.status,
      category: filterOptions?.category,
      page: paginationOptions.page,
      limit: paginationOptions.limit,
      sort: sortOptions || undefined,
    });
  }

  async findAllPaginated(
    ownerId?: string,
    published?: boolean,
    page?: number,
    limit?: number,
    search?: string,
    status?: string,
    sort?: string,
  ): Promise<{
    data: Flow[];
    hasNextPage: boolean;
    total: number;
  }> {
    // Parse sort parameter if provided
    let sortOptions;
    if (sort) {
      const [orderBy, order] = sort.split(':');
      sortOptions = [
        {
          orderBy: orderBy || 'createdAt',
          order: (order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC',
        },
      ];
    }

    return this.flowRepository.findAllPaginated({
      ownerId,
      published,
      page,
      limit,
      search,
      status,
      sort: sortOptions,
    });
  }

  async findOne(id: string): Promise<Flow> {
    const flow = await this.flowRepository.findById(id);

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    return flow;
  }

  async update(id: string, updateDto: UpdateFlowDto, ownerId: string): Promise<Flow | null> {
    const flow = await this.findOne(id);
    if (flow.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to update this flow');
    }

    const updateData: FlowUpdateData = {};

    // Handle nodes and edges directly (primary way)
    if (updateDto.nodes !== undefined) {
      updateData.nodes = updateDto.nodes;
    }
    if (updateDto.edges !== undefined) {
      updateData.edges = updateDto.edges;
    }

    // Handle data migration: if data is provided, extract nodes and edges (fallback)
    if (updateDto.data) {
      const data = updateDto.data as any;
      if (data.nodes && updateData.nodes === undefined) {
        updateData.nodes = data.nodes;
      }
      if (data.edges && updateData.edges === undefined) {
        updateData.edges = data.edges;
      }
    }

    // Add other fields
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;
    if (updateDto.status !== undefined)
      updateData.status = updateDto.status as FlowStatus;
    if (updateDto.version !== undefined) updateData.version = updateDto.version;
    if (updateDto.visibility !== undefined)
      updateData.visibility = updateDto.visibility as FlowVisibility;
    if (updateDto.tags !== undefined) updateData.tags = updateDto.tags;
    if (updateDto.category !== undefined)
      updateData.category = updateDto.category;
    if (updateDto.teamId !== undefined) updateData.teamId = updateDto.teamId;

    // 🔄 Discover and update inputs
    if (updateDto.data || updateDto.nodes) {
      const nodes = updateData.nodes || flow.nodes;
      const discoveredInputs = this.formDiscoveryService.discoverInputs({
        nodes: nodes,
      });
      updateData.inputs = discoveredInputs;
    }

    return this.flowRepository.update(id, updateData);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const flow = await this.findOne(id);
    if (flow.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to delete this flow');
    }
    await this.flowRepository.remove(id);
  }

  async createFromTemplate(
    dto: CreateFlowFromTemplateDto,
    ownerId: string,
  ): Promise<Flow> {
    // Find source flow (any published flow can be used as template)
    const sourceFlow = await this.findOne(dto.templateId);

    const flowData: FlowCreateData = {
      name: dto.name,
      description: dto.description || sourceFlow.description,
      status: 'draft',
      nodes: sourceFlow.nodes || [],
      edges: sourceFlow.edges || [],
      workspaceId: sourceFlow.workspaceId,
      ownerId,
      visibility: 'private',
    };

    return this.flowRepository.create(flowData as any);
  }

  async getVersions(flowId: string) {
    return this.versionRepository.find({
      where: { flowId },
      order: { createdAt: 'DESC' },
    });
  }

  async createVersion(
    flowId: string,
    versionData: { name: string; description?: string },
    ownerId: string,
  ) {
    const flow = await this.findOne(flowId);
    if (flow.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to create a version for this flow');
    }

    const versionCount = await this.versionRepository.count({
      where: { flowId },
    });

    const newVersionNumber = versionCount + 1;

    const flowData = {
      nodes: flow.nodes || [],
      edges: flow.edges || [],
    };

    const version = this.versionRepository.create({
      flowId,
      name: versionData.name,
      description: versionData.description,
      data: flowData,
      flow: flowData,
      version: newVersionNumber,
    });

    return this.versionRepository.save(version);
  }

  async restoreVersion(flowId: string, versionId: string, ownerId: string) {
    const flow = await this.findOne(flowId);
    if (flow.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to restore this flow');
    }

    const version = await this.versionRepository.findOne({
      where: { id: versionId, flowId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    // Restore nodes and edges from version data
    const versionData = version.data as any;
    await this.update(flowId, {
      nodes: versionData.nodes || [],
      edges: versionData.edges || [],
    }, ownerId);

    return { success: true, message: 'Version restored successfully' };
  }

  async getInputs(flowId: string) {
    const flow = await this.findOne(flowId);
    return flow.inputs || [];
  }

  async generateFormSchema(flowId: string, ownerId: string) {
    const flow = await this.findOne(flowId);
    if (flow.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to generate schema for this flow');
    }
    const { generateFormSchemaFromNodes } = await import(
      './utils/form-schema-generator'
    );
    const schema = generateFormSchemaFromNodes(flow.nodes || []);

    if (schema && schema.steps) {
      // Extract all fields from all steps
      const allFields = schema.steps.flatMap((step) => step.fields || []);
      await this.update(flowId, { inputs: allFields } as any, ownerId);
    }

    return schema;
  }

  async getStats(workspaceId: string) {
    const total = await this.flowRepository.count({ workspaceId });
    const published = await this.flowRepository.count({
      workspaceId,
      status: 'published',
    });
    const draft = await this.flowRepository.count({
      workspaceId,
      status: 'draft',
    });

    return {
      total,
      published,
      draft,
      active: published, // Alias
      successRate: 100, // Placeholder
      avgDuration: 0, // Placeholder
    };
  }

  async duplicate(id: string, ownerId: string): Promise<Flow> {
    const original = await this.findOne(id);
    const flowData: FlowCreateData = {
      name: `${original.name} (Copy)`,
      description: original.description,
      status: 'draft',
      nodes: original.nodes || [],
      edges: original.edges || [],
      workspaceId: original.workspaceId,
      ownerId,
      visibility: 'private',
      tags: original.tags,
      category: original.category,
      icon: original.icon,
      teamId: original.teamId,
    };

    return this.flowRepository.create(flowData);
  }

  // Note: UGC flows are now filtered client-side from all flows
}
