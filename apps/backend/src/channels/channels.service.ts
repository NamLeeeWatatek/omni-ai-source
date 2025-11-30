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
    ) { }

    async findAll(workspaceId?: number): Promise<ChannelConnectionEntity[]> {
        const where: any = {};
        if (workspaceId) {
            where.workspaceId = workspaceId;
        }
        return this.connectionRepository.find({
            where,
            relations: ['credential'],
        });
    }

    async findOne(
        id: number,
        workspaceId?: number,
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

    async findByType(
        type: string,
        workspaceId?: number,
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
        workspaceId?: number,
    ): Promise<ChannelConnectionEntity> {
        const connection = this.connectionRepository.create({
            ...dto,
            workspaceId,
        });
        return this.connectionRepository.save(connection);
    }

    async delete(id: number): Promise<void> {
        await this.connectionRepository.delete(id);
    }
}
