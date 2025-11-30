import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkspaceEntity,
  WorkspaceMemberEntity,
} from './infrastructure/persistence/relational/entities/workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private memberRepository: Repository<WorkspaceMemberEntity>,
  ) {}

  async create(createDto: CreateWorkspaceDto, ownerId: string) {
    const workspace = this.workspaceRepository.create({
      ...createDto,
      ownerId,
    });

    const saved = await this.workspaceRepository.save(workspace);

    // Add owner as member
    await this.memberRepository.save({
      workspaceId: saved.id,
      userId: ownerId,
      role: 'owner',
    });

    return saved;
  }

  async findAll(userId: string) {
    return this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoin('workspace.members', 'member')
      .where('member.userId = :userId', { userId })
      .getMany();
  }

  async findOne(id: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
      relations: ['owner', 'members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async update(id: string, updateDto: UpdateWorkspaceDto) {
    const workspace = await this.findOne(id);
    Object.assign(workspace, updateDto);
    return this.workspaceRepository.save(workspace);
  }

  async remove(id: string) {
    const workspace = await this.findOne(id);
    await this.workspaceRepository.remove(workspace);
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: string = 'member',
  ) {
    const member = this.memberRepository.create({
      workspaceId,
      userId,
      role,
    });
    return this.memberRepository.save(member);
  }

  async removeMember(workspaceId: string, userId: string) {
    await this.memberRepository.delete({ workspaceId, userId });
  }
}
