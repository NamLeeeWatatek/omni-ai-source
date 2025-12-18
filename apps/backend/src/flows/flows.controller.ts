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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FlowsService } from './flows.service';
import { ExecutionService } from './execution.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { CreateFlowFromTemplateDto } from './dto/create-flow-from-template.dto';
import { PublicFlowDto, DetailedFlowDto } from './dto/public-flow.dto';

@ApiTags('Flows')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'flows', version: '1' })
export class FlowsController {
  constructor(
    private readonly flowsService: FlowsService,
    private readonly executionService: ExecutionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create flow' })
  create(@Body() createDto: CreateFlowDto, @Request() req) {
    return this.flowsService.create(createDto, req.user.id);
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
  @ApiOperation({ summary: 'Get all flows' })
  @ApiResponse({ status: 200, type: [PublicFlowDto] })
  async findAll(@Request() req, @Query('published') published?: string) {
    const publishedBoolean =
      published === 'true' ? true : published === 'false' ? false : undefined;

    const flows = await this.flowsService.findAll(
      req.user.id,
      publishedBoolean,
    );

    // Interceptor will automatically transform to PublicFlowDto
    return flows;
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
  update(@Param('id') id: string, @Body() updateDto: UpdateFlowDto) {
    return this.flowsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete flow' })
  remove(@Param('id') id: string) {
    return this.flowsService.remove(id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute flow' })
  async execute(@Param('id') id: string, @Body() input?: any, @Request() req?: any) {
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

    // Get workspaceId from request (user's default workspace)
    const workspaceId = req?.user?.workspaceId || req?.user?.id;

    const executionId = await this.executionService.executeFlow(
      id,
      flowData,
      input,
      { workspaceId } // Pass workspaceId in metadata
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
  ) {
    return this.flowsService.createVersion(id, versionData);
  }

  @Post(':id/versions/:versionId/restore')
  @ApiOperation({ summary: 'Restore flow version' })
  restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.flowsService.restoreVersion(id, versionId);
  }

  @Post(':id/generate-form-schema')
  @ApiOperation({ summary: 'Auto-generate formSchema for flow (UGC Factory)' })
  generateFormSchema(@Param('id') id: string) {
    return this.flowsService.generateFormSchema(id);
  }
}
