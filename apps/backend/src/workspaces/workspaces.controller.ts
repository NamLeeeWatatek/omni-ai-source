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
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'workspaces', version: '1' })
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create workspace' })
  create(@Body() createDto: CreateWorkspaceDto, @Request() req) {
    return this.workspacesService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user workspaces' })
  findAll(@Request() req) {
    return this.workspacesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace' })
  update(@Param('id') id: string, @Body() updateDto: UpdateWorkspaceDto) {
    return this.workspacesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workspace' })
  remove(@Param('id') id: string) {
    return this.workspacesService.remove(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to workspace' })
  addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role?: string },
  ) {
    return this.workspacesService.addMember(id, body.userId, body.role);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from workspace' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.workspacesService.removeMember(id, userId);
  }
}
