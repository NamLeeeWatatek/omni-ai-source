import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { CreateCredentialDto } from './dto/create-credential.dto';

@ApiTags('Integrations')
@Controller({ path: 'integrations', version: '1' })
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all integration credentials' })
  async findAll() {
    // TODO: Get workspaceId from authenticated user context
    const credentials = await this.integrationsService.findAll();

    // Return without exposing full client_secret
    return credentials.map((cred) => ({
      id: cred.id,
      name: cred.name,
      provider: cred.provider,
      client_id: cred.clientId,
      client_secret: cred.clientSecret ? '***' : undefined,
      scopes: cred.scopes,
      is_active: cred.isActive,
    }));
  }

  @Post()
  @ApiOperation({ summary: 'Create integration credential' })
  async create(@Body() dto: CreateCredentialDto) {
    // TODO: Get workspaceId from authenticated user context
    const credential = await this.integrationsService.create(dto);

    return {
      id: credential.id,
      name: credential.name,
      provider: credential.provider,
      client_id: credential.clientId,
      client_secret: '***',
      scopes: credential.scopes,
      is_active: credential.isActive,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update integration credential' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCredentialDto>,
  ) {
    const credential = await this.integrationsService.update(id, dto);

    return {
      id: credential.id,
      name: credential.name,
      provider: credential.provider,
      client_id: credential.clientId,
      client_secret: '***',
      scopes: credential.scopes,
      is_active: credential.isActive,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete integration credential' })
  async delete(@Param('id') id: string) {
    await this.integrationsService.delete(id);
    return { success: true };
  }
}
