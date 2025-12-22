import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkspaceEntity,
  WorkspaceMemberEntity,
} from './infrastructure/persistence/relational/entities/workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import {
  getWorkspaceRoleId,
  getWorkspaceRoleFromEntity,
} from './utils/workspace-role.helper';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private memberRepository: Repository<WorkspaceMemberEntity>,
  ) {}

  async create(createDto: CreateWorkspaceDto, ownerId: string) {
    const existing = await this.workspaceRepository.findOne({
      where: { slug: createDto.slug },
    });
    if (existing) {
      throw new ConflictException('Workspace slug already exists');
    }

    const workspace = this.workspaceRepository.create({
      name: createDto.name,
      slug: createDto.slug,
      ownerId,
    });

    const saved = await this.workspaceRepository.save(workspace);

    await this.memberRepository.save({
      workspaceId: saved.id,
      userId: ownerId,
      roleId: getWorkspaceRoleId('owner'),
    });

    return saved;
  }

  async findAll(userId: string) {
    return this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoin('workspace.members', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('workspace.deletedAt IS NULL')
      .orderBy('member.joinedAt', 'ASC')
      .getMany();
  }

  async getUserDefaultWorkspace(userId: string) {
    const membership = await this.memberRepository.findOne({
      where: { userId },
      relations: ['workspace'],
      order: { joinedAt: 'ASC' },
    });

    if (!membership?.workspace) {
      return this.createDefaultWorkspace(userId);
    }

    return membership.workspace;
  }

  async createDefaultWorkspace(userId: string, userName?: string) {
    const workspaceName = userName ? `${userName}'s Workspace` : 'My Workspace';
    const slug = `workspace-${userId.substring(0, 8)}-${Date.now()}`;

    const workspace = this.workspaceRepository.create({
      name: workspaceName,
      slug,
      ownerId: userId,
    });

    const saved = await this.workspaceRepository.save(workspace);

    await this.memberRepository.save({
      workspaceId: saved.id,
      userId,
      roleId: getWorkspaceRoleId('owner'),
    });

    return saved;
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

  async findBySlug(slug: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { slug },
      relations: ['owner', 'members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async update(id: string, updateDto: UpdateWorkspaceDto, userId?: string) {
    const workspace = await this.findOne(id);

    if (userId) {
      const member = await this.memberRepository.findOne({
        where: { workspaceId: id, userId },
        relations: ['role'],
      });
      const role = getWorkspaceRoleFromEntity(member?.role);
      if (!member || (role !== 'owner' && role !== 'admin')) {
        throw new ForbiddenException('Not authorized to update workspace');
      }
    }

    if (updateDto.slug && updateDto.slug !== workspace.slug) {
      const existing = await this.workspaceRepository.findOne({
        where: { slug: updateDto.slug },
      });
      if (existing) {
        throw new ConflictException('Workspace slug already exists');
      }
    }

    Object.assign(workspace, updateDto);
    return this.workspaceRepository.save(workspace);
  }

  async remove(id: string, userId?: string) {
    const workspace = await this.findOne(id);

    if (userId && workspace.ownerId !== userId) {
      throw new ForbiddenException('Only owner can delete workspace');
    }

    await this.workspaceRepository.softDelete(id);
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: 'admin' | 'member' = 'member',
  ) {
    const existing = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });
    if (existing) {
      throw new ConflictException('User is already a member');
    }

    const member = this.memberRepository.create({
      workspaceId,
      userId,
      roleId: getWorkspaceRoleId(role),
    });
    return this.memberRepository.save(member);
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: 'admin' | 'member',
  ) {
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
      relations: ['role'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const currentRole = getWorkspaceRoleFromEntity(member.role);
    if (currentRole === 'owner') {
      throw new ForbiddenException('Cannot change owner role');
    }

    member.roleId = getWorkspaceRoleId(role);
    return this.memberRepository.save(member);
  }

  async removeMember(workspaceId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
      relations: ['role'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const role = getWorkspaceRoleFromEntity(member.role);
    if (role === 'owner') {
      throw new ForbiddenException('Cannot remove workspace owner');
    }

    await this.memberRepository.delete({ workspaceId, userId });
  }

  async getMembers(workspaceId: string) {
    return this.memberRepository.find({
      where: { workspaceId },
      relations: ['user'],
    });
  }

  async getMemberRole(
    workspaceId: string,
    userId: string,
  ): Promise<'owner' | 'admin' | 'member' | null> {
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
      relations: ['role'],
    });
    return getWorkspaceRoleFromEntity(member?.role) ?? null;
  }

  async isWorkspaceMember(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });
    return !!member;
  }

  async transferOwnership(
    workspaceId: string,
    newOwnerId: string,
    currentOwnerId: string,
  ) {
    const workspace = await this.findOne(workspaceId);

    if (workspace.ownerId !== currentOwnerId) {
      throw new ForbiddenException('Only owner can transfer ownership');
    }

    workspace.ownerId = newOwnerId;
    await this.workspaceRepository.save(workspace);

    await this.memberRepository.update(
      { workspaceId, userId: currentOwnerId },
      { roleId: getWorkspaceRoleId('admin') },
    );
    await this.memberRepository.update(
      { workspaceId, userId: newOwnerId },
      { roleId: getWorkspaceRoleId('owner') },
    );

    return workspace;
  }
}
