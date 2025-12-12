import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StatsService } from './stats.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { StatsQueryDto } from './dto/stats-query.dto';

@ApiTags('Stats')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'stats', version: '1' })
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Retrieve comprehensive statistics for the dashboard including users, bots, conversations, flows, and workspaces filtered by workspace',
  })
  @ApiOkResponse({
    type: DashboardStatsDto,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats(
    @Query() query: StatsQueryDto,
    @Request() req,
  ): Promise<DashboardStatsDto> {
    const workspaceId = req.user?.workspaceId || req.user?.id;
    return this.statsService.getDashboardStats(query, workspaceId);
  }
}
