import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  HttpStatus,
  HttpCode,
  SerializeOptions,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { FlowsService } from './flows.service';
import { ExecutionService } from './execution.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { CreateFlowFromTemplateDto } from './dto/create-flow-from-template.dto';
import { PublicFlowDto, DetailedFlowDto } from './dto/public-flow.dto';
import { QueryFlowDto } from './dto/query-flow.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from 'src/utils/dto/infinity-pagination-response.dto';
import { CurrentWorkspace } from 'src/workspaces/decorators/current-workspace.decorator';

@ApiTags('Flows')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'flows', version: '1' })
export class FlowsController {
  constructor(
    private readonly flowsService: FlowsService,
    private readonly executionService: ExecutionService,
  ) { }

  @Get('stats')
  @ApiOperation({ summary: 'Get workflow statistics' })
  getStats(@CurrentWorkspace() workspaceId: string) {
    return this.flowsService.getStats(workspaceId);
  }

  create(
    @Body() createDto: CreateFlowDto,
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.flowsService.create(
      { ...createDto, workspaceId: createDto.workspaceId || workspaceId },
      req.user.id,
    );
  }

  @Post('from-template')
  @ApiOperation({ summary: 'Create flow from template' })
  createFromTemplate(
    @Body() createDto: CreateFlowFromTemplateDto,
    @Request() req,
  ) {
    return this.flowsService.createFromTemplate(createDto, req.user.id);
  }

  @Get()
  @ApiOkResponse({ type: InfinityPaginationResponse(PublicFlowDto) })
  @ApiOperation({ summary: 'Get all flows with pagination' })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Request() req,
    @Query() query: QueryFlowDto,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<InfinityPaginationResponseDto<PublicFlowDto>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    // Extract filters and sort from query
    const filters = query?.filters || {};
    const sort = query?.sort || [];

    // Convert to individual parameters for service
    const search = filters.search;
    const status = filters.status;
    const published = filters.published;
    const category = filters.category;

    const result = await this.flowsService.findManyWithPagination({
      filterOptions: {
        workspaceId,
        search,
        status,
        published,
        category,
      },
      sortOptions: sort,
      paginationOptions: { page, limit },
    });

    // Transform Flow[] to PublicFlowDto[] to handle null values
    return {
      ...result,
      data: plainToInstance(PublicFlowDto, result.data),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get flow by ID' })
  @ApiResponse({ status: 200, type: DetailedFlowDto })
  findOne(@Param('id') id: string) {
    // Interceptor will automatically transform to DetailedFlowDto
    return this.flowsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update flow' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFlowDto,
    @Request() req,
  ) {
    return this.flowsService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete flow' })
  remove(@Param('id') id: string, @Request() req) {
    return this.flowsService.remove(id, req.user.id);
  }
  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate flow' })
  @HttpCode(HttpStatus.CREATED)
  duplicate(@Param('id') id: string, @Request() req) {
    return this.flowsService.duplicate(id, req.user.id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute flow' })
  async execute(
    @Param('id') id: string,
    @Body() input?: any,
    @Request() req?: any,
    @CurrentWorkspace() workspaceId?: string,
  ) {
    // Log for debugging invalid IDs
    console.log('Execute request for flow ID:', id, 'typeof:', typeof id);

    // Validate UUID format first to avoid invalid strings reaching the database
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException(`Invalid flow ID format: ${id}`);
    }

    const flow = await this.flowsService.findOne(id);
    const flowData = {
      nodes: flow.nodes || [],
      edges: flow.edges || [],
    };

    // Get workspaceId from request (CurrentWorkspace decorator or user's default)
    // If no workspace is available, pass null to allow execution without workspace isolation
    const activeWorkspaceId = workspaceId || req?.user?.workspaceId || null;

    const executionId = await this.executionService.executeFlow(
      id,
      flowData,
      input,
      { workspaceId: activeWorkspaceId }, // Pass workspaceId in metadata
    );
    return {
      executionId,
      flowId: id,
      status: 'running',
      startedAt: new Date(),
    };
  }

  @Get(':id/executions')
  @ApiOperation({ summary: 'Get flow executions' })
  getExecutions(@Param('id') id: string) {
    return this.executionService.getAllExecutions(id);
  }

  @Get('executions/:executionId')
  @ApiOperation({ summary: 'Get execution details' })
  getExecution(@Param('executionId') executionId: string) {
    return this.executionService.getExecution(executionId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get flow versions' })
  getVersions(@Param('id') id: string) {
    return this.flowsService.getVersions(id);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create flow version' })
  createVersion(
    @Param('id') id: string,
    @Body() versionData: { name: string; description?: string },
    @Request() req,
  ) {
    return this.flowsService.createVersion(id, versionData, req.user.id);
  }

  @Post(':id/versions/:versionId/restore')
  @ApiOperation({ summary: 'Restore flow version' })
  restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Request() req,
  ) {
    return this.flowsService.restoreVersion(id, versionId, req.user.id);
  }

  @Post(':id/generate-form-schema')
  @ApiOperation({ summary: 'Auto-generate formSchema for flow (UGC Factory)' })
  generateFormSchema(@Param('id') id: string, @Request() req) {
    return this.flowsService.generateFormSchema(id, req.user.id);
  }
}
