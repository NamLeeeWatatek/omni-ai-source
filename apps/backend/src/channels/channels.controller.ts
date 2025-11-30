import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { CreateConnectionDto } from '../integrations/dto/create-connection.dto';

@ApiTags('Channels')
@Controller({ path: 'channels', version: '1' })
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all channel connections' })
  async findAll() {
    // TODO: Get workspaceId from authenticated user context
    const connections = await this.channelsService.findAll();

    return connections.map((conn) => ({
      id: conn.id,
      name: conn.name,
      type: conn.type,
      status: conn.status,
      connected_at: conn.connectedAt,
      metadata: conn.metadata,
    }));
  }

  @Post()
  @ApiOperation({ summary: 'Create channel connection' })
  async create(@Body() dto: CreateConnectionDto) {
    // TODO: Get workspaceId from authenticated user context
    const connection = await this.channelsService.create(dto);

    return {
      id: connection.id,
      name: connection.name,
      type: connection.type,
      status: connection.status,
      connected_at: connection.connectedAt,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete channel connection' })
  async delete(@Param('id') id: string) {
    await this.channelsService.delete(+id);
    return { success: true };
  }
}
