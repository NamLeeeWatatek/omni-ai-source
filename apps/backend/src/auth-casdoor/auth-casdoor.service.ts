import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import ms from 'ms';
import { AuthService } from '../auth/auth.service';
import { CasdoorCallbackDto } from './dto/casdoor-callback.dto';
import { LoginResponseDto } from '../auth/dto/login-response.dto';
import { AllConfigType } from '../config/config.type';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';

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
  ) {
    this.casdoorEndpoint = process.env.CASDOOR_ENDPOINT || 'http://localhost:8030';
    this.clientId = process.env.CASDOOR_CLIENT_ID || '';
    this.clientSecret = process.env.CASDOOR_CLIENT_SECRET || '';
    this.appName = process.env.CASDOOR_APP_NAME || 'wataomi-app';
    this.orgName = process.env.CASDOOR_ORG_NAME || 'wataomi';
  }

  async handleCallback(
    casdoorCallbackDto: CasdoorCallbackDto,
  ): Promise<LoginResponseDto> {
    const { code, state } = casdoorCallbackDto;

    this.logger.log(`Received Casdoor callback with code: ${code?.substring(0, 10)}...`);

    if (!code) {
      throw new UnauthorizedException('Authorization code is required');
    }

    try {
      // 1. Exchange code for access token
      const tokenResponse = await this.exchangeCodeForToken(code);
      this.logger.log('Successfully exchanged code for token');

      // 2. Get user info from Casdoor
      const casdoorUser = await this.getCasdoorUserInfo(tokenResponse.access_token);
      this.logger.log(`Retrieved user info for: ${casdoorUser.name}`);

      // 3. Create or update user in database
      const user = await this.syncUser(casdoorUser);
      this.logger.log(`Synced user: ${user.email}`);

      // 4. Create session and generate JWT tokens
      const hash = crypto
        .createHash('sha256')
        .update(Math.random().toString())
        .digest('hex');

      const session = await this.sessionService.create({
        user,
        hash,
      });

      // Generate tokens manually since AuthService.getTokensData is private
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

      return {
        token,
        refreshToken,
        tokenExpires,
        user,
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

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Token exchange failed: ${error}`);
      throw new UnauthorizedException('Failed to exchange code for token');
    }

    return response.json();
  }

  private async getCasdoorUserInfo(accessToken: string): Promise<any> {
    // First, get basic user info from /api/userinfo
    const userInfoUrl = `${this.casdoorEndpoint}/api/userinfo`;

    const userInfoResponse = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      const error = await userInfoResponse.text();
      this.logger.error(`Get user info failed: ${error}`);
      throw new UnauthorizedException('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();
    this.logger.log(`Basic userinfo: ${JSON.stringify(userInfo)}`);

    // Now get the full user object with all fields including isAdmin, tag, type, roles
    // The userinfo returns 'name' field which is the username, and 'preferred_username' which is owner/name
    // We need to use owner and name separately, or use the preferred_username if available
    let getUserUrl: string;
    
    if (userInfo.preferred_username && userInfo.preferred_username.includes('/')) {
      // Use preferred_username if it's in owner/name format
      getUserUrl = `${this.casdoorEndpoint}/api/get-user?id=${encodeURIComponent(userInfo.preferred_username)}`;
      this.logger.log(`Using preferred_username: ${userInfo.preferred_username}`);
    } else if (userInfo.name) {
      // Use owner and name parameters separately
      // Owner is the organization name from config
      getUserUrl = `${this.casdoorEndpoint}/api/get-user?owner=${encodeURIComponent(this.orgName)}&name=${encodeURIComponent(userInfo.name)}`;
      this.logger.log(`Using owner=${this.orgName}, name=${userInfo.name}`);
    } else {
      // Last resort: try to use the sub (UUID) with owner parameter
      getUserUrl = `${this.casdoorEndpoint}/api/get-user?owner=${encodeURIComponent(this.orgName)}&userId=${encodeURIComponent(userInfo.sub)}`;
      this.logger.log(`Using owner=${this.orgName}, userId=${userInfo.sub}`);
    }

    const fullUserResponse = await fetch(getUserUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!fullUserResponse.ok) {
      const error = await fullUserResponse.text();
      this.logger.error(`Get full user failed: ${error}`);
      // Fallback to basic userinfo if full user fetch fails
      return userInfo;
    }

    const fullUserResult = await fullUserResponse.json();
    this.logger.log(`Full user response: ${JSON.stringify(fullUserResult)}`);

    // Casdoor wraps response in {status, msg, data}
    if (fullUserResult.status === 'ok' && fullUserResult.data) {
      return fullUserResult.data;
    } else if (fullUserResult.status === 'error') {
      this.logger.error(`Casdoor API error: ${fullUserResult.msg}`);
      // Fallback to basic userinfo
      return userInfo;
    }

    return fullUserResult;
  }

  private async syncUser(casdoorUser: any): Promise<any> {
    // Find or create user based on Casdoor ID or email
    // Casdoor user object structure: { owner, name, displayName, email, isAdmin, tag, type, roles, ... }
    const userName = casdoorUser.name || casdoorUser.id;
    const email = casdoorUser.email || `${userName}@${casdoorUser.owner || 'wataomi'}.local`;
    
    this.logger.log(`Syncing user: ${email} (Casdoor ID: ${casdoorUser.owner}/${casdoorUser.name})`);
    
    // Debug: Log the fields we're checking
    this.logger.log(`Checking admin status:`);
    this.logger.log(`  - casdoorUser.isAdmin: ${casdoorUser.isAdmin}`);
    this.logger.log(`  - casdoorUser.tag: ${casdoorUser.tag}`);
    this.logger.log(`  - casdoorUser.type: ${casdoorUser.type}`);
    this.logger.log(`  - casdoorUser.roles: ${JSON.stringify(casdoorUser.roles)}`);
    
    // Map Casdoor role to backend role
    // Priority: 
    // 1. isAdmin field (boolean)
    // 2. tag field (string) - this is what you set in Casdoor UI
    // 3. roles array
    // 4. type field
    let isAdmin = false;
    
    if (casdoorUser.isAdmin === true) {
      isAdmin = true;
      this.logger.log(`User is admin via isAdmin field`);
    } else if (casdoorUser.tag) {
      // Tag is the role you set in Casdoor UI (super_admin, admin, manager, etc.)
      const tag = casdoorUser.tag.toLowerCase();
      isAdmin = tag === 'super_admin' || tag === 'admin';
      this.logger.log(`User role from tag: ${casdoorUser.tag}, isAdmin: ${isAdmin}`);
    } else if (Array.isArray(casdoorUser.roles) && casdoorUser.roles.length > 0) {
      // Check roles array
      const roleNames = casdoorUser.roles.map((r: any) => (typeof r === 'string' ? r : r.name).toLowerCase());
      isAdmin = roleNames.includes('admin') || roleNames.includes('super_admin');
      this.logger.log(`User roles: ${roleNames.join(', ')}, isAdmin: ${isAdmin}`);
    } else if (casdoorUser.type) {
      isAdmin = casdoorUser.type.toLowerCase() === 'admin';
      this.logger.log(`User type: ${casdoorUser.type}, isAdmin: ${isAdmin}`);
    }
    
    const roleId = isAdmin ? 1 : 2; // 1 = admin, 2 = user (from RoleEnum)
    
    this.logger.log(`Final determination - isAdmin: ${isAdmin}, roleId: ${roleId}`);
    
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // Create new user
      user = await this.usersService.create({
        email,
        firstName: casdoorUser.displayName || casdoorUser.name,
        lastName: '',
        password: undefined, // No password for OAuth users
        provider: 'casdoor',
        socialId: casdoorUser.id || `${casdoorUser.owner}/${casdoorUser.name}`,
        role: { id: roleId },
        status: { id: 1 }, // 1 = active
      });
      this.logger.log(`Created new user: ${email} with role: ${isAdmin ? 'admin' : 'user'}`);
    } else {
      // Update existing user role if changed
      if (user.role?.id !== roleId) {
        user = await this.usersService.update(user.id, {
          role: { id: roleId },
        });
        this.logger.log(`Updated user role to: ${isAdmin ? 'admin' : 'user'}`);
      } else {
        this.logger.log(`User already exists: ${email} with correct role`);
      }
    }

    return user;
  }
}
