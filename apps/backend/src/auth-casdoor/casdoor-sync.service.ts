import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CasdoorApiClient } from './casdoor-api.client';
import { UsersService } from '../users/users.service';
import { RoleEnum } from '../roles/roles.enum';

@Injectable()
export class CasdoorSyncService {
  private readonly logger = new Logger(CasdoorSyncService.name);
  private isSyncing = false;

  constructor(
    private readonly casdoorApiClient: CasdoorApiClient,
    private readonly usersService: UsersService,
  ) {}

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

          const existingUser = await this.usersService.findByEmail(
            casdoorUser.email,
          );
          if (!existingUser) {
            created++;
          } else {
            updated++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to sync user ${casdoorUser.email}: ${error.message}`,
          );
          skipped++;
        }
      }

      this.logger.log(
        `User sync completed: ${created} created, ${updated} updated, ${skipped} skipped`,
      );
    } catch (error) {
      this.logger.error(`User sync failed: ${error.message}`);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncSingleUser(casdoorUser: any): Promise<void> {
    const email =
      casdoorUser.email || `${casdoorUser.name}@${casdoorUser.owner}.local`;

    let isAdmin = false;
    if (casdoorUser.isAdmin === true) {
      isAdmin = true;
    } else if (casdoorUser.tag) {
      const tag = casdoorUser.tag.toLowerCase();
      isAdmin = tag === 'super_admin' || tag === 'admin';
    } else if (
      Array.isArray(casdoorUser.roles) &&
      casdoorUser.roles.length > 0
    ) {
      const roleNames = casdoorUser.roles.map((r: any) =>
        (typeof r === 'string' ? r : r.name).toLowerCase(),
      );
      isAdmin =
        roleNames.includes('admin') || roleNames.includes('super_admin');
    }

    const role = isAdmin ? 'admin' : 'user';

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.create({
        email,
        name: casdoorUser.displayName || casdoorUser.name,
        password: undefined,
        provider: 'casdoor',
        socialId: casdoorUser.id || `${casdoorUser.owner}/${casdoorUser.name}`,
        role,
        isActive: true,
      });
      this.logger.log(`Created user from Casdoor: ${email}`);
    } else {
      if (user.role !== role) {
        await this.usersService.update(user.id, {
          role,
        });
        this.logger.log(`Updated user role: ${email} -> ${role}`);
      }
    }
  }

  async syncUserToCasdoor(user: any): Promise<void> {
    try {
      const isAdmin = user.role === 'admin';
      const tag = isAdmin ? 'admin' : 'user';

      const casdoorUserName = user.email.split('@')[0];

      try {
        const existingUser =
          await this.casdoorApiClient.getUser(casdoorUserName);

        if (existingUser) {
          await this.casdoorApiClient.updateUser(casdoorUserName, {
            displayName: user.name || user.email,
            email: user.email,
            tag: tag,
            isAdmin: isAdmin,
          });
          this.logger.log(`Updated user in Casdoor: ${user.email}`);
        }
      } catch {
        await this.casdoorApiClient.createUser({
          name: casdoorUserName,
          displayName: user.name || user.email,
          email: user.email,
          tag: tag,
        });
        this.logger.log(`Created user in Casdoor: ${user.email}`);
      }
    } catch (error) {
      this.logger.error(`Failed to sync user to Casdoor: ${error.message}`);
    }
  }

  async deleteUserFromCasdoor(email: string): Promise<void> {
    try {
      const casdoorUserName = email.split('@')[0];
      await this.casdoorApiClient.deleteUser(casdoorUserName);
      this.logger.log(`Deleted user from Casdoor: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to delete user from Casdoor: ${error.message}`);
    }
  }

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

  getSyncStatus(): { isSyncing: boolean } {
    return { isSyncing: this.isSyncing };
  }
}
