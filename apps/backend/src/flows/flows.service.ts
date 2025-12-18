import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlowRepository } from './infrastructure/persistence/flow.repository';
import { FlowVersionEntity } from './infrastructure/persistence/relational/entities/flow-version.entity';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { CreateFlowFromTemplateDto } from './dto/create-flow-from-template.dto';
import { generateFormSchemaFromNodes } from './utils/form-schema-generator';
import {
  Flow,
  FlowCreateData,
  FlowStatus,
  FlowVisibility,
  FlowUpdateData,
} from './domain/flow';

@Injectable()
export class FlowsService {
  constructor(
    private readonly flowRepository: FlowRepository,
    @InjectRepository(FlowVersionEntity)
    private readonly versionRepository: Repository<FlowVersionEntity>,
  ) {}

  async create(createDto: CreateFlowDto, ownerId: string): Promise<Flow> {
    const flowData: FlowCreateData = {
      name: createDto.name,
      description: createDto.description,
      status: (createDto.status as FlowStatus) || 'draft',
      nodes: createDto.nodes || createDto.data?.nodes || [],
      edges: createDto.edges || createDto.data?.edges || [],
      ownerId,
      visibility: (createDto.visibility as FlowVisibility) || 'private',
      tags: createDto.tags,
      category: createDto.category,
      teamId: createDto.teamId,
    };

    return this.flowRepository.create(flowData as any);
  }

  async findAll(ownerId?: string, published?: boolean): Promise<Flow[]> {
    return this.flowRepository.findAllComplex({
      ownerId,
      published,
    });
  }

  async findOne(id: string): Promise<Flow> {
    const flow = await this.flowRepository.findById(id);

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    return flow;
  }

  async update(id: string, updateDto: UpdateFlowDto): Promise<Flow | null> {
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

    // ðŸ”„ Sync published field with status
    if (updateDto.published === true && updateData.status !== 'published') {
      updateData.status = 'published';
    } else if (
      updateDto.published === false &&
      updateData.status === 'published'
    ) {
      updateData.status = 'draft';
    }

    return this.flowRepository.update(id, updateData);
  }

  async remove(id: string): Promise<void> {
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
  ) {
    const flow = await this.findOne(flowId);

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
      versionNumber: newVersionNumber,
      version: newVersionNumber,
    });

    return this.versionRepository.save(version);
  }

  async restoreVersion(flowId: string, versionId: string) {
    const version = await this.versionRepository.findOne({
      where: { id: versionId, flowId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    // Restore nodes and edges from version data
    const versionData = version.data as any;
    await this.flowRepository.update(flowId, {
      nodes: versionData.nodes || [],
      edges: versionData.edges || [],
    });

    return { success: true, message: 'Version restored successfully' };
  }

  async generateFormSchema(flowId: string) {
    const flow = await this.findOne(flowId);

    if (!flow.nodes || flow.nodes.length === 0) {
      throw new NotFoundException('Flow has no nodes to generate schema from');
    }

    // Auto-generate formSchema from nodes
    const formSchema = generateFormSchemaFromNodes(flow.nodes);

    if (!formSchema) {
      return {
        success: false,
        message: 'Could not auto-generate form schema for this flow type',
        suggestion: 'This flow type is not supported for UGC Factory UI',
      };
    }

    // Note: formSchema is removed from FlowEntity in new architecture
    // This method is deprecated - form config should come from NodeTypeEntity
    return {
      success: false,
      message: 'Form schema generation is deprecated',
      suggestion: 'Use NodeType properties for form configuration',
      formSchema,
    };
  }

  // Note: UGC flows are now filtered client-side from all flows
}
