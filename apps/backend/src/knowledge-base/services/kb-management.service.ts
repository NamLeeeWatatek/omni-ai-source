import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeBaseEntity } from '../infrastructure/persistence/relational/entities/knowledge-base.entity';
import {
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
  AssignAgentDto,
} from '../dto/kb-management.dto';
import { BotKnowledgeBaseEntity } from '../../bots/infrastructure/persistence/relational/entities/bot.entity';

@Injectable()
export class KBManagementService {
  constructor(
    @InjectRepository(KnowledgeBaseEntity)
    private readonly kbRepository: Repository<KnowledgeBaseEntity>,
    @InjectRepository(BotKnowledgeBaseEntity)
    private readonly agentKbRepository: Repository<BotKnowledgeBaseEntity>,
  ) {}

  async create(userId: string, createDto: CreateKnowledgeBaseDto) {
    const kb = this.kbRepository.create({
      createdBy: userId,
      workspaceId: createDto.workspaceId || null,
      ...createDto,
    });
    return this.kbRepository.save(kb);
  }

  async findAll(userId: string, workspaceId?: string) {
    const query = this.kbRepository
      .createQueryBuilder('kb')
      .leftJoinAndSelect('kb.folders', 'folders')
      .leftJoinAndSelect('kb.documents', 'documents')
      .orderBy('kb.updatedAt', 'DESC');

    if (workspaceId) {
      query.where(
        '(kb.workspaceId = :workspaceId OR (kb.workspaceId IS NULL AND kb.createdBy = :userId))',
        { workspaceId, userId },
      );
    } else {
      query.where('kb.createdBy = :userId', { userId });
    }

    const results = await query.getMany();
    console.log(
      `[KB Service] Found ${results.length} KBs for workspace: ${workspaceId}, user: ${userId}`,
    );
    return results;
  }

  async findOne(id: string, userId: string) {
    const kb = await this.kbRepository.findOne({
      where: { id },
      relations: ['folders', 'documents'],
    });

    if (!kb) {
      throw new NotFoundException('Knowledge Base not found');
    }

    return kb;
  }

  async update(id: string, userId: string, updateDto: UpdateKnowledgeBaseDto) {
    const kb = await this.findOne(id, userId);
    Object.assign(kb, updateDto);
    return this.kbRepository.save(kb);
  }

  async remove(id: string, userId: string) {
    const kb = await this.findOne(id, userId);
    await this.kbRepository.remove(kb);
    return { success: true };
  }

  async assignAgent(kbId: string, userId: string, assignDto: AssignAgentDto) {
    await this.findOne(kbId, userId);

    const existing = await this.agentKbRepository.findOne({
      where: {
        botId: assignDto.agentId,
        knowledgeBaseId: kbId,
      },
    });

    if (existing) {
      Object.assign(existing, {
        priority: assignDto.priority,
        ragSettings: assignDto.ragSettings,
      });
      return this.agentKbRepository.save(existing);
    }

    const mapping = this.agentKbRepository.create({
      knowledgeBaseId: kbId,
      botId: assignDto.agentId,
      priority: assignDto.priority ?? 1,
      ragSettings: assignDto.ragSettings,
      isActive: true,
    });

    return this.agentKbRepository.save(mapping);
  }

  async unassignAgent(kbId: string, userId: string, agentId: string) {
    await this.findOne(kbId, userId);

    const mapping = await this.agentKbRepository.findOne({
      where: {
        botId: agentId,
        knowledgeBaseId: kbId,
      },
    });

    if (!mapping) {
      throw new NotFoundException('Agent assignment not found');
    }

    await this.agentKbRepository.remove(mapping);
    return { success: true };
  }

  async getAgentAssignments(kbId: string, userId: string) {
    await this.findOne(kbId, userId);

    return this.agentKbRepository.find({
      where: { knowledgeBaseId: kbId },
      order: { priority: 'ASC' },
    });
  }

  async getStats(kbId: string, userId: string) {
    const kb = await this.findOne(kbId, userId);

    return {
      id: kb.id,
      name: kb.name,
      totalDocuments: kb.totalDocuments,
      totalSize: kb.totalSize,
      chunkSize: kb.chunkSize,
      chunkOverlap: kb.chunkOverlap,
      embeddingModel: kb.embeddingModel,
      createdAt: kb.createdAt,
      updatedAt: kb.updatedAt,
    };
  }
}
