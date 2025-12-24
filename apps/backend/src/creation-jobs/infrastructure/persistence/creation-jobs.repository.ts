import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { CreationJob } from '../../domain/creation-jobs';

export abstract class CreationJobsRepository {
  abstract create(
    data: Omit<CreationJob, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<CreationJob>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<CreationJob[]>;

  abstract findById(id: CreationJob['id']): Promise<NullableType<CreationJob>>;

  abstract findByIds(ids: CreationJob['id'][]): Promise<CreationJob[]>;

  abstract update(
    id: CreationJob['id'],
    payload: DeepPartial<CreationJob>,
  ): Promise<CreationJob | null>;

  abstract remove(id: CreationJob['id']): Promise<void>;
}
