import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../utils/public.decorator';
import { AuthCasdoorService } from './auth-casdoor.service';
import { CasdoorCallbackDto } from './dto/casdoor-callback.dto';
import { LoginResponseDto } from '../auth/dto/login-response.dto';

@ApiTags('Casdoor Auth')
@Controller({
  path: 'auth/casdoor',
  version: '1',
})
export class AuthCasdoorController {
  constructor(private readonly authCasdoorService: AuthCasdoorService) { }

  @Get('login-url')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Casdoor login URL' })
  async getLoginUrl(): Promise<{ loginUrl: string }> {
    return this.authCasdoorService.getLoginUrl();
  }

  @Post('callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Casdoor OAuth callback' })
  async callback(
    @Body() casdoorCallbackDto: CasdoorCallbackDto,
  ): Promise<LoginResponseDto> {
    const result = await this.authCasdoorService.handleCallback(casdoorCallbackDto);
    
    // Debug log to check response structure
    console.log('[Casdoor Callback] Response:', {
      hasToken: !!result.token,
      hasUser: !!result.user,
      userEmail: result.user?.email,
      userId: result.user?.id
    });
    
    return result;
  }
}
