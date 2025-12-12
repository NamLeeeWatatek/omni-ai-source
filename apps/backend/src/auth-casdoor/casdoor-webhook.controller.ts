import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CasdoorSyncService } from './casdoor-sync.service';

@ApiTags('Casdoor Webhooks')
@Controller({
  path: 'webhooks/casdoor',
  version: '1',
})
export class CasdoorWebhookController {
  private readonly logger = new Logger(CasdoorWebhookController.name);

  constructor(private readonly casdoorSyncService: CasdoorSyncService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Casdoor webhook events' })
  async handleWebhook(@Body() payload: any): Promise<{ success: boolean }> {
    this.logger.log(`Received Casdoor webhook: ${JSON.stringify(payload)}`);

    try {
      const { action, data } = payload;

      switch (action) {
        case 'user-added':
        case 'user-updated':
          if (data) {
            await this.casdoorSyncService.syncSingleUser(data);
            this.logger.log(`Synced user from webhook: ${data.email}`);
          }
          break;

        case 'user-deleted':
          this.logger.log(`User deleted in Casdoor: ${data?.email}`);
          break;

        case 'role-updated':
          this.logger.log('Role updated in Casdoor, triggering user sync...');
          await this.casdoorSyncService.syncUsersFromCasdoor();
          break;

        default:
          this.logger.log(`Unhandled webhook action: ${action}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      return { success: true };
    }
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger user sync from Casdoor' })
  async triggerSync(): Promise<{ success: boolean; message: string }> {
    return this.casdoorSyncService.triggerManualSync();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get sync status' })
  getSyncStatus(): { isSyncing: boolean } {
    return this.casdoorSyncService.getSyncStatus();
  }
}
