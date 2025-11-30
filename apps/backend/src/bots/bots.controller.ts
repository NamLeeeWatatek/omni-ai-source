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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BotsService } from './bots.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';

@ApiTags('Bots')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'bots', version: '1' })
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post()
  @ApiOperation({ summary: 'Create bot' })
  create(@Body() createDto: CreateBotDto) {
    return this.botsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bots' })
  @ApiQuery({ name: 'workspaceId', required: false })
  findAll(@Query('workspaceId') workspaceId?: string) {
    return this.botsService.findAll(workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bot by ID' })
  findOne(@Param('id') id: string) {
    return this.botsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update bot' })
  update(@Param('id') id: string, @Body() updateDto: UpdateBotDto) {
    return this.botsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bot' })
  remove(@Param('id') id: string) {
    return this.botsService.remove(id);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create flow version' })
  createVersion(
    @Param('id') id: string,
    @Body() body: { flow: Record<string, any> },
  ) {
    return this.botsService.createFlowVersion(id, body.flow);
  }

  @Post('versions/:versionId/publish')
  @ApiOperation({ summary: 'Publish flow version' })
  publishVersion(@Param('versionId') versionId: string) {
    return this.botsService.publishFlowVersion(versionId);
  }
}
