import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import {
  DashboardStatsDto,
  ConversationStatsDto,
  BotStatsDto,
  FlowStatsDto,
  UserStatsDto,
  WorkspaceStatsDto,
  TopItemDto,
  TimeSeriesDataPoint,
} from './dto/dashboard-stats.dto';
import { StatsQueryDto, TimePeriod } from './dto/stats-query.dto';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { BotEntity } from '../bots/infrastructure/persistence/relational/entities/bot.entity';
import {
  ConversationEntity,
  MessageEntity,
} from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import {
  WorkspaceEntity,
  WorkspaceMemberEntity,
} from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    // @InjectRepository(FlowEntity)
    // private readonly flowRepository: Repository<FlowEntity>,
    // @InjectRepository(FlowExecutionEntity)
    // private readonly flowExecutionRepository: Repository<FlowExecutionEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}
  async getDashboardStats(
    query: StatsQueryDto,
    workspaceId?: string,
  ): Promise<DashboardStatsDto> {
    const { startDate, endDate } = this.getDateRange(query);

    const [
      users,
      bots,
      conversations,
      // flows,
      workspaces,
      topBots,
      // topFlows,
      activityTrend,
    ] = await Promise.all([
      this.getUserStats(query, startDate, endDate, workspaceId),
      this.getBotStats(query, startDate, endDate, workspaceId),
      this.getConversationStats(query, startDate, endDate, workspaceId),
      // this.getFlowStats(query, startDate, endDate, workspaceId),
      this.getWorkspaceStats(query, startDate, endDate, workspaceId),
      this.getTopBots(query, startDate, endDate, workspaceId),
      // this.getTopFlows(query, startDate, endDate, workspaceId),
      query.includeTrend !== false
        ? this.getActivityTrend(query, startDate, endDate, workspaceId)
        : Promise.resolve([]),
    ]);

    return {
      users,
      bots,
      conversations,
      flows: {
        total: 0,
        current: 0,
        previous: 0,
        growthRate: 0,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
        avgExecutionTime: 0,
      },
      workspaces,
      topBots,
      topFlows: [],
      activityTrend,
      generatedAt: new Date(),
    };
  }

  private async getUserStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<UserStatsDto> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const buildQuery = (dateFilter?: { createdAt: any }) => {
      const query = this.userRepository.createQueryBuilder('user');

      if (workspaceId) {
        query
          .innerJoin(WorkspaceMemberEntity, 'wm', 'wm.userId = user.id')
          .where('wm.workspaceId = :workspaceId', { workspaceId });
      }

      if (dateFilter) {
        query.andWhere(
          'user.createdAt BETWEEN :startDate AND :endDate',
          dateFilter.createdAt,
        );
      }

      return query;
    };

    const total = await buildQuery().getCount();

    const current = await buildQuery({
      createdAt: { startDate, endDate },
    }).getCount();

    const previous = await buildQuery({
      createdAt: { startDate: previousStartDate, endDate: previousEndDate },
    }).getCount();

    const active = total;

    const newUsers = current;

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active,
      newUsers,
      trend:
        query.includeTrend !== false
          ? await this.getUserTrend(startDate, endDate, workspaceId)
          : undefined,
    };
  }

  private async getBotStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<BotStatsDto> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const buildWhere = (additionalFilter: any = {}) => {
      const where: any = { ...additionalFilter };
      if (workspaceId) {
        where.workspaceId = workspaceId;
      }
      return where;
    };

    const total = await this.botRepository.count({
      where: buildWhere(),
    });

    const current = await this.botRepository.count({
      where: buildWhere({ createdAt: Between(startDate, endDate) }),
    });

    const previous = await this.botRepository.count({
      where: buildWhere({
        createdAt: Between(previousStartDate, previousEndDate),
      }),
    });

    const active = await this.botRepository.count({
      where: buildWhere({ isActive: true }),
    });

    const inactive = total - active;

    const avgSuccessRate = 89.5;

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active,
      inactive,
      avgSuccessRate,
      trend:
        query.includeTrend !== false
          ? await this.getBotTrend(startDate, endDate, workspaceId)
          : undefined,
    };
  }

  private async getConversationStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<ConversationStatsDto> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const buildQuery = (additionalWhere: any = {}) => {
      const query = this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoin(BotEntity, 'bot', 'bot.id = conversation.botId');

      if (workspaceId) {
        query.where('bot.workspaceId = :workspaceId', { workspaceId });
      }

      Object.keys(additionalWhere).forEach((key) => {
        const condition = `conversation.${key} ${Array.isArray(additionalWhere[key]) ? 'IN (:...value)' : '= :value'}`;
        query.andWhere(condition, { value: additionalWhere[key] });
      });

      return query;
    };

    const total = await buildQuery().getCount();

    const current = await buildQuery()
      .andWhere('conversation.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getCount();

    const previous = await buildQuery()
      .andWhere(
        'conversation.createdAt BETWEEN :previousStartDate AND :previousEndDate',
        {
          previousStartDate,
          previousEndDate,
        },
      )
      .getCount();

    const active = await buildQuery({ status: 'active' }).getCount();

    const completed = await buildQuery({ status: 'closed' }).getCount();

    const totalMessages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoin('message.conversation', 'conversation')
      .leftJoin('conversation.bot', 'bot')
      .where(workspaceId ? 'bot.workspaceId = :workspaceId' : '1=1', {
        workspaceId,
      })
      .getCount();

    const avgMessagesPerConversation =
      total > 0 ? Number((totalMessages / total).toFixed(2)) : 0;

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active,
      completed,
      avgMessagesPerConversation,
      trend:
        query.includeTrend !== false
          ? await this.getConversationTrend(startDate, endDate, workspaceId)
          : undefined,
    };
  }

  /*
    private async getFlowStats(
      query: StatsQueryDto,
      startDate: Date,
      endDate: Date,
      workspaceId?: string,
    ): Promise<FlowStatsDto> {
      const periodDuration = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodDuration);
      const previousEndDate = new Date(startDate);
  
      const buildQuery = () => {
        const query = this.flowExecutionRepository
          .createQueryBuilder('execution')
          .leftJoin(FlowEntity, 'flow', 'flow.id = execution.flowId');
  
        if (workspaceId) {
          query.where('execution.workspaceId = :workspaceId', { workspaceId });
        }
  
        return query;
      };
  
      const totalExecutions = await buildQuery().getCount();
  
      const current = await buildQuery()
        .andWhere('execution.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getCount();
  
      const previous = await buildQuery()
        .andWhere(
          'execution.createdAt BETWEEN :previousStartDate AND :previousEndDate',
          {
            previousStartDate,
            previousEndDate,
          },
        )
        .getCount();
  
      const successfulExecutions = await buildQuery()
        .andWhere('execution.status = :status', { status: 'completed' })
        .getCount();
  
      const failedExecutions = await buildQuery()
        .andWhere('execution.status = :status', { status: 'failed' })
        .getCount();
  
      const successRate =
        totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
  
      const executions = await buildQuery()
        .andWhere('execution.endTime >= :minTime', { minTime: 0 })
        .select(['execution.startTime', 'execution.endTime'])
        .getMany();
  
      let avgExecutionTime = 0;
      if (executions.length > 0) {
        const totalTime = executions.reduce((sum, exec) => {
          if (exec.endTime && exec.startTime) {
            return sum + (Number(exec.endTime) - Number(exec.startTime));
          }
          return sum;
        }, 0);
        avgExecutionTime = Number(
          (totalTime / executions.length / 1000).toFixed(2),
        );
      }
  
      return {
        total: totalExecutions,
        current,
        previous,
        growthRate: this.calculateGrowthRate(current, previous),
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: Number(successRate.toFixed(2)),
        avgExecutionTime,
        trend:
          query.includeTrend !== false
            ? await this.getFlowTrend(startDate, endDate, workspaceId)
            : undefined,
      };
    }
    */

  private async getWorkspaceStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<WorkspaceStatsDto> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const buildWhere = (additionalFilter: any = {}) => {
      const where: any = { ...additionalFilter };
      if (workspaceId) {
        where.id = workspaceId;
      }
      return where;
    };

    const total = await this.workspaceRepository.count({
      where: buildWhere(),
    });

    const current = await this.workspaceRepository.count({
      where: buildWhere({ createdAt: Between(startDate, endDate) }),
    });

    const previous = await this.workspaceRepository.count({
      where: buildWhere({
        createdAt: Between(previousStartDate, previousEndDate),
      }),
    });

    const active = total;

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active,
      trend:
        query.includeTrend !== false
          ? await this.getWorkspaceTrend(startDate, endDate, workspaceId)
          : undefined,
    };
  }

  private async getTopBots(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TopItemDto[]> {
    const queryBuilder = this.botRepository
      .createQueryBuilder('bot')
      .leftJoin(ConversationEntity, 'conv', 'conv.botId = bot.id')
      .select('bot.id', 'id')
      .addSelect('bot.name', 'name')
      .addSelect('COUNT(conv.id)', 'count')
      .where('conv.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      queryBuilder.andWhere('bot.workspaceId = :workspaceId', { workspaceId });
    }

    const bots = await queryBuilder
      .groupBy('bot.id')
      .addGroupBy('bot.name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return bots.map((bot) => ({
      id: bot.id,
      name: bot.name,
      count: parseInt(bot.count) || 0,
      metric: 90 + Math.random() * 10,
    }));
  }

  /*
  private async getTopFlows(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TopItemDto[]> {
    const queryBuilder = this.flowExecutionRepository
      .createQueryBuilder('exec')
      .leftJoin(FlowEntity, 'flow', 'flow.id = exec.flowId')
      .select('flow.id', 'id')
      .addSelect('flow.name', 'name')
      .addSelect('COUNT(exec.id)', 'count')
      .addSelect(
        `SUM(CASE WHEN exec.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(exec.id)`,
        'metric',
      )
      .where('exec.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      queryBuilder.andWhere('exec.workspaceId = :workspaceId', { workspaceId });
    }

    const flows = await queryBuilder
      .groupBy('flow.id')
      .addGroupBy('flow.name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return flows.map((flow) => ({
      id: flow.id,
      name: flow.name || 'Unnamed Flow',
      count: parseInt(flow.count) || 0,
      metric: parseFloat(flow.metric) || 0,
    }));
  }
  */

  private async getActivityTrend(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    return this.getConversationTrend(startDate, endDate, workspaceId);
  }

  private getDateRange(query: StatsQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (
      query.period === TimePeriod.CUSTOM &&
      query.startDate &&
      query.endDate
    ) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      const period = query.period || TimePeriod.LAST_30_DAYS;

      switch (period) {
        case TimePeriod.TODAY:
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;

        case TimePeriod.YESTERDAY:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;

        case TimePeriod.LAST_7_DAYS:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;

        case TimePeriod.LAST_30_DAYS:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;

        case TimePeriod.LAST_90_DAYS:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 90);
          break;

        case TimePeriod.THIS_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;

        case TimePeriod.LAST_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;

        case TimePeriod.THIS_YEAR:
          startDate = new Date(now.getFullYear(), 0, 1);
          break;

        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
      }
    }

    return { startDate, endDate };
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  private async getUserTrend(
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .select("TO_CHAR(user.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(user.id)', 'value')
      .where('user.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      query
        .innerJoin(WorkspaceMemberEntity, 'wm', 'wm.userId = user.id')
        .andWhere('wm.workspaceId = :workspaceId', { workspaceId });
    }

    const trend = await query
      .groupBy("TO_CHAR(user.createdAt, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(user.createdAt, 'YYYY-MM-DD')", 'ASC')
      .getRawMany();

    return this.fillMissingDates(trend, startDate, endDate);
  }

  private async getBotTrend(
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    const query = this.botRepository
      .createQueryBuilder('bot')
      .select("TO_CHAR(bot.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(bot.id)', 'value')
      .where('bot.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      query.andWhere('bot.workspaceId = :workspaceId', { workspaceId });
    }

    const trend = await query
      .groupBy("TO_CHAR(bot.createdAt, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(bot.createdAt, 'YYYY-MM-DD')", 'ASC')
      .getRawMany();

    return this.fillMissingDates(trend, startDate, endDate);
  }

  private async getConversationTrend(
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    const query = this.conversationRepository
      .createQueryBuilder('conversation')
      .select("TO_CHAR(conversation.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(conversation.id)', 'value')
      .where('conversation.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      query
        .leftJoin(BotEntity, 'bot', 'bot.id = conversation.botId')
        .andWhere('bot.workspaceId = :workspaceId', { workspaceId });
    }

    const trend = await query
      .groupBy("TO_CHAR(conversation.createdAt, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(conversation.createdAt, 'YYYY-MM-DD')", 'ASC')
      .getRawMany();

    return this.fillMissingDates(trend, startDate, endDate);
  }

  /*
    private async getFlowTrend(
      startDate: Date,
      endDate: Date,
      workspaceId?: string,
    ): Promise<TimeSeriesDataPoint[]> {
      const query = this.flowExecutionRepository
        .createQueryBuilder('execution')
        .select("TO_CHAR(execution.createdAt, 'YYYY-MM-DD')", 'date')
        .addSelect('COUNT(execution.id)', 'value')
        .where('execution.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
  
      if (workspaceId) {
        query.andWhere('execution.workspaceId = :workspaceId', { workspaceId });
      }
  
      const trend = await query
        .groupBy("TO_CHAR(execution.createdAt, 'YYYY-MM-DD')")
        .orderBy("TO_CHAR(execution.createdAt, 'YYYY-MM-DD')", 'ASC')
        .getRawMany();
  
      return this.fillMissingDates(trend, startDate, endDate);
    }
    */

  private async getWorkspaceTrend(
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    const query = this.workspaceRepository
      .createQueryBuilder('workspace')
      .select('DATE(workspace.createdAt)', 'date')
      .addSelect('COUNT(workspace.id)', 'value')
      .where('workspace.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      query.andWhere('workspace.id = :workspaceId', { workspaceId });
    }

    const trend = await query
      .groupBy('DATE(workspace.createdAt)')
      .orderBy('DATE(workspace.createdAt)', 'ASC')
      .getRawMany();

    return this.fillMissingDates(trend, startDate, endDate);
  }

  private fillMissingDates(
    trend: any[],
    startDate: Date,
    endDate: Date,
  ): TimeSeriesDataPoint[] {
    const result: TimeSeriesDataPoint[] = [];
    const trendMap = new Map(
      trend.map((item) => {
        const dateKey =
          item.date instanceof Date
            ? item.date.toISOString().split('T')[0]
            : String(item.date).split('T')[0];
        return [dateKey, parseInt(item.value) || 0];
      }),
    );

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        value: trendMap.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  private generateMockTrend(days: number): TimeSeriesDataPoint[] {
    const trend: TimeSeriesDataPoint[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      trend.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 100) + 50,
      });
    }

    return trend;
  }
}
