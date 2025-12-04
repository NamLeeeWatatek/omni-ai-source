# How to Add a New OAuth Channel Provider

This guide explains how to add a new OAuth-based channel (like Instagram, Telegram, etc.) to the system.

## Overview

The system uses a **Base OAuth Service** pattern to standardize OAuth flows across different channels. This makes it easy to add new channels without duplicating code.

## Step-by-Step Guide

### 1. Create OAuth Service

Create a new service file in `apps/backend/src/channels/` (e.g., `instagram-oauth.service.ts`):

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelConnectionEntity } from '../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';
import { ChannelCredentialEntity } from '../integrations/infrastructure/persistence/relational/entities/channel-credential.entity';
import { BaseOAuthService } from './services/base-oauth.service';
import axios from 'axios';

export interface InstagramAccount {
  id: string;
  username: string;
  access_token: string;
  // Add other fields as needed
}

@Injectable()
export class InstagramOAuthService extends BaseOAuthService {
  protected readonly logger = new Logger(InstagramOAuthService.name);
  protected readonly providerName = 'instagram'; // Must match channel type
  private readonly baseUrl = 'https://graph.instagram.com';
  private readonly apiVersion = 'v18.0';

  constructor(
    @InjectRepository(ChannelConnectionEntity)
    connectionRepository: Repository<ChannelConnectionEntity>,
    @InjectRepository(ChannelCredentialEntity)
    credentialRepository: Repository<ChannelCredentialEntity>,
  ) {
    super(connectionRepository, credentialRepository);
  }

  /**
   * Get OAuth URL - REQUIRED
   */
  getOAuthUrl(redirectUri: string, state?: string): string {
    // Implement provider-specific OAuth URL generation
    const url = new URL('https://api.instagram.com/oauth/authorize');
    // Add required parameters
    return url.toString();
  }

  /**
   * Exchange code for token - REQUIRED
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
  ): Promise<string> {
    // Implement token exchange logic
    const response = await axios.post(/* ... */);
    return response.data.access_token;
  }

  /**
   * Get connectable accounts - REQUIRED
   */
  async getConnectableAccounts(accessToken: string): Promise<InstagramAccount[]> {
    // Implement logic to fetch user's accounts/pages
    const response = await axios.get(/* ... */);
    return response.data;
  }

  // Add provider-specific methods as needed
}
```

### 2. Create OAuth Controller

Create a controller file (e.g., `instagram-oauth.controller.ts`):

```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InstagramOAuthService } from './instagram-oauth.service';
import { ChannelsService } from './channels.service';
import { ChannelStrategy } from './channel.strategy';

@ApiTags('Instagram OAuth')
@Controller({ path: 'channels/instagram', version: '1' })
export class InstagramOAuthController {
  constructor(
    private readonly instagramOAuthService: InstagramOAuthService,
    private readonly channelsService: ChannelsService,
    private readonly channelStrategy: ChannelStrategy,
  ) {}

  @Get('oauth/url')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getOAuthUrl(@Request() req, @Query('redirect_uri') redirectUri?: string) {
    // Get credentials and generate OAuth URL
    const credential = await this.instagramOAuthService.getCredential(
      req.user.workspaceId || req.user.id
    );
    
    const oauthUrl = this.instagramOAuthService.getOAuthUrl(
      redirectUri || `${process.env.FRONTEND_DOMAIN}/channels/callback?provider=instagram`,
      req.user?.id
    );
    
    return { url: oauthUrl };
  }

  @Get('oauth/callback')
  async handleCallback(@Query('code') code: string, @Query('state') state: string) {
    // Exchange code for token
    const accessToken = await this.instagramOAuthService.exchangeCodeForToken(
      code,
      `${process.env.FRONTEND_DOMAIN}/channels/callback?provider=instagram`
    );
    
    // Get connectable accounts
    const accounts = await this.instagramOAuthService.getConnectableAccounts(accessToken);
    
    return { success: true, accounts, tempToken: accessToken };
  }

  @Post('connect')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async connectAccount(@Request() req, @Body() body: any) {
    // Connect selected account
    const connection = await this.instagramOAuthService.connectAccount(
      body.accountId,
      body.accountName,
      body.accessToken,
      req.user.workspaceId || req.user.id,
      req.user.id,
      body.metadata
    );
    
    return { success: true, connection };
  }

  @Get('connections')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getConnections(@Request() req) {
    const connections = await this.instagramOAuthService.getConnectedAccounts(
      req.user.workspaceId || req.user.id
    );
    return { success: true, connections };
  }

  @Delete('connections/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async disconnectAccount(@Request() req, @Param('id') connectionId: string) {
    await this.instagramOAuthService.disconnectAccount(
      connectionId,
      req.user.workspaceId || req.user.id
    );
    return { success: true };
  }
}
```

### 3. Create Channel Provider (for messaging)

Create a provider file in `apps/backend/src/channels/providers/` (e.g., `instagram.provider.ts`):

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  ChannelProvider,
  ChannelMessage,
  ChannelMessageResponse,
  IncomingMessage,
} from '../interfaces/channel-provider.interface';

@Injectable()
export class InstagramProvider implements ChannelProvider {
  readonly channelType = 'instagram';
  private accessToken: string = '';
  private appSecret: string = '';
  private readonly apiVersion = 'v18.0';

  constructor(private configService: ConfigService) {}

  setCredentials(accessToken: string, appSecret: string): void {
    this.accessToken = accessToken;
    this.appSecret = appSecret;
  }

  async sendMessage(message: ChannelMessage): Promise<ChannelMessageResponse> {
    try {
      const url = `https://graph.instagram.com/${this.apiVersion}/me/messages`;
      const response = await axios.post(url, {
        recipient: { id: message.to },
        message: { text: message.content },
      }, {
        params: { access_token: this.accessToken },
      });

      return {
        success: true,
        messageId: response.data.message_id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  verifyWebhook(payload: any, signature: string): boolean {
    if (!this.appSecret) return false;

    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }

  parseIncomingMessage(payload: any): IncomingMessage {
    const entry = payload.entry?.[0];
    const messaging = entry?.messaging?.[0];

    return {
      from: messaging?.sender?.id || '',
      content: messaging?.message?.text || '',
      timestamp: new Date(messaging?.timestamp || Date.now()),
      channelType: this.channelType,
      metadata: {
        accountId: entry?.id,
        messageId: messaging?.message?.mid,
      },
    };
  }
}
```

### 4. Register in Module

Update `apps/backend/src/channels/channels.module.ts`:

```typescript
import { InstagramOAuthService } from './instagram-oauth.service';
import { InstagramOAuthController } from './instagram-oauth.controller';
import { InstagramProvider } from './providers/instagram.provider';

@Module({
  imports: [/* ... */],
  controllers: [
    ChannelsController,
    WebhooksController,
    FacebookOAuthController,
    InstagramOAuthController, // Add here
  ],
  providers: [
    ChannelsService,
    ChannelStrategy,
    FacebookProvider,
    InstagramProvider, // Add here
    FacebookOAuthService,
    InstagramOAuthService, // Add here
    ChannelEventListener,
  ],
  exports: [
    ChannelStrategy,
    ChannelsService,
    FacebookOAuthService,
    InstagramOAuthService, // Add here
    ChannelEventListener,
  ],
})
export class ChannelsModule implements OnModuleInit {
  constructor(
    private readonly strategy: ChannelStrategy,
    private readonly facebookProvider: FacebookProvider,
    private readonly instagramProvider: InstagramProvider, // Add here
  ) {}

  onModuleInit() {
    this.strategy.register('facebook', this.facebookProvider);
    this.strategy.register('instagram', this.instagramProvider); // Add here
  }
}
```

### 5. Add Webhook Handler

Update `apps/backend/src/channels/webhooks.controller.ts`:

```typescript
@Post('instagram')
@ApiOperation({ summary: 'Handle Instagram webhook events' })
async handleInstagramWebhook(
  @Body() payload: any,
  @Headers('x-hub-signature-256') signature?: string,
) {
  try {
    this.logger.log('Received Instagram webhook');

    // Verify signature
    const isValid = this.channelStrategy.verifyWebhook(
      'instagram',
      payload,
      signature || '',
    );
    
    if (!isValid) {
      this.logger.error('Invalid Instagram webhook signature');
      return { success: false, error: 'Invalid signature' };
    }

    // Process entries
    if (payload.object === 'instagram') {
      for (const entry of payload.entry || []) {
        for (const messaging of entry.messaging || []) {
          await this.processInstagramMessage(messaging, entry.id);
        }
      }
    }

    return { success: true };
  } catch (error) {
    this.logger.error(`Instagram webhook error: ${error.message}`);
    return { success: false, error: error.message };
  }
}
```

## Key Points

1. **Always extend `BaseOAuthService`** - This provides common functionality like credential management, connection management, etc.

2. **Implement required methods**:
   - `getOAuthUrl()` - Generate OAuth authorization URL
   - `exchangeCodeForToken()` - Exchange authorization code for access token
   - `getConnectableAccounts()` - Get list of accounts user can connect

3. **Set `providerName`** - Must match the channel type used in database

4. **Use axios for HTTP requests** - More reliable than fetch, better error handling

5. **Add proper error handling** - Always catch and log errors appropriately

6. **Follow naming conventions**:
   - Service: `{Provider}OAuthService`
   - Controller: `{Provider}OAuthController`
   - Provider: `{Provider}Provider`

## Testing

1. Test OAuth flow manually through Swagger UI
2. Test webhook verification
3. Test message sending
4. Test connection management (connect/disconnect)

## Security Considerations

1. Always verify webhook signatures
2. Store credentials securely in database
3. Use environment variables for sensitive data
4. Validate all user inputs
5. Implement rate limiting where appropriate
