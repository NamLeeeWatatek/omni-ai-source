import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FlowsService } from './flows.service';
import { ExecutionService } from './execution.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { CreateFlowFromTemplateDto } from './dto/create-flow-from-template.dto';

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
  findAll(@Request() req) {
    return this.flowsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get flow by ID' })
  findOne(@Param('id') id: string) {
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
  async execute(@Param('id') id: string, @Body() input?: any) {
    const flow = await this.flowsService.findOne(id);
    const executionId = await this.executionService.executeFlow(
      id,
      flow.data,
      input,
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
}
