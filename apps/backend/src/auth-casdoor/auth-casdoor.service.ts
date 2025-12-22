import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import ms from 'ms';
import axios from 'axios';
import { AuthService } from '../auth/auth.service';
import { CasdoorCallbackDto } from './dto/casdoor-callback.dto';
import { LoginResponseDto } from '../auth/dto/login-response.dto';
import { AllConfigType } from '../config/config.type';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { WorkspaceHelperService } from '../workspaces/workspace-helper.service';

@Injectable()
export class AuthCasdoorService {
  private readonly logger = new Logger(AuthCasdoorService.name);
  private readonly casdoorEndpoint: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly appName: string;
  private readonly orgName: string;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
    private readonly workspaceHelper: WorkspaceHelperService,
  ) {
    this.casdoorEndpoint =
      process.env.CASDOOR_ENDPOINT || 'http://localhost:8030';
    this.clientId = process.env.CASDOOR_CLIENT_ID || '';
    this.clientSecret = process.env.CASDOOR_CLIENT_SECRET || '';
    this.appName = process.env.CASDOOR_APP_NAME || 'app-built-in';
    this.orgName = process.env.CASDOOR_ORG_NAME || 'built-in';
  }

  async getLoginUrl(): Promise<{ loginUrl: string }> {
    const frontendUrl = process.env.FRONTEND_DOMAIN || 'http://localhost:3000';
    const redirectUri = `${frontendUrl}/auth/callback`;
    const state = crypto.randomBytes(16).toString('hex');

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile email',
      state,
    });

    const loginUrl = `${this.casdoorEndpoint}/login/oauth/authorize?${params.toString()}`;

    this.logger.log(
      `Generated Casdoor login URL with redirect: ${redirectUri}`,
    );

    return { loginUrl };
  }

  async handleCallback(
    casdoorCallbackDto: CasdoorCallbackDto,
  ): Promise<LoginResponseDto> {
    const { code } = casdoorCallbackDto;

    this.logger.log(
      `Received Casdoor callback with code: ${code?.substring(0, 10)}...`,
    );

    if (!code) {
      throw new UnauthorizedException('Authorization code is required');
    }

    try {
      const tokenResponse = await this.exchangeCodeForToken(code);
      this.logger.log('Successfully exchanged code for token');

      const casdoorUser = await this.getCasdoorUserInfo(
        tokenResponse.access_token,
      );
      this.logger.log(`Retrieved user info for: ${casdoorUser.name}`);

      const user = await this.syncUser(casdoorUser);
      this.logger.log(`Synced user: ${user.email}`);

      const hash = crypto
        .createHash('sha256')
        .update(Math.random().toString())
        .digest('hex');

      const session = await this.sessionService.create({
        user,
        hash,
      });

      const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
        infer: true,
      });

      const tokenExpires = Date.now() + ms(tokenExpiresIn);

      const token = await this.jwtService.signAsync(
        {
          id: user.id,
          role: user.role,
          sessionId: session.id,
          hash,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      );

      const refreshToken = await this.jwtService.signAsync(
        {
          sessionId: session.id,
          hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      );

      const workspace = await this.workspaceHelper.ensureUserHasWorkspace(
        user.id,
        user.name || undefined,
      );
      const workspaces = await this.workspaceHelper.getUserWorkspaces(user.id);

      this.logger.log(`User workspace: ${workspace?.name || 'none'}`);
      this.logger.log(`User has ${workspaces.length} workspaces`);

      return {
        token,
        refreshToken,
        tokenExpires,
        user,
        workspace: workspace as any,
        workspaces: workspaces as any,
      };
    } catch (error) {
      this.logger.error(`Casdoor callback error: ${error.message}`);
      throw new UnauthorizedException(error.message || 'Authentication failed');
    }
  }

  private async exchangeCodeForToken(code: string): Promise<any> {
    const tokenUrl = `${this.casdoorEndpoint}/api/login/oauth/access_token`;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
    });

    this.logger.log(`Calling token URL: ${tokenUrl}`);
    this.logger.log(`Client ID: ${this.clientId}`);
    this.logger.log(`Code: ${code.substring(0, 10)}...`);

    try {
      const response = await axios.post(tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false,
        }),
        timeout: 30000, // 30 seconds timeout
        validateStatus: (status) => status < 500, // Don't throw on 4xx
      });

      this.logger.log(`Token exchange successful`);
      return response.data;
    } catch (error) {
      this.logger.error(`Token exchange error: ${error.message}`);
      this.logger.error(`Token URL: ${tokenUrl}`);
      this.logger.error(`Casdoor endpoint: ${this.casdoorEndpoint}`);

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        this.logger.error(
          `Connection timeout - Casdoor server may be down or unreachable`,
        );
        throw new UnauthorizedException(
          'Casdoor server is not responding. Please try again later.',
        );
      }

      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(
          `Response data: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw new UnauthorizedException('Failed to exchange code for token');
    }
  }

  private async getCasdoorUserInfo(accessToken: string): Promise<any> {
    const userInfoUrl = `${this.casdoorEndpoint}/api/userinfo`;

    try {
      const userInfoResponse = await axios.get(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false,
        }),
      });

      const userInfo = userInfoResponse.data;
      this.logger.log(`Basic userinfo: ${JSON.stringify(userInfo)}`);

      let getUserUrl: string;

      if (
        userInfo.preferred_username &&
        userInfo.preferred_username.includes('/')
      ) {
        getUserUrl = `${this.casdoorEndpoint}/api/get-user?id=${encodeURIComponent(userInfo.preferred_username)}`;
        this.logger.log(
          `Using preferred_username: ${userInfo.preferred_username}`,
        );
      } else if (userInfo.name) {
        getUserUrl = `${this.casdoorEndpoint}/api/get-user?owner=${encodeURIComponent(this.orgName)}&name=${encodeURIComponent(userInfo.name)}`;
        this.logger.log(`Using owner=${this.orgName}, name=${userInfo.name}`);
      } else {
        getUserUrl = `${this.casdoorEndpoint}/api/get-user?owner=${encodeURIComponent(this.orgName)}&userId=${encodeURIComponent(userInfo.sub)}`;
        this.logger.log(`Using owner=${this.orgName}, userId=${userInfo.sub}`);
      }

      const fullUserResponse = await axios.get(getUserUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false,
        }),
      });

      const fullUserResult = fullUserResponse.data;
      this.logger.log(`Full user response: ${JSON.stringify(fullUserResult)}`);

      if (fullUserResult.status === 'ok' && fullUserResult.data) {
        return fullUserResult.data;
      } else if (fullUserResult.status === 'error') {
        this.logger.error(`Casdoor API error: ${fullUserResult.msg}`);
        return userInfo;
      }

      // If we didn't get a valid data object, fallback to basic userInfo
      return fullUserResult.data || fullUserResult || userInfo;
    } catch (error) {
      this.logger.error(`Get user info error: ${error.message}`);
      throw new UnauthorizedException('Failed to get user info');
    }
  }

  private async syncUser(casdoorUser: any): Promise<any> {
    const userName = casdoorUser.name || casdoorUser.id;
    const email =
      casdoorUser.email ||
      `${userName}@${casdoorUser.owner || 'wataomi'}.local`;

    this.logger.log(
      `Syncing user: ${email} (Casdoor ID: ${casdoorUser.owner}/${casdoorUser.name})`,
    );

    this.logger.log(`Checking admin status:`);
    this.logger.log(`  - casdoorUser.isAdmin: ${casdoorUser.isAdmin}`);
    this.logger.log(`  - casdoorUser.tag: ${casdoorUser.tag}`);
    this.logger.log(`  - casdoorUser.type: ${casdoorUser.type}`);
    this.logger.log(
      `  - casdoorUser.roles: ${JSON.stringify(casdoorUser.roles)}`,
    );

    let isAdmin = false;

    if (casdoorUser.isAdmin === true) {
      isAdmin = true;
      this.logger.log(`User is admin via isAdmin field`);
    } else if (casdoorUser.tag) {
      const tag = casdoorUser.tag.toLowerCase();
      isAdmin = tag === 'super_admin' || tag === 'admin';
      this.logger.log(
        `User role from tag: ${casdoorUser.tag}, isAdmin: ${isAdmin}`,
      );
    } else if (
      Array.isArray(casdoorUser.roles) &&
      casdoorUser.roles.length > 0
    ) {
      const roleNames = casdoorUser.roles.map((r: any) => {
        if (!r) return '';
        return (typeof r === 'string' ? r : (r.name || '')).toLowerCase();
      }).filter(Boolean);
      isAdmin =
        roleNames.includes('admin') || roleNames.includes('super_admin');
      this.logger.log(
        `User roles: ${roleNames.join(', ')}, isAdmin: ${isAdmin}`,
      );
    } else if (casdoorUser.type) {
      isAdmin = casdoorUser.type.toLowerCase() === 'admin';
      this.logger.log(`User type: ${casdoorUser.type}, isAdmin: ${isAdmin}`);
    }

    const role = isAdmin ? 'admin' : 'user';

    this.logger.log(`Final determination - isAdmin: ${isAdmin}, role: ${role}`);

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
      this.logger.log(`Created new user: ${email} with role: ${role}`);
    } else {
      if (user.role !== role) {
        user = await this.usersService.update(user.id, {
          role,
        });
        this.logger.log(`Updated user role to: ${role}`);
      } else {
        this.logger.log(`User already exists: ${email} with correct role`);
      }
    }

    return user;
  }
}
