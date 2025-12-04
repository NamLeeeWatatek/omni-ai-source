import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelConnectionEntity } from '../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';
import { ChannelCredentialEntity } from '../integrations/infrastructure/persistence/relational/entities/channel-credential.entity';
import { BaseOAuthService } from './services/base-oauth.service';
import axios from 'axios';

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks: string[];
}

export interface FacebookUserPages {
  data: FacebookPage[];
}

@Injectable()
export class FacebookOAuthService extends BaseOAuthService {
  protected readonly logger = new Logger(FacebookOAuthService.name);
  protected readonly providerName = 'facebook';
  private readonly baseUrl = 'https://graph.facebook.com';
  private readonly apiVersion = 'v24.0';

  constructor(
    private configService: ConfigService,
    @InjectRepository(ChannelConnectionEntity)
    connectionRepository: Repository<ChannelConnectionEntity>,
    @InjectRepository(ChannelCredentialEntity)
    credentialRepository: Repository<ChannelCredentialEntity>,
  ) {
    super(connectionRepository, credentialRepository);
  }

  /**
   * Get OAuth URL for user to login and grant permissions
   */
  getOAuthUrl(appId: string, redirectUri: string, state?: string): string {
    if (!appId) {
      throw new HttpException(
        'Facebook App ID not configured',
        HttpStatus.BAD_REQUEST,
      );
    }

    const url = new URL('https://www.facebook.com/v24.0/dialog/oauth');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set(
      'scope',
      'pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement',
    );
    url.searchParams.set('response_type', 'code');

    if (state) {
      url.searchParams.set('state', state);
    }

    return url.toString();
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
    appId?: string,
    appSecret?: string,
  ): Promise<string> {
    this.validateCredentials(appId, appSecret);

    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/oauth/access_token`,
        {
          params: {
            client_id: appId,
            client_secret: appSecret,
            redirect_uri: redirectUri,
            code: code,
          },
        },
      );

      return response.data.access_token;
    } catch (error: any) {
      this.logger.error('Token exchange failed:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.error?.message || 'Failed to exchange code for token',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get user's Facebook Pages with access tokens
   * Implements getConnectableAccounts from OAuthProviderInterface
   */
  async getConnectableAccounts(accessToken: string): Promise<FacebookPage[]> {
    return this.getUserPages(accessToken);
  }

  /**
   * Get user's Facebook Pages with access tokens
   */
  async getUserPages(userAccessToken: string): Promise<FacebookPage[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/me/accounts`,
        {
          params: {
            access_token: userAccessToken,
            fields: 'id,name,access_token,category,tasks',
          },
        },
      );

      const data: FacebookUserPages = response.data;
      return data.data || [];
    } catch (error: any) {
      this.logger.error('Get pages failed:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.error?.message || 'Failed to get Facebook pages',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get user info from Facebook (PSID to name and avatar)
   */
  async getUserInfo(userId: string, pageAccessToken: string): Promise<{
    name?: string;
    profile_pic?: string;
    first_name?: string;
    last_name?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/${userId}`,
        {
          params: {
            access_token: pageAccessToken,
            fields: 'name,first_name,last_name,profile_pic',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.warn(`Get user info failed for ${userId}:`, error.response?.data || error.message);
      return {};
    }
  }

  /**
   * Connect a Facebook Page to the system
   * Overrides base method to use Facebook-specific logic
   */
  async connectPage(
    pageId: string,
    pageName: string,
    pageAccessToken: string,
    workspaceId: string,
    userId: string,
    metadata?: any,
  ): Promise<ChannelConnectionEntity> {
    return this.connectAccount(
      pageId,
      pageName,
      pageAccessToken,
      workspaceId,
      userId,
      {
        pageId, // Keep for backward compatibility
        pageName,
        ...metadata,
      },
    );
  }

  /**
   * Disconnect a Facebook Page
   * Alias for base disconnectAccount method
   */
  async disconnectPage(
    connectionId: string,
    workspaceId: string,
  ): Promise<void> {
    return this.disconnectAccount(connectionId, workspaceId);
  }

  /**
   * Get all connected Facebook pages for a workspace
   * Alias for base getConnectedAccounts method
   */
  async getConnectedPages(
    workspaceId: string,
  ): Promise<ChannelConnectionEntity[]> {
    return this.getConnectedAccounts(workspaceId);
  }

  /**
   * Get or create Facebook credential for workspace
   */
  async getOrCreateCredential(
    workspaceId: string,
    appId?: string,
    appSecret?: string,
    verifyToken?: string,
  ): Promise<ChannelCredentialEntity> {
    // Try to find existing credential
    let credential = await this.getCredential(workspaceId);

    // If not found and credentials provided, create new
    if (!credential && appId && appSecret) {
      credential = await this.updateCredential(
        workspaceId,
        appId,
        appSecret,
        verifyToken ? { verifyToken } : undefined,
      );
    }

    if (!credential) {
      throw new HttpException(
        'Facebook App not configured. Please setup your Facebook App first.',
        HttpStatus.NOT_FOUND,
      );
    }

    return credential;
  }

  /**
   * Update Facebook credential with verify token
   * Overrides base method to add Facebook-specific metadata
   */
  async updateCredential(
    workspaceId: string,
    appId: string,
    appSecret: string,
    metadata?: Record<string, any>,
  ): Promise<ChannelCredentialEntity> {
    const verifyToken = metadata?.verifyToken as string | undefined;
    return super.updateCredential(workspaceId, appId, appSecret, {
      verifyToken: verifyToken || 'wataomi_verify_token',
      apiVersion: this.apiVersion,
      ...metadata,
    });
  }

  /**
   * Subscribe app to page webhooks
   */
  async subscribePageWebhooks(
    pageId: string,
    pageAccessToken: string,
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.apiVersion}/${pageId}/subscribed_apps`,
        null,
        {
          params: {
            access_token: pageAccessToken,
            subscribed_fields:
              'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads',
          },
        },
      );

      const data = response.data;
      this.logger.log(`Subscribed to webhooks for page ${pageId}:`, data);
      return data.success === true;
    } catch (error: any) {
      this.logger.error('Subscribe webhooks error:', error.response?.data || error.message);
      return false;
    }
  }
}
