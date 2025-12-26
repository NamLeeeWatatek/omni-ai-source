import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Post,
  Body,
} from '@nestjs/common';
import { CreateGenerationJobDto } from './dto/create-generation-job.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { GenerationJobsService } from './generation-jobs.service';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { Workspace } from '../workspaces/domain/workspace';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('GenerationJobs')
@Controller({
  path: 'generation-jobs',
  version: '1',
})
export class GenerationJobsController {
  constructor(private readonly generationJobsService: GenerationJobsService) { }

  @Roles(RoleEnum.user, RoleEnum.admin)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createGenerationJobDto: CreateGenerationJobDto,
    @CurrentWorkspace() workspace: Workspace,
  ) {
    const { params, ...rest } = createGenerationJobDto;

    return this.generationJobsService.create({
      ...rest,
      inputData: params,
      workspaceId: workspace.id,
      status: 'pending',
    });
  }

  @Roles(RoleEnum.user, RoleEnum.admin)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @CurrentWorkspace() workspace: Workspace,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.generationJobsService.findManyWithPagination({
        workspaceId: workspace.id,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @Roles(RoleEnum.user, RoleEnum.admin)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.generationJobsService.findById(id);
  }
}
