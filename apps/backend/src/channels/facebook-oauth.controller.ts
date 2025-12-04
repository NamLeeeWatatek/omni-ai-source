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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FacebookOAuthService } from './facebook-oauth.service';
import { ChannelsService } from './channels.service';
import { ChannelStrategy } from './channel.strategy';

@ApiTags('Facebook OAuth')
@Controller({ path: 'channels/facebook', version: '1' })
export class FacebookOAuthController {
  constructor(
    private readonly facebookOAuthService: FacebookOAuthService,
    private readonly channelsService: ChannelsService,
    private readonly channelStrategy: ChannelStrategy,
  ) { }

  /**
   * Step 1: Get OAuth URL for user to login
   * Frontend redirects user to this URL
   */
  @Get('oauth/url')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get Facebook OAuth URL' })
  async getOAuthUrl(@Request() req, @Query('redirect_uri') redirectUri?: string) {
    const workspaceId = req.user.workspaceId || req.user.id;

    // Get Facebook credentials from database
    const credential = await this.facebookOAuthService.getCredential(workspaceId);

    if (!credential) {
      throw new HttpException(
        'Facebook App not configured. Please setup your Facebook App in Settings.',
        HttpStatus.NOT_FOUND,
      );
    }

    const defaultRedirectUri = `${process.env.FRONTEND_DOMAIN}/channels/callback?provider=facebook`;
    const uri = redirectUri || defaultRedirectUri;

    // Use user ID as state for security
    const state = req.user?.id || 'anonymous';

    const oauthUrl = this.facebookOAuthService.getOAuthUrl(
      credential.clientId,
      uri,
      state,
    );

    return {
      url: oauthUrl,
      redirectUri: uri,
    };
  }

  /**
   * Step 2: Handle OAuth callback
   * Facebook redirects back here with authorization code
   */
  @Get('oauth/callback')
  @ApiOperation({ summary: 'Handle Facebook OAuth callback' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('workspace_id') workspaceId?: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    // Handle OAuth errors
    if (error) {
      throw new HttpException(
        errorDescription || 'Facebook OAuth failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!code) {
      throw new HttpException(
        'Authorization code not provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Get workspace ID from state or query param
      const wsId = workspaceId || state;

      // Get Facebook credentials from database
      const credential = await this.facebookOAuthService.getCredential(wsId);

      if (!credential) {
        throw new HttpException(
          'Facebook App not configured',
          HttpStatus.NOT_FOUND,
        );
      }

      // Exchange code for access token
      const redirectUri = `${process.env.FRONTEND_DOMAIN}/channels/callback?provider=facebook`;
      const accessToken = await this.facebookOAuthService.exchangeCodeForToken(
        code,
        redirectUri,
        credential.clientId,
        credential.clientSecret,
      );

      // Get user's pages
      const pages = await this.facebookOAuthService.getUserPages(accessToken);

      return {
        success: true,
        state: state, // Return state to identify user
        pages: pages.map(page => ({
          id: page.id,
          name: page.name,
          category: page.category,
          tasks: page.tasks,
          // Don't expose access token to frontend
        })),
        // Store access token temporarily (in session or cache)
        // Frontend will use this to connect specific pages
        tempToken: accessToken,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to process OAuth callback',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Step 3: Connect a specific Facebook Page
   * User selects which page to connect
   */
  @Post('connect')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Connect a Facebook Page' })
  async connectPage(
    @Request() req,
    @Body() body: {
      pageId: string;
      pageName: string;
      userAccessToken: string; // Temporary token from callback
      category?: string;
      botId?: string; // Optional bot ID to associate with this channel
    },
  ) {
    try {
      const userId = req.user.id;
      const workspaceId = req.user.workspaceId || userId;

      // Get page access token
      const pages = await this.facebookOAuthService.getUserPages(
        body.userAccessToken,
      );

      const page = pages.find(p => p.id === body.pageId);

      if (!page) {
        throw new HttpException(
          'Page not found or no permission',
          HttpStatus.NOT_FOUND,
        );
      }

      // Connect page
      const connection = await this.facebookOAuthService.connectPage(
        page.id,
        page.name,
        page.access_token,
        workspaceId,
        userId,
        {
          category: page.category,
          tasks: page.tasks,
          botId: body.botId, // Save botId to metadata
        },
      );

      // Subscribe to webhooks
      const subscribed = await this.facebookOAuthService.subscribePageWebhooks(
        page.id,
        page.access_token,
      );

      return {
        success: true,
        connection: {
          id: connection.id,
          name: connection.name,
          type: connection.type,
          status: connection.status,
          metadata: connection.metadata,
          connectedAt: connection.connectedAt,
        },
        webhookSubscribed: subscribed,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to connect Facebook page',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all connected Facebook pages
   */
  @Get('connections')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get connected Facebook pages' })
  async getConnections(@Request() req) {
    const workspaceId = req.user.workspaceId || req.user.id;

    const connections = await this.facebookOAuthService.getConnectedPages(
      workspaceId,
    );

    return {
      success: true,
      connections: connections.map(conn => ({
        id: conn.id,
        name: conn.name,
        type: conn.type,
        status: conn.status,
        metadata: conn.metadata,
        connectedAt: conn.connectedAt,
      })),
    };
  }

  /**
   * Disconnect a Facebook page
   */
  @Delete('connections/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Disconnect a Facebook page' })
  async disconnectPage(@Request() req, @Param('id') connectionId: string) {
    const workspaceId = req.user.workspaceId || req.user.id;

    await this.facebookOAuthService.disconnectPage(connectionId, workspaceId);

    return {
      success: true,
      message: 'Facebook page disconnected',
    };
  }

  /**
   * Test connection by sending a test message
   */
  @Post('connections/:id/test')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Test Facebook page connection' })
  async testConnection(
    @Request() req,
    @Param('id') connectionId: string,
    @Body() body: { recipientId: string; message: string },
  ) {
    const workspaceId = req.user.workspaceId || req.user.id;

    // 1. Get connection
    const connection = await this.channelsService.findOne(connectionId, workspaceId);
    if (!connection) {
      throw new HttpException('Connection not found', HttpStatus.NOT_FOUND);
    }

    // 2. Get provider
    const provider = this.channelStrategy.getProvider('facebook');

    // 3. Set credentials manually (since we are bypassing strategy lookup which might pick wrong connection)
    if ('setCredentials' in provider) {
      (provider as any).setCredentials(
        connection.accessToken,
        connection.credential?.clientSecret || ''
      );
    }

    // 4. Send message
    const result = await provider.sendMessage({
      to: body.recipientId,
      content: body.message,
    });

    if (!result.success) {
      throw new HttpException(
        result.error || 'Failed to send test message',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      success: true,
      message: 'Test message sent',
      messageId: result.messageId,
    };
  }

  /**
   * Setup Facebook App credentials
   */
  @Post('setup')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Setup Facebook App credentials' })
  async setupApp(
    @Request() req,
    @Body() body: {
      appId: string;
      appSecret: string;
      verifyToken?: string;
    },
  ) {
    const workspaceId = req.user.workspaceId || req.user.id;

    const credential = await this.facebookOAuthService.updateCredential(
      workspaceId,
      body.appId,
      body.appSecret,
      body.verifyToken ? { verifyToken: body.verifyToken } : undefined,
    );

    return {
      success: true,
      credential: {
        id: credential.id,
        provider: credential.provider,
        appId: credential.clientId,
        verifyToken: credential.metadata?.verifyToken,
        isActive: credential.isActive,
      },
    };
  }

  /**
   * Get Facebook App credentials
   */
  @Get('setup')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get Facebook App credentials' })
  async getSetup(@Request() req) {
    const workspaceId = req.user.workspaceId || req.user.id;

    const credential = await this.facebookOAuthService.getCredential(workspaceId);

    if (!credential) {
      return {
        success: true,
        configured: false,
        credential: null,
      };
    }

    return {
      success: true,
      configured: true,
      credential: {
        id: credential.id,
        provider: credential.provider,
        appId: credential.clientId,
        verifyToken: credential.metadata?.verifyToken,
        isActive: credential.isActive,
        createdAt: credential.createdAt,
      },
    };
  }
}
