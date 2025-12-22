import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FlowEntity } from './flow.entity';
import { BotEntity } from '../../../../../bots/infrastructure/persistence/relational/entities/bot.entity';
import { WorkspaceOwnedEntity } from '../../../../../utils/workspace-owned.entity';

@Entity('flow_version')
@Index(['botId', 'version'], { unique: true })
export class FlowVersionEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bot_id', type: 'uuid', nullable: true })
  @Index()
  botId: string;

  @Column({ name: 'flow_id', type: 'uuid' })
  @Index()
  flowId: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: String, nullable: true })
  name?: string | null;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @Column({ type: String, default: 'draft' })
  status: 'draft' | 'published' | 'archived';

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt?: Date | null;

  @Column({ type: 'jsonb' })
  flow: Record<string, any>;

  @Column({ name: 'is_published', type: Boolean, default: false })
  isPublished: boolean;

  @ManyToOne(() => FlowEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'flow_id' })
  flowEntity: FlowEntity;

  @ManyToOne(() => BotEntity, (bot) => bot.flowVersions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bot_id' })
  bot?: BotEntity;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any> | null;
}
