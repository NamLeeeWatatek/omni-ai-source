import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService } from './permissions.service';
import {
  PermissionCheckRequestDto,
  PermissionCheckResponseDto,
} from './dto/permission-check.dto';
import { UserCapabilitiesDto } from './dto/user-capabilities.dto';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'permissions',
  version: '1',
})
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('me/capabilities')
  @ApiOperation({ summary: 'Get current user capabilities and permissions' })
  getMyCapabilities(@Request() req): UserCapabilitiesDto {
    return this.permissionsService.getUserCapabilities(req.user);
  }

  @Post('check')
  @ApiOperation({ summary: 'Check if user has specific permissions' })
  checkPermissions(
    @Request() req,
    @Body() dto: PermissionCheckRequestDto,
  ): PermissionCheckResponseDto {
    return this.permissionsService.checkPermissions(req.user, dto.permissions);
  }
}
