import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BotsService } from '../bots.service';
import { CreateFlowVersionDto } from '../dto/update-bot.dto';
import { FlowVersion } from '../domain/bot';

@ApiTags('Bot Flows')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'bots/:id/flows', version: '1' })
export class BotFlowsController {
  constructor(private readonly botsService: BotsService) {}

  @Post('versions')
  @ApiOperation({ summary: 'Create flow version' })
  @ApiCreatedResponse({ type: FlowVersion })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @HttpCode(HttpStatus.CREATED)
  createVersion(
    @Param('id') id: string,
    @Body() dto: CreateFlowVersionDto,
    @Request() req,
  ) {
    return this.botsService.createFlowVersion(id, dto, req.user.id);
  }

  @Get('versions')
  @ApiOperation({ summary: 'Get all flow versions' })
  @ApiOkResponse({ type: [FlowVersion] })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  getVersions(@Param('id') id: string) {
    return this.botsService.getFlowVersions(id);
  }

  @Get('versions/published')
  @ApiOperation({ summary: 'Get published flow version' })
  @ApiOkResponse({ type: FlowVersion })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  getPublishedVersion(@Param('id') id: string) {
    return this.botsService.getPublishedVersion(id);
  }

  @Get('versions/:versionId')
  @ApiOperation({ summary: 'Get flow version by ID' })
  @ApiOkResponse({ type: FlowVersion })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'versionId', type: String, description: 'Version ID' })
  getVersion(@Param('id') id: string, @Param('versionId') versionId: string) {
    return this.botsService.getFlowVersion(id, versionId);
  }

  @Patch('versions/:versionId')
  @ApiOperation({ summary: 'Update flow version' })
  @ApiOkResponse({ type: FlowVersion })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'versionId', type: String, description: 'Version ID' })
  updateVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() dto: CreateFlowVersionDto,
  ) {
    return this.botsService.updateFlowVersion(id, versionId, dto);
  }

  @Post('versions/:versionId/publish')
  @ApiOperation({ summary: 'Publish flow version' })
  @ApiOkResponse({ type: FlowVersion })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'versionId', type: String, description: 'Version ID' })
  publishVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.botsService.publishFlowVersion(id, versionId);
  }
}
