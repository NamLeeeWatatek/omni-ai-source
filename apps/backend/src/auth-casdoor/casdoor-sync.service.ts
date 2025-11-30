import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CasdoorApiClient } from './casdoor-api.client';
import { UsersService } from '../users/users.service';
import { RoleEnum } from '../roles/roles.enum';

/**
 * Casdoor Sync Service
 * Handles bidirectional synchronization between Casdoor and Backend
 */
@Injectable()
export class CasdoorSyncService {
  private readonly logger = new Logger(CasdoorSyncService.name);
  private isSyncing = false;

  constructor(
    private readonly casdoorApiClient: CasdoorApiClient,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Sync all users from Casdoor to Backend
   * Runs every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async syncUsersFromCasdoor(): Promise<void> {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    this.logger.log('Starting user sync from Casdoor...');

    try {
      const casdoorUsers = await this.casdoorApiClient.getUsers();
      this.logger.log(`Found ${casdoorUsers.length} users in Casdoor`);

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const casdoorUser of casdoorUsers) {
        try {
          await this.syncSingleUser(casdoorUser);
          
          const existingUser = await this.usersService.findByEmail(casdoorUser.email);
          if (!existingUser) {
            created++;
          } else {
            updated++;
          }
        } catch (error) {
          this.logger.error(`Failed to sync user ${casdoorUser.email}: ${error.message}`);
          skipped++;
        }
      }

      this.logger.log(`User sync completed: ${created} created, ${updated} updated, ${skipped} skipped`);
    } catch (error) {
      this.logger.error(`User sync failed: ${error.message}`);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync single user from Casdoor to Backend
   */
  async syncSingleUser(casdoorUser: any): Promise<void> {
    const email = casdoorUser.email || `${casdoorUser.name}@${casdoorUser.owner}.local`;
    
    // Determine role
    let isAdmin = false;
    if (casdoorUser.isAdmin === true) {
      isAdmin = true;
    } else if (casdoorUser.tag) {
      const tag = casdoorUser.tag.toLowerCase();
      isAdmin = tag === 'super_admin' || tag === 'admin';
    } else if (Array.isArray(casdoorUser.roles) && casdoorUser.roles.length > 0) {
      const roleNames = casdoorUser.roles.map((r: any) => 
        (typeof r === 'string' ? r : r.name).toLowerCase()
      );
      isAdmin = roleNames.includes('admin') || roleNames.includes('super_admin');
    }

    const roleId = isAdmin ? RoleEnum.admin : RoleEnum.user;

    // Find or create user
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // Create new user
      user = await this.usersService.create({
        email,
        firstName: casdoorUser.displayName || casdoorUser.name,
        lastName: '',
        password: undefined,
        provider: 'casdoor',
        socialId: casdoorUser.id || `${casdoorUser.owner}/${casdoorUser.name}`,
        role: { id: roleId },
        status: { id: 1 },
      });
      this.logger.log(`Created user from Casdoor: ${email}`);
    } else {
      // Update existing user if role changed
      if (user.role?.id !== roleId) {
        await this.usersService.update(user.id, {
          role: { id: roleId },
        });
        this.logger.log(`Updated user role: ${email} -> ${isAdmin ? 'admin' : 'user'}`);
      }
    }
  }

  /**
   * Sync user from Backend to Casdoor
   * Called when user is created/updated in Backend
   */
  async syncUserToCasdoor(user: any): Promise<void> {
    try {
      const isAdmin = user.role?.id === RoleEnum.admin;
      const tag = isAdmin ? 'admin' : 'user';

      // Check if user exists in Casdoor
      const casdoorUserName = user.email.split('@')[0]; // Use email prefix as username
      
      try {
        const existingUser = await this.casdoorApiClient.getUser(casdoorUserName);
        
        if (existingUser) {
          // Update existing user
          await this.casdoorApiClient.updateUser(casdoorUserName, {
            displayName: user.firstName || user.email,
            email: user.email,
            tag: tag,
            isAdmin: isAdmin,
          });
          this.logger.log(`Updated user in Casdoor: ${user.email}`);
        }
      } catch (error) {
        // User doesn't exist, create new
        await this.casdoorApiClient.createUser({
          name: casdoorUserName,
          displayName: user.firstName || user.email,
          email: user.email,
          tag: tag,
        });
        this.logger.log(`Created user in Casdoor: ${user.email}`);
      }
    } catch (error) {
      this.logger.error(`Failed to sync user to Casdoor: ${error.message}`);
      // Don't throw - we don't want to block backend operations if Casdoor is down
    }
  }

  /**
   * Delete user from Casdoor
   * Called when user is deleted in Backend
   */
  async deleteUserFromCasdoor(email: string): Promise<void> {
    try {
      const casdoorUserName = email.split('@')[0];
      await this.casdoorApiClient.deleteUser(casdoorUserName);
      this.logger.log(`Deleted user from Casdoor: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to delete user from Casdoor: ${error.message}`);
      // Don't throw - we don't want to block backend operations
    }
  }

  /**
   * Manual sync trigger (for admin use)
   */
  async triggerManualSync(): Promise<{ success: boolean; message: string }> {
    try {
      await this.syncUsersFromCasdoor();
      return {
        success: true,
        message: 'User sync completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
      };
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): { isSyncing: boolean } {
    return { isSyncing: this.isSyncing };
  }
}
