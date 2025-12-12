import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChannelsService } from './channels.service';
import { CreateConnectionDto } from '../integrations/dto/create-connection.dto';

@ApiTags('Channels')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'channels', version: '1' })
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all channel connections' })
  async findAll(@Request() req) {
    const userId = req.user.id;
    const connections = await this.channelsService.findAll(userId);

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
  async create(@Body() dto: CreateConnectionDto, @Request() req) {
    const userId = req.user.id;
    const connection = await this.channelsService.create(dto, userId);

    return {
      id: connection.id,
      name: connection.name,
      type: connection.type,
      status: connection.status,
      connected_at: connection.connectedAt,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update channel connection' })
  async update(
    @Param('id') id: string,
    @Body() dto: { botId?: string | null; name?: string; metadata?: any },
    @Request() req,
  ) {
    const userId = req.user.id;
    const connection = await this.channelsService.update(id, dto, userId);

    return {
      id: connection.id,
      name: connection.name,
      type: connection.type,
      status: connection.status,
      botId: connection.botId,
      connected_at: connection.connectedAt,
      metadata: connection.metadata,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete channel connection' })
  async delete(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    await this.channelsService.delete(id, userId);
    return { success: true };
  }
}
