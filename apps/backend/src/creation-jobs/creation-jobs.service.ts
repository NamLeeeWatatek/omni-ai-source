import { Injectable } from '@nestjs/common';
import { CreateCreationJobDto } from './dto/create-creation-jobs.dto';
import { UpdateCreationJobDto } from './dto/update-creation-jobs.dto';
import { CreationJobsRepository } from './infrastructure/persistence/creation-jobs.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { CreationJob, CreationJobStatus } from './domain/creation-jobs';
import { NullableType } from '../utils/types/nullable.type';

import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class CreationJobsService {
  constructor(
    private readonly creationJobsRepository: CreationJobsRepository,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(
    createDto: CreateCreationJobDto,
    userId?: string,
    workspaceId?: string,
  ): Promise<CreationJob> {
    const job = new CreationJob();
    job.status = CreationJobStatus.PENDING;
    job.creationToolId = createDto.creationToolId;
    job.inputData = createDto.inputData;
    job.outputData = null;
    job.progress = 0;
    job.createdBy = userId;
    job.workspaceId = workspaceId;

    const createdJob = await this.creationJobsRepository.create(job);

    // Notify user about job creation
    if (userId) {
      this.notificationsGateway.emitNewNotification({
        userId,
        workspaceId,
        type: 'job_created',
        title: 'Job Started',
        message: 'Your creation job has started',
        data: { jobId: createdJob.id },
      });
    }

    // Trigger async processing (Mocking the execution engine)
    this.processJob(createdJob.id, userId, workspaceId);

    return createdJob;
  }

  private async processJob(
    jobId: string,
    userId?: string,
    workspaceId?: string,
  ) {
    // Simulate processing steps
    const steps = 10;
    const interval = 800; // 800ms per step

    try {
      // Update to PROCESSING
      await this.update(jobId, {
        status: CreationJobStatus.PROCESSING,
        progress: 0,
      });

      for (let i = 1; i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, interval));

        const progress = i * 10;
        await this.update(jobId, {
          progress,
        });
      }

      // Complete
      await this.update(jobId, {
        status: CreationJobStatus.COMPLETED,
        progress: 100,
        outputData: {
          result: 'Generated content simulation',
          imageUrl: 'https://via.placeholder.com/1024',
        },
      });
    } catch (error) {
      console.error(`Job processing failed for ${jobId}`, error);
      await this.update(jobId, {
        status: CreationJobStatus.FAILED,
        error: error.message,
      });
    }
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.creationJobsRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: CreationJob['id']): Promise<NullableType<CreationJob>> {
    return this.creationJobsRepository.findById(id);
  }

  findByIds(ids: CreationJob['id'][]): Promise<CreationJob[]> {
    return this.creationJobsRepository.findByIds(ids);
  }

  async update(
    id: CreationJob['id'],
    updateDto: UpdateCreationJobDto,
  ): Promise<CreationJob | null> {
    const updatedJob = await this.creationJobsRepository.update(id, updateDto);

    if (updatedJob && updatedJob.createdBy) {
      // Emit socket event for real-time progress
      this.notificationsGateway.emitNewNotification({
        userId: updatedJob.createdBy,
        workspaceId: updatedJob.workspaceId,
        type: 'job_progress',
        title: 'Job Update',
        message: `Job is ${updatedJob.progress}% complete`,
        data: {
          jobId: updatedJob.id,
          status: updatedJob.status,
          progress: updatedJob.progress,
          outputData: updatedJob.outputData,
          error: updatedJob.error,
        },
      });
    }

    return updatedJob;
  }

  remove(id: CreationJob['id']): Promise<void> {
    return this.creationJobsRepository.remove(id);
  }
}
