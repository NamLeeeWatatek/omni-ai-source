import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import { BotEntity } from '../../../../../bots/infrastructure/persistence/relational/entities/bot.entity';

@Entity({ name: 'conversation' })
export class ConversationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  botId: string;

  @Column({ type: 'uuid', nullable: true })
  channelId?: string | null;

  @Column({ type: String })
  externalId: string;

  @Column({ type: String, default: 'active' })
  status: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @ManyToOne(() => BotEntity)
  bot?: BotEntity;

  @OneToMany(() => MessageEntity, (message) => message.conversation)
  messages?: MessageEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity({ name: 'message' })
export class MessageEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: String })
  sender: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages)
  conversation?: ConversationEntity;

  @CreateDateColumn()
  createdAt: Date;
}
