import { Flow, FlowCreateData, FlowUpdateData } from 'src/flows/domain/flow';
import { NullableType } from 'src/utils/types/nullable.type';
export abstract class FlowRepository {
  abstract create(data: FlowCreateData): Promise<Flow>;

  abstract findAll(options?: {
    workspaceId?: string;
    ownerId?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Flow[]>;

  abstract findPublished(options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Flow[]>;

  abstract findAllComplex(options: {
    workspaceId?: string;
    ownerId?: string;
    status?: string;
    published?: boolean;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Flow[]>;

  abstract findAllPaginated(options: {
    workspaceId?: string;
    ownerId?: string;
    status?: string;
    published?: boolean;
    category?: string;
    limit?: number;
    offset?: number;
    page?: number;
    search?: string;
    sort?: { orderBy: string; order: 'ASC' | 'DESC' }[];
  }): Promise<{
    data: Flow[];
    hasNextPage: boolean;
    total: number;
  }>;

  abstract findById(id: Flow['id']): Promise<NullableType<Flow>>;

  abstract findByOwnerId(
    ownerId: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Flow[]>;

  abstract update(
    id: Flow['id'],
    payload: FlowUpdateData,
  ): Promise<Flow | null>;

  abstract remove(id: Flow['id']): Promise<void>;

  abstract count(options?: {
    workspaceId?: string;
    ownerId?: string;
    status?: string;
  }): Promise<number>;
}
