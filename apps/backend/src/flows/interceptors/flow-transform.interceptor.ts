import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FlowTransformService } from '../services/flow-transform.service';

/**
 * Interceptor to automatically transform Flow entities to DTOs
 * Removes sensitive/unnecessary fields from responses
 */
@Injectable()
export class FlowTransformInterceptor implements NestInterceptor {
  constructor(private readonly transformService: FlowTransformService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      switchMap(async (data) => {
        if (!data) return data;

        // Handle array of flows (list view)
        if (Array.isArray(data)) {
          return Promise.all(
            data.map(async (flow) => {
              const request = context.switchToHttp().getRequest();
              const url = request.url || '';
              const isDetailView =
                url.includes('/flows/') && !url.includes('/flows?');
              return isDetailView
                ? await this.transformService.toDetailedDto(flow)
                : this.transformService.toPublicDto(flow);
            }),
          );
        }

        // Handle single flow (detail view)
        if (data.id && data.name) {
          const request = context.switchToHttp().getRequest();
          const url = request.url || '';

          // Detail view: /flows/:id (not /flows or /flows?... or /flows/ugc)
          const isDetailView =
            url.match(/\/flows\/[a-f0-9-]{36}$/i) !== null || // UUID pattern
            (url.includes('/flows/') &&
              !url.includes('/flows?') &&
              !url.includes('/flows/ugc') &&
              !url.includes('/flows/from-template'));

          console.log(
            '[FlowTransformInterceptor] URL:',
            url,
            'isDetailView:',
            isDetailView,
          );

          return isDetailView
            ? await this.transformService.toDetailedDto(data)
            : this.transformService.toPublicDto(data);
        }

        return data;
      }),
    );
  }
}
