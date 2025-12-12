import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';
import { AuditLog, DataAccessLog } from './domain/audit';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller({ path: 'audit', version: '1' })
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs/:workspaceId')
  @ApiOperation({ summary: 'Get audit logs for workspace' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'resourceType', required: false })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAuditLogs(
    @Param('workspaceId') workspaceId: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getAuditLogs({
      workspaceId,
      userId,
      action,
      resourceType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('data-access/:workspaceId')
  @ApiOperation({ summary: 'Get data access logs for workspace' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'tableName', required: false })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: ['read', 'write', 'delete'],
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getDataAccessLogs(
    @Param('workspaceId') workspaceId: string,
    @Query('userId') userId?: string,
    @Query('tableName') tableName?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getDataAccessLogs({
      workspaceId,
      userId,
      tableName,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Cleanup old audit logs' })
  @ApiQuery({ name: 'daysOld', required: false, type: Number })
  @HttpCode(HttpStatus.OK)
  cleanup(@Query('daysOld') daysOld?: number) {
    return this.auditService.cleanupOldLogs(daysOld ? Number(daysOld) : 90);
  }
}
