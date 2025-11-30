import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelCredentialEntity } from './infrastructure/persistence/relational/entities/channel-credential.entity';
import { CreateCredentialDto } from './dto/create-credential.dto';

@Injectable()
export class IntegrationsService {
    constructor(
        @InjectRepository(ChannelCredentialEntity)
        private credentialRepository: Repository<ChannelCredentialEntity>,
    ) { }

    async findAll(workspaceId?: number): Promise<ChannelCredentialEntity[]> {
        const where: any = {};
        if (workspaceId) {
            where.workspaceId = workspaceId;
        }
        return this.credentialRepository.find({ where });
    }

    async findOne(
        provider: string,
        workspaceId?: number,
    ): Promise<ChannelCredentialEntity | null> {
        const where: any = { provider };
        if (workspaceId) {
            where.workspaceId = workspaceId;
        }
        return this.credentialRepository.findOne({ where });
    }

    async findById(id: number): Promise<ChannelCredentialEntity | null> {
        return this.credentialRepository.findOne({ where: { id } });
    }

    async create(
        dto: CreateCredentialDto,
        workspaceId?: number,
    ): Promise<ChannelCredentialEntity> {
        // Always create new config (allow multiple configs per provider)
        const credential = this.credentialRepository.create({
            ...dto,
            workspaceId,
        });
        return this.credentialRepository.save(credential);
    }

    async update(
        id: number,
        dto: Partial<CreateCredentialDto>,
    ): Promise<ChannelCredentialEntity> {
        const existing = await this.findById(id);
        if (!existing) {
            throw new Error('Config not found');
        }
        Object.assign(existing, dto);
        return this.credentialRepository.save(existing);
    }

    async delete(id: number): Promise<void> {
        await this.credentialRepository.delete(id);
    }
}
