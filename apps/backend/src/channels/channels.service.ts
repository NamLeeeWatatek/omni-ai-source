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

  async update(
    id: string,
    dto: { botId?: string | null; name?: string; metadata?: any },
    userId?: string,
  ): Promise<ChannelConnectionEntity> {
    const where: any = { id };
    if (userId) {
      where.workspaceId = userId;
    }

    const connection = await this.connectionRepository.findOne({ where });
    if (!connection) {
      throw new Error('Channel connection not found');
    }

    // Update fields
    if (dto.botId !== undefined) {
      connection.botId = dto.botId;
    }
    if (dto.name !== undefined) {
      connection.name = dto.name;
    }
    if (dto.metadata !== undefined) {
      connection.metadata = { ...connection.metadata, ...dto.metadata };
    }

    return this.connectionRepository.save(connection);
  }

  async delete(id: string, userId?: string): Promise<void> {
    try {
      // ✅ FIX: Update conversations first to prevent orphaned references
      // Use snake_case column names as they appear in database
      const updateResult = await this.connectionRepository.manager.query(
        `UPDATE conversation SET channel_id = NULL, channel_type = 'internal' WHERE channel_id = $1`,
        [id],
      );

      console.log(`✅ Updated ${updateResult[1] || 0} conversations before deleting channel ${id}`);

      // Then delete the channel
      const where: any = { id };
      if (userId) {
        where.workspaceId = userId;
      }
      await this.connectionRepository.delete(where);

      console.log(`✅ Deleted channel ${id}`);
    } catch (error) {
      console.error(`❌ Error deleting channel ${id}:`, error);
      throw error;
    }
  }
}
