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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BotsService } from './bots.service';
import { BotFunctionsService } from './bot-functions.service';
import { BotInteractionService } from './bot-interaction.service';
import { MessageBufferService } from './services/message-buffer.service';
import { CreateBotDto } from './dto/create-bot.dto';
import {
  UpdateBotDto,
  CreateFlowVersionDto,
  LinkKnowledgeBaseDto,
} from './dto/update-bot.dto';
import { CreateBotFunctionDto } from './dto/create-bot-function.dto';
import { UpdateBotFunctionDto } from './dto/update-bot-function.dto';
import { ExecuteBotFunctionDto } from './dto/execute-bot-function.dto';
import { Bot, FlowVersion, BotKnowledgeBase } from './domain/bot';
import {
  UpdateAppearanceDto,
  AppearanceResponseDto,
} from './dto/update-appearance.dto';

@ApiTags('Bots')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'bots', version: '1' })
export class BotsController {
  constructor(
    private readonly botsService: BotsService,
    private readonly botFunctionsService: BotFunctionsService,
    private readonly botInteractionService: BotInteractionService,
    private readonly messageBufferService: MessageBufferService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create bot' })
  @ApiCreatedResponse({ type: Bot })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateBotDto, @Request() req) {
    if (!createDto.workspaceId) {
      const userWorkspace = await this.botsService.ensureUserHasWorkspace(
        req.user.id,
      );
      createDto.workspaceId = userWorkspace.id;
    }
    return this.botsService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bots in workspace' })
  @ApiOkResponse({ type: [Bot] })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'active', 'paused', 'archived'],
  })
  findAll(
    @Query('workspaceId') workspaceId: string,
    @Query('status') status?: string,
  ) {
    return this.botsService.findAll(workspaceId, { status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bot by ID' })
  @ApiOkResponse({ type: Bot })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.botsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update bot' })
  @ApiOkResponse({ type: Bot })
  @ApiParam({ name: 'id', type: String })
  update(@Param('id') id: string, @Body() updateDto: UpdateBotDto) {
    return this.botsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bot (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.botsService.remove(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate bot' })
  @ApiOkResponse({ type: Bot })
  @ApiParam({ name: 'id', type: String })
  activate(@Param('id') id: string) {
    return this.botsService.activate(id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause bot' })
  @ApiOkResponse({ type: Bot })
  @ApiParam({ name: 'id', type: String })
  pause(@Param('id') id: string) {
    return this.botsService.pause(id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive bot' })
  @ApiOkResponse({ type: Bot })
  @ApiParam({ name: 'id', type: String })
  archive(@Param('id') id: string) {
    return this.botsService.archive(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate bot' })
  @ApiCreatedResponse({ type: Bot })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.CREATED)
  duplicate(
    @Param('id') id: string,
    @Body() body: { name?: string },
    @Request() req,
  ) {
    return this.botsService.duplicate(id, req.user.id, body.name);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create flow version' })
  @ApiCreatedResponse({ type: FlowVersion })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.CREATED)
  createVersion(
    @Param('id') id: string,
    @Body() dto: CreateFlowVersionDto,
    @Request() req,
  ) {
    return this.botsService.createFlowVersion(id, dto, req.user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all flow versions' })
  @ApiOkResponse({ type: [FlowVersion] })
  @ApiParam({ name: 'id', type: String })
  getVersions(@Param('id') id: string) {
    return this.botsService.getFlowVersions(id);
  }

  @Get(':id/versions/published')
  @ApiOperation({ summary: 'Get published flow version' })
  @ApiOkResponse({ type: FlowVersion })
  @ApiParam({ name: 'id', type: String })
  getPublishedVersion(@Param('id') id: string) {
    return this.botsService.getPublishedVersion(id);
  }

  @Get(':id/versions/:versionId')
  @ApiOperation({ summary: 'Get flow version by ID' })
  @ApiOkResponse({ type: FlowVersion })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'versionId', type: String })
  getVersion(@Param('id') id: string, @Param('versionId') versionId: string) {
    return this.botsService.getFlowVersion(id, versionId);
  }

  @Patch(':id/versions/:versionId')
  @ApiOperation({ summary: 'Update flow version' })
  @ApiOkResponse({ type: FlowVersion })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'versionId', type: String })
  updateVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() dto: CreateFlowVersionDto,
  ) {
    return this.botsService.updateFlowVersion(id, versionId, dto);
  }

  @Post(':id/versions/:versionId/publish')
  @ApiOperation({ summary: 'Publish flow version' })
  @ApiOkResponse({ type: FlowVersion })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'versionId', type: String })
  publishVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.botsService.publishFlowVersion(id, versionId);
  }

  @Post(':id/knowledge-bases')
  @ApiOperation({ summary: 'Link knowledge base to bot' })
  @ApiCreatedResponse({ type: BotKnowledgeBase })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.CREATED)
  linkKnowledgeBase(
    @Param('id') id: string,
    @Body() dto: LinkKnowledgeBaseDto,
  ) {
    return this.botsService.linkKnowledgeBase(id, dto);
  }

  @Get(':id/knowledge-bases')
  @ApiOperation({ summary: 'Get linked knowledge bases' })
  @ApiOkResponse({ type: [BotKnowledgeBase] })
  @ApiParam({ name: 'id', type: String })
  getKnowledgeBases(@Param('id') id: string) {
    return this.botsService.getLinkedKnowledgeBases(id);
  }

  @Delete(':id/knowledge-bases/:kbId')
  @ApiOperation({ summary: 'Unlink knowledge base from bot' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'kbId', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  unlinkKnowledgeBase(@Param('id') id: string, @Param('kbId') kbId: string) {
    return this.botsService.unlinkKnowledgeBase(id, kbId);
  }

  @Patch(':id/knowledge-bases/:kbId/toggle')
  @ApiOperation({ summary: 'Toggle knowledge base active status' })
  @ApiOkResponse({ type: BotKnowledgeBase })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'kbId', type: String })
  toggleKnowledgeBase(
    @Param('id') id: string,
    @Param('kbId') kbId: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.botsService.toggleKnowledgeBase(id, kbId, body.isActive);
  }

  @Post(':id/functions')
  @ApiOperation({ summary: 'Create bot function' })
  createFunction(@Body() createDto: CreateBotFunctionDto) {
    return this.botFunctionsService.create(createDto);
  }

  @Get(':id/functions')
  @ApiOperation({ summary: 'Get all bot functions' })
  findAllFunctions(@Param('id') botId: string) {
    return this.botFunctionsService.findAll(botId);
  }

  @Get('functions/:functionId')
  @ApiOperation({ summary: 'Get bot function by ID' })
  findOneFunction(@Param('functionId') functionId: string) {
    return this.botFunctionsService.findOne(functionId);
  }

  @Patch('functions/:functionId')
  @ApiOperation({ summary: 'Update bot function' })
  updateFunction(
    @Param('functionId') functionId: string,
    @Body() updateDto: UpdateBotFunctionDto,
  ) {
    return this.botFunctionsService.update(functionId, updateDto);
  }

  @Delete('functions/:functionId')
  @ApiOperation({ summary: 'Delete bot function' })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFunction(@Param('functionId') functionId: string) {
    return this.botFunctionsService.remove(functionId);
  }

  @Post('functions/execute')
  @ApiOperation({ summary: 'Execute bot function' })
  executeFunction(@Body() executeDto: ExecuteBotFunctionDto) {
    return this.botFunctionsService.execute(executeDto);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get bot statistics' })
  @ApiParam({ name: 'id', type: String })
  getBotStats(@Param('id') id: string) {
    return this.botInteractionService.getBotStats(id);
  }

  @Get(':id/interaction-context')
  @ApiOperation({ summary: 'Get bot interaction context' })
  @ApiParam({ name: 'id', type: String })
  getBotInteractionContext(@Param('id') id: string) {
    return this.botInteractionService.getBotForInteraction(id);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate bot can interact' })
  @ApiParam({ name: 'id', type: String })
  validateBot(@Param('id') id: string) {
    return this.botInteractionService.validateBotInteraction(id);
  }

  @Get(':id/channels')
  @ApiOperation({ summary: 'Get bot channels' })
  @ApiParam({ name: 'id', type: String })
  getBotChannels(@Param('id') id: string) {
    return this.botsService.getBotChannels(id);
  }

  @Post(':id/channels')
  @ApiOperation({ summary: 'Create bot channel' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.CREATED)
  createBotChannel(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.botsService.createBotChannel(id, dto, req.user.id);
  }

  @Patch(':id/channels/:channelId')
  @ApiOperation({ summary: 'Update bot channel' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'channelId', type: String })
  updateBotChannel(
    @Param('id') id: string,
    @Param('channelId') channelId: string,
    @Body() dto: any,
  ) {
    return this.botsService.updateBotChannel(id, channelId, dto);
  }

  @Delete(':id/channels/:channelId')
  @ApiOperation({ summary: 'Delete bot channel' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'channelId', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBotChannel(
    @Param('id') id: string,
    @Param('channelId') channelId: string,
  ) {
    return this.botsService.deleteBotChannel(id, channelId);
  }

  @Patch(':id/channels/:channelId/toggle')
  @ApiOperation({ summary: 'Toggle channel active status' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'channelId', type: String })
  toggleBotChannel(
    @Param('id') id: string,
    @Param('channelId') channelId: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.botsService.toggleBotChannel(id, channelId, body.isActive);
  }

  @Get(':id/widget/appearance')
  @ApiOperation({ summary: 'Get widget appearance settings' })
  @ApiOkResponse({ type: AppearanceResponseDto })
  @ApiParam({ name: 'id', type: String })
  getAppearance(@Param('id') id: string) {
    return this.botsService.getAppearance(id);
  }

  @Patch(':id/widget/appearance')
  @ApiOperation({ summary: 'Update widget appearance settings' })
  @ApiOkResponse({ description: 'Appearance updated successfully' })
  @ApiParam({ name: 'id', type: String })
  updateAppearance(
    @Param('id') id: string,
    @Body() dto: UpdateAppearanceDto,
    @Request() req,
  ) {
    return this.botsService.updateAppearance(id, dto, req.user.id);
  }

  @Get('debug/message-buffers')
  @ApiOperation({ summary: 'Get all message buffers (debug)' })
  @ApiOkResponse({ description: 'List of active message buffers' })
  getMessageBuffers() {
    return {
      buffers: this.messageBufferService.getBufferStats(),
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('debug/message-buffers/:conversationId/:botId')
  @ApiOperation({ summary: 'Clear message buffer (debug)' })
  @ApiParam({ name: 'conversationId', type: String })
  @ApiParam({ name: 'botId', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  clearMessageBuffer(
    @Param('conversationId') conversationId: string,
    @Param('botId') botId: string,
  ) {
    this.messageBufferService.clearBuffer(conversationId, botId);
    return { message: 'Buffer cleared' };
  }
}
