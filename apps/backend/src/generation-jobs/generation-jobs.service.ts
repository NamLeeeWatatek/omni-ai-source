import { Injectable, NotFoundException } from '@nestjs/common';
import { GenerationJobRepository } from './infrastructure/persistence/generation-job.repository';
import { GenerationJob } from './domain/generation-job';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NullableType } from '../utils/types/nullable.type';
import { DeepPartial } from '../utils/types/deep-partial.type';

@Injectable()
export class GenerationJobsService {
  constructor(
    private readonly generationJobRepository: GenerationJobRepository,
  ) {}

  async create(
    data: Omit<GenerationJob, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<GenerationJob> {
    return this.generationJobRepository.create(data);
  }

  async findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<GenerationJob[]> {
    return this.generationJobRepository.findManyWithPagination({
      workspaceId,
      paginationOptions,
    });
  }

  async findById(
    id: GenerationJob['id'],
  ): Promise<NullableType<GenerationJob>> {
    return this.generationJobRepository.findById(id);
  }

  async update(
    id: GenerationJob['id'],
    payload: DeepPartial<GenerationJob>,
  ): Promise<GenerationJob | null> {
    const job = await this.generationJobRepository.findById(id);
    if (!job) {
      throw new NotFoundException('Generation job not found');
    }
    return this.generationJobRepository.update(id, payload);
  }

  async remove(id: GenerationJob['id']): Promise<void> {
    await this.generationJobRepository.remove(id);
  }
}
