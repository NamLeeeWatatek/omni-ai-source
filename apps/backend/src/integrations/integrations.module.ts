import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import {
  ChannelCredentialEntity,
  ChannelConnectionEntity,
} from './infrastructure/persistence/relational/entities';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelCredentialEntity,
      ChannelConnectionEntity,
    ]),
    ChannelsModule,
  ],
  controllers: [IntegrationsController, OAuthController],
  providers: [IntegrationsService, OAuthService],
  exports: [IntegrationsService, OAuthService],
})
export class IntegrationsModule {}
