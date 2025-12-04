import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelConnectionEntity } from '../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';
import { CreateConnectionDto } from '../integrations/dto/create-connection.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(ChannelConnectionEntity)
    private connectionRepository: Repository<ChannelConnectionEntity>,
  ) {}

  async findAll(userId?: string): Promise<ChannelConnectionEntity[]> {
    const where: any = {};
    if (userId) {
      where.workspaceId = userId;
    }
    return this.connectionRepository.find({
      where,
      relations: ['credential'],
      order: { connectedAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    workspaceId?: string,
  ): Promise<ChannelConnectionEntity | null> {
    const where: any = { id };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    return this.connectionRepository.findOne({
      where,
      relations: ['credential'],
    });
  }

  async findByExternalId(externalId: string): Promise<ChannelConnectionEntity | null> {
    const channels = await this.connectionRepository.find({
      where: { status: 'active' },
      relations: ['credential'],
    });
    
    return channels.find(channel => 
      channel.metadata?.pageId === externalId
    ) || null;
  }

  async findByType(
    type: string,
    workspaceId?: string,
  ): Promise<ChannelConnectionEntity | null> {
    const where: any = { type, status: 'active' };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    return this.connectionRepository.findOne({
      where,
      relations: ['credential'],
    });
  }

  async create(
    dto: CreateConnectionDto,
    userId?: string,
  ): Promise<ChannelConnectionEntity> {
    const connection = this.connectionRepository.create({
      ...dto,
      workspaceId: userId,
      status: 'active',
      connectedAt: new Date(),
    });
    return this.connectionRepository.save(connection);
  }

  async delete(id: string, userId?: string): Promise<void> {
    const where: any = { id };
    if (userId) {
      where.workspaceId = userId;
    }
    await this.connectionRepository.delete(where);
  }
}
