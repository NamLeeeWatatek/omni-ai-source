import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RelationalUserPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { DatabaseConfig } from '../database/config/database-config.type';
import databaseConfig from '../database/config/database.config';

const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ?
    RelationalUserPersistenceModule
  : RelationalUserPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    forwardRef(() =>
      import('../auth-casdoor/auth-casdoor.module').then(
        (m) => m.AuthCasdoorModule,
      ),
    ),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, infrastructurePersistenceModule],
})
export class UsersModule implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    try {
      const { CasdoorSyncService } = await import(
        '../auth-casdoor/casdoor-sync.service'
      );
      const casdoorSyncService = this.moduleRef.get(CasdoorSyncService, {
        strict: false,
      });
      const usersService = this.moduleRef.get(UsersService);
      usersService.setCasdoorSyncService(casdoorSyncService);
    } catch {
    }
  }
}
