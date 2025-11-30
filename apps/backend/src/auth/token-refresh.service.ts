import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '../session/session.service';
import { UsersService } from '../users/users.service';
import { AllConfigType } from '../config/config.type';
import ms from 'ms';

@Injectable()
export class TokenRefreshService {
  private readonly logger = new Logger(TokenRefreshService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<AllConfigType>,
    private sessionService: SessionService,
    private usersService: UsersService,
  ) {}

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    token: string;
    tokenExpires: number;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow('auth.refreshSecret', {
          infer: true,
        }),
      });

      // Get session
      const session = await this.sessionService.findById(payload.sessionId);
      if (!session) {
        throw new UnauthorizedException('Session not found');
      }

      // Verify hash matches
      if (session.hash !== payload.hash) {
        throw new UnauthorizedException('Invalid session');
      }

      // Get user
      const user = await this.usersService.findById(session.user.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
        infer: true,
      });

      const tokenExpires = Date.now() + ms(tokenExpiresIn);

      const token = await this.jwtService.signAsync(
        {
          id: user.id,
          role: user.role,
          sessionId: session.id,
          hash: session.hash,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      );

      // Check if refresh token is close to expiration (< 7 days)
      const refreshExpiresIn = this.configService.getOrThrow(
        'auth.refreshExpires',
        { infer: true },
      );
      const refreshExpiresMs = ms(refreshExpiresIn);
      const refreshExpiresAt = payload.exp * 1000; // Convert to milliseconds
      const timeUntilExpiry = refreshExpiresAt - Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      let newRefreshToken = refreshToken;

      // Rotate refresh token if close to expiration
      if (timeUntilExpiry < sevenDays) {
        this.logger.log('Rotating refresh token (close to expiration)');
        newRefreshToken = await this.jwtService.signAsync(
          {
            sessionId: session.id,
            hash: session.hash,
          },
          {
            secret: this.configService.getOrThrow('auth.refreshSecret', {
              infer: true,
            }),
            expiresIn: refreshExpiresIn,
          },
        );
      }

      this.logger.log(`Access token refreshed for user: ${user.id}`);

      return {
        token,
        tokenExpires,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Check if token is close to expiration
   */
  isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = this.jwtService.decode(token) as any;
      if (!payload || !payload.exp) {
        return true;
      }

      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // Consider token expiring soon if < 5 minutes
      const fiveMinutes = 5 * 60 * 1000;

      return timeUntilExpiry < fiveMinutes;
    } catch (error) {
      return true;
    }
  }

  /**
   * Validate token without throwing error
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
