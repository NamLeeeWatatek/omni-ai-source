import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConversationEntity,
  MessageEntity,
} from './infrastructure/persistence/relational/entities/conversation.entity';
import {
  CreateConversationDto,
  CreateMessageDto,
} from './dto/create-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
  ) {}

  async create(createDto: CreateConversationDto) {
    const conversation = this.conversationRepository.create({
      ...createDto,
      status: 'active',
      metadata: createDto.metadata || {},
    });
    return this.conversationRepository.save(conversation);
  }

  async findAll(botId?: string) {
    const query =
      this.conversationRepository.createQueryBuilder('conversation');

    if (botId) {
      query.where('conversation.botId = :botId', { botId });
    }

    return query.getMany();
  }

  async findOne(id: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['messages'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async addMessage(conversationId: string, createDto: CreateMessageDto) {
    const conversation = await this.findOne(conversationId);

    const message = this.messageRepository.create({
      conversationId,
      ...createDto,
      metadata: createDto.metadata || {},
    });

    return this.messageRepository.save(message);
  }

  async getMessages(conversationId: string) {
    return this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }
}
