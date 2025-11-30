import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CasdoorSyncService } from './casdoor-sync.service';

/**
 * Casdoor Webhook Controller
 * Handles webhook events from Casdoor
 */
@ApiTags('Casdoor Webhooks')
@Controller({
  path: 'webhooks/casdoor',
  version: '1',
})
export class CasdoorWebhookController {
  private readonly logger = new Logger(CasdoorWebhookController.name);

  constructor(private readonly casdoorSyncService: CasdoorSyncService) {}

  /**
   * Handle Casdoor webhook events
   * Configure this URL in Casdoor: http://your-backend/api/v1/webhooks/casdoor
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Casdoor webhook events' })
  async handleWebhook(@Body() payload: any): Promise<{ success: boolean }> {
    this.logger.log(`Received Casdoor webhook: ${JSON.stringify(payload)}`);

    try {
      const { action, object, data } = payload;

      switch (action) {
        case 'user-added':
        case 'user-updated':
          if (data) {
            await this.casdoorSyncService.syncSingleUser(data);
            this.logger.log(`Synced user from webhook: ${data.email}`);
          }
          break;

        case 'user-deleted':
          // Note: We might not want to auto-delete users from backend
          // Just log for now
          this.logger.log(`User deleted in Casdoor: ${data?.email}`);
          break;

        case 'role-updated':
          // Trigger full sync when roles change
          this.logger.log('Role updated in Casdoor, triggering user sync...');
          await this.casdoorSyncService.syncUsersFromCasdoor();
          break;

        default:
          this.logger.log(`Unhandled webhook action: ${action}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      // Return success anyway to avoid Casdoor retrying
      return { success: true };
    }
  }

  /**
   * Trigger manual sync (admin only)
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger user sync from Casdoor' })
  async triggerSync(): Promise<{ success: boolean; message: string }> {
    return this.casdoorSyncService.triggerManualSync();
  }

  /**
   * Get sync status
   */
  @Get('status')
  @ApiOperation({ summary: 'Get sync status' })
  async getSyncStatus(): Promise<{ isSyncing: boolean }> {
    return this.casdoorSyncService.getSyncStatus();
  }
}
