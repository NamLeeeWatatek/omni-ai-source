import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { ChannelStrategy } from './channel.strategy';
import { FacebookProvider } from './providers/facebook.provider';
import { GoogleProvider } from './providers/google.provider';
import { OmiProvider } from './providers/omi.provider';
import { WebhooksController } from './webhooks.controller';
import {
  ChannelConnectionEntity,
  ChannelCredentialEntity,
} from '../integrations/infrastructure/persistence/relational/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelConnectionEntity,
      ChannelCredentialEntity,
    ]),
  ],
  controllers: [ChannelsController, WebhooksController],
  providers: [
    ChannelsService,
    ChannelStrategy,
    FacebookProvider,
    GoogleProvider,
    OmiProvider,
  ],
  exports: [ChannelStrategy, ChannelsService],
})
export class ChannelsModule implements OnModuleInit {
  constructor(
    private readonly strategy: ChannelStrategy,
    private readonly facebookProvider: FacebookProvider,
    private readonly googleProvider: GoogleProvider,
    private readonly omiProvider: OmiProvider,
  ) { }

  onModuleInit() {
    // Register all channel providers
    this.strategy.register('facebook', this.facebookProvider);
    this.strategy.register('google', this.googleProvider);
    this.strategy.register('omi', this.omiProvider);
  }
}
