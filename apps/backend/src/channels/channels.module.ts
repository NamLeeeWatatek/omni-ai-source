import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { ChannelStrategy } from './channel.strategy';
import { FacebookProvider } from './providers/facebook.provider';
import { GoogleProvider } from './providers/google.provider';
import { OmiProvider } from './providers/omi.provider';
import { WebhooksController } from './webhooks.controller';
import { FacebookOAuthController } from './facebook-oauth.controller';
import { FacebookOAuthService } from './facebook-oauth.service';
import {
  ChannelConnectionEntity,
  ChannelCredentialEntity,
} from '../integrations/infrastructure/persistence/relational/entities';
import {
  ConversationEntity,
  MessageEntity
} from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { BotsModule } from '../bots/bots.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { ChannelEventListener } from './listeners/channel-event.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelConnectionEntity,
      ChannelCredentialEntity,
      ConversationEntity,
      MessageEntity,
    ]),
    forwardRef(() => ConversationsModule),
  ],
  controllers: [ChannelsController, WebhooksController, FacebookOAuthController],
  providers: [
    ChannelsService,
    ChannelStrategy,
    FacebookProvider,
    GoogleProvider,
    OmiProvider,
    FacebookOAuthService,
    ChannelEventListener,
  ],
  exports: [ChannelStrategy, ChannelsService, FacebookOAuthService, ChannelEventListener],
})
export class ChannelsModule implements OnModuleInit {
  constructor(
    private readonly strategy: ChannelStrategy,
    private readonly facebookProvider: FacebookProvider,
    private readonly googleProvider: GoogleProvider,
    private readonly omiProvider: OmiProvider,
  ) { }

  onModuleInit() {
    this.strategy.register('facebook', this.facebookProvider);
    this.strategy.register('google', this.googleProvider);
    this.strategy.register('omi', this.omiProvider);
  }
}
