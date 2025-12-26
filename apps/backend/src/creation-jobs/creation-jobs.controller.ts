import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CreationJobsService } from './creation-jobs.service';
import { CreateCreationJobDto } from './dto/create-creation-jobs.dto';
import { UpdateCreationJobDto } from './dto/update-creation-jobs.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreationJob } from './domain/creation-jobs';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllCreationJobsDto } from './dto/find-all-creation-jobs.dto';

@ApiTags('Creation-jobs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'creation-jobs',
  version: '1',
})
export class CreationJobsController {
  constructor(private readonly service: CreationJobsService) { }

  @Post()
  @ApiCreatedResponse({
    type: CreationJob,
  })
  create(@Body() createDto: CreateCreationJobDto, @Req() request: Request) {
    const user = request.user as any;
    return this.service.create(createDto, user?.id, user?.workspaceId);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(CreationJob),
  })
  async findAll(
    @Query() query: FindAllCreationJobsDto,
    @Req() request: Request,
  ): Promise<InfinityPaginationResponseDto<CreationJob>> {
    const user = request.user as any;

    // Fallback: If no workspace selected in token, try to find default from DB or just pick first one (NOT RECOMMENDED for prod but good for dev fix)
    let workspaceId = user?.workspaceId;

    // TODO: This logic should ideally be in a Guard or Interceptor to populate default workspace
    if (!workspaceId) {
      // Log warning
      console.warn('findAll: No workspaceId in user token, using fallback logic might be needed or frontend needs to refresh token');

      // TEMPORARY FIX: For now, we will throw but with better message, OR you can inject WorkspacesService to find default.
      // But since we can't inject easily here without changing constructor...
      // Let's rely on the frontend sending the header OR the Previous logic was strict.

      // Actually, the error trace shows the JWT payload SHOULD have it if logged in correctly. 
      // If it's missing, it means the user session is old or created before workspace logic.

      throw new Error('Workspace not selected. Please logout and login again to refresh session.');
    }
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const result = await this.service.findAllWithPagination({
      paginationOptions: {
        page,
        limit,
      },
      workspaceId: user?.workspaceId,
    }); // Lint ID: 3419feac-083f-4bff-b254-829a33ebf6c0 (Fixes type mismatch)

    return infinityPagination(
      result.data,
      { page, limit },
      result.count
    );
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: CreationJob,
  })
  findById(@Param('id') id: string, @Req() request: Request) {
    const user = request.user as any;
    if (!user?.workspaceId) throw new Error('Workspace not selected');
    return this.service.findById(id, user.workspaceId);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: CreationJob,
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCreationJobDto,
    @Req() request: Request,
  ) {
    const user = request.user as any;
    if (!user?.workspaceId) throw new Error('Workspace not selected');
    return this.service.update(id, user.workspaceId, updateDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string, @Req() request: Request) {
    const user = request.user as any;
    if (!user?.workspaceId) throw new Error('Workspace not selected');
    return this.service.remove(id, user.workspaceId);
  }

  @Post('bulk-delete')
  @ApiOkResponse({
    description: 'Bulk delete creation jobs',
  })
  removeMany(@Body('ids') ids: string[], @Req() request: Request) {
    const user = request.user as any;
    if (!user?.workspaceId) throw new Error('Workspace not selected');
    return this.service.removeMany(ids, user.workspaceId);
  }
}
