import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { KBManagementService } from '../services/kb-management.service';
import {
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
  AssignAgentDto,
} from '../dto/kb-management.dto';

@ApiTags('Knowledge Base - Management')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'knowledge-bases', version: '1' })
export class KBManagementController {
  constructor(private readonly kbService: KBManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Get all knowledge bases' })
  async getAll(@Request() req, @Query('workspaceId') workspaceId?: string) {
    const userId = req.user.id;
    const result = await this.kbService.findAll(userId, workspaceId);
    return result;
  }

  @Post()
  @ApiOperation({ summary: 'Create knowledge base' })
  async create(@Request() req, @Body() createDto: CreateKnowledgeBaseDto) {
    const userId = req.user.id;
    return this.kbService.create(userId, createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get knowledge base by ID' })
  async getOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.kbService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update knowledge base' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateKnowledgeBaseDto,
  ) {
    const userId = req.user.id;
    return this.kbService.update(id, userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete knowledge base' })
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.kbService.remove(id, userId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get knowledge base statistics' })
  async getStats(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.kbService.getStats(id, userId);
  }

  @Post(':id/agents')
  @ApiOperation({ summary: 'Assign agent to knowledge base' })
  async assignAgent(
    @Param('id') id: string,
    @Request() req,
    @Body() assignDto: AssignAgentDto,
  ) {
    const userId = req.user.id;
    return this.kbService.assignAgent(id, userId, assignDto);
  }

  @Delete(':id/agents/:agentId')
  @ApiOperation({ summary: 'Unassign agent from knowledge base' })
  async unassignAgent(
    @Param('id') id: string,
    @Param('agentId') agentId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.kbService.unassignAgent(id, userId, agentId);
  }

  @Get(':id/agents')
  @ApiOperation({ summary: 'Get agent assignments' })
  async getAgentAssignments(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.kbService.getAgentAssignments(id, userId);
  }
}
