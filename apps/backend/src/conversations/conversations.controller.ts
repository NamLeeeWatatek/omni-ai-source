import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConversationsService } from './conversations.service';
import {
  CreateConversationDto,
  CreateMessageDto,
} from './dto/create-conversation.dto';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'conversations', version: '1' })
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create conversation' })
  create(@Body() createDto: CreateConversationDto) {
    return this.conversationsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all conversations' })
  @ApiQuery({ name: 'botId', required: false })
  findAll(@Query('botId') botId?: string) {
    return this.conversationsService.findAll(botId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add message to conversation' })
  addMessage(@Param('id') id: string, @Body() createDto: CreateMessageDto) {
    return this.conversationsService.addMessage(id, createDto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  getMessages(@Param('id') id: string) {
    return this.conversationsService.getMessages(id);
  }
}
