import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthCasdoorController } from './auth-casdoor.controller';
import { AuthCasdoorService } from './auth-casdoor.service';
import { CasdoorApiClient } from './casdoor-api.client';
import { CasdoorSyncService } from './casdoor-sync.service';
import { CasdoorWebhookController } from './casdoor-webhook.controller';
import { AuthModule } from '../auth/auth.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    AuthModule,
    SessionModule,
    UsersModule,
    JwtModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AuthCasdoorController, CasdoorWebhookController],
  providers: [AuthCasdoorService, CasdoorApiClient, CasdoorSyncService],
  exports: [AuthCasdoorService, CasdoorApiClient, CasdoorSyncService],
})
export class AuthCasdoorModule {}
