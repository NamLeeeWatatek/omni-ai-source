import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BotEntity,
  FlowVersionEntity,
} from './infrastructure/persistence/relational/entities/bot.entity';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';

@Injectable()
export class BotsService {
  constructor(
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
    @InjectRepository(FlowVersionEntity)
    private flowVersionRepository: Repository<FlowVersionEntity>,
  ) {}

  async create(createDto: CreateBotDto) {
    const bot = this.botRepository.create(createDto);
    return this.botRepository.save(bot);
  }

  async findAll(workspaceId?: string) {
    const query = this.botRepository.createQueryBuilder('bot');

    if (workspaceId) {
      // Get bots for specific workspace + global bots (workspaceId is null)
      query.where('bot.workspaceId = :workspaceId OR bot.workspaceId IS NULL', {
        workspaceId,
      });
    }

    return query.getMany();
  }

  async findOne(id: string) {
    const bot = await this.botRepository.findOne({
      where: { id },
      relations: ['workspace', 'flowVersions'],
    });

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }

    return bot;
  }

  async update(id: string, updateDto: UpdateBotDto) {
    const bot = await this.findOne(id);
    Object.assign(bot, updateDto);
    return this.botRepository.save(bot);
  }

  async remove(id: string) {
    const bot = await this.findOne(id);
    await this.botRepository.remove(bot);
  }

  async createFlowVersion(botId: string, flow: Record<string, any>) {
    const bot = await this.findOne(botId);

    const latestVersion = await this.flowVersionRepository
      .createQueryBuilder('version')
      .where('version.botId = :botId', { botId })
      .orderBy('version.version', 'DESC')
      .getOne();

    const version = this.flowVersionRepository.create({
      botId,
      version: latestVersion ? latestVersion.version + 1 : 1,
      flow,
      isPublished: false,
    });

    return this.flowVersionRepository.save(version);
  }

  async publishFlowVersion(versionId: string) {
    const version = await this.flowVersionRepository.findOne({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Flow version not found');
    }

    // Unpublish other versions
    await this.flowVersionRepository.update(
      { botId: version.botId, isPublished: true },
      { isPublished: false },
    );

    version.isPublished = true;
    return this.flowVersionRepository.save(version);
  }
}
