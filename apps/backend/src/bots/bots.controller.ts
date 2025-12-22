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
  SerializeOptions,
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
import { BotInteractionService } from './bot-interaction.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import { QueryBotDto } from './dto/query-bot.dto';
import { Bot } from './domain/bot';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiTags('Bots')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'bots', version: '1' })
export class BotsController {
  constructor(
    private readonly botsService: BotsService,
    private readonly botInteractionService: BotInteractionService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create bot' })
  @ApiCreatedResponse({ type: Bot })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateBotDto, @Request() req) {
    const workspaceId = createDto.workspaceId || req.user.workspaceId;
    return this.botsService.create({ ...createDto, workspaceId }, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bots with pagination' })
  @ApiOkResponse({ type: InfinityPaginationResponse(Bot) })
  @SerializeOptions({ groups: ['admin'] })
  async findAll(
    @Query() query: QueryBotDto,
    @Request() req,
  ): Promise<InfinityPaginationResponseDto<any>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    // Extract filters
    const filters = query?.filters;

    // Ensure workspaceId is provided from filters or use a default from request
    const workspaceId = filters?.workspaceId || req?.user?.workspaceId;

    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    // Ensure it's in filters for the service
    const filterOptions = {
      ...filters,
      workspaceId,
    };

    return infinityPagination(
      await this.botsService.findManyWithPagination({
        filterOptions,
        sortOptions: query?.sort || undefined,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
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
}
