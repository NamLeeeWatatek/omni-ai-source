import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlowEntity } from './infrastructure/persistence/relational/entities/flow.entity';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { CreateFlowFromTemplateDto } from './dto/create-flow-from-template.dto';
import { TemplatesService } from '../templates/templates.service';

@Injectable()
export class FlowsService {
  constructor(
    @InjectRepository(FlowEntity)
    private flowRepository: Repository<FlowEntity>,
    private templatesService: TemplatesService,
  ) {}

  async create(createDto: CreateFlowDto, ownerId: string) {
    const flow = this.flowRepository.create({
      ...createDto,
      ownerId,
      data: createDto.data || {},
    });
    return this.flowRepository.save(flow);
  }

  async findAll(ownerId?: string) {
    const query = this.flowRepository.createQueryBuilder('flow');

    if (ownerId) {
      query.where('flow.ownerId = :ownerId', { ownerId });
    }

    return query.getMany();
  }

  async findOne(id: string) {
    const flow = await this.flowRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    return flow;
  }

  async update(id: string, updateDto: UpdateFlowDto) {
    const flow = await this.findOne(id);
    Object.assign(flow, updateDto);
    return this.flowRepository.save(flow);
  }

  async remove(id: string) {
    const flow = await this.findOne(id);
    await this.flowRepository.remove(flow);
  }

  async createFromTemplate(dto: CreateFlowFromTemplateDto, ownerId: string) {
    const template = await this.templatesService.findOne(dto.templateId);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Increment template usage count
    await this.templatesService.useTemplate(dto.templateId);

    // Create flow from template
    const flow = this.flowRepository.create({
      name: dto.name,
      description: dto.description || template.description,
      ownerId,
      templateId: dto.templateId,
      data: {
        nodes: template.nodes,
        edges: template.edges,
      },
      status: 'draft',
    });

    return this.flowRepository.save(flow);
  }
}
