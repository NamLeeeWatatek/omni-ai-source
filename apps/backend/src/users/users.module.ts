import {
  // common
  Module,
  forwardRef,
  OnModuleInit,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { UsersController } from './users.controller';

import { UsersService } from './users.service';
import { DocumentUserPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { RelationalUserPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { DatabaseConfig } from '../database/config/database-config.type';
import databaseConfig from '../database/config/database.config';
import { FilesModule } from '../files/files.module';

// <database-block>
const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? DocumentUserPersistenceModule
  : RelationalUserPersistenceModule;
// </database-block>

@Module({
  imports: [
    // import modules, etc.
    infrastructurePersistenceModule,
    FilesModule,
    forwardRef(() => import('../auth-casdoor/auth-casdoor.module').then(m => m.AuthCasdoorModule)),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, infrastructurePersistenceModule],
})
export class UsersModule implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    // Inject CasdoorSyncService after module initialization to avoid circular dependency
    try {
      const { CasdoorSyncService } = await import('../auth-casdoor/casdoor-sync.service');
      const casdoorSyncService = this.moduleRef.get(CasdoorSyncService, { strict: false });
      const usersService = this.moduleRef.get(UsersService);
      usersService.setCasdoorSyncService(casdoorSyncService);
    } catch (error) {
      // CasdoorSyncService might not be available in all environments
      console.log('CasdoorSyncService not available');
    }
  }
}
