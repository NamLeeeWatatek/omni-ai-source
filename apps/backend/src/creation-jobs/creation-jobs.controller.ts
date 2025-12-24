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
  constructor(private readonly service: CreationJobsService) {}

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
  ): Promise<InfinityPaginationResponseDto<CreationJob>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.service.findAllWithPagination({
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
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
  findById(@Param('id') id: string) {
    return this.service.findById(id);
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
  update(@Param('id') id: string, @Body() updateDto: UpdateCreationJobDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
