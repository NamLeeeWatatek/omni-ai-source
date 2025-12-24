import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { WorkspaceEntity } from '../../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import { WorkspaceOwnedEntity } from '../../../../../utils/workspace-owned.entity';
// import { FlowVersionEntity } from '../../../../../flows/infrastructure/persistence/relational/entities/flow-version.entity';
import {
  BotStatus,
  BotWidgetPosition,
  BotWidgetButtonSize,
} from '../../../../bots.enum';

@Entity({ name: 'bot' })
export class BotEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @Column({ name: 'avatar_url', type: String, nullable: true })
  avatarUrl?: string | null;

  @Column({ name: 'default_language', type: String, default: 'en' })
  defaultLanguage: string;

  @Column({ type: String, default: 'UTC' })
  timezone: string;

  @Column({ type: String, default: BotStatus.DRAFT })
  status: BotStatus;

  @Column({ type: String, default: 'FiMessageSquare', nullable: true })
  icon?: string;

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  @Column({ name: 'flow_id', type: 'uuid', nullable: true })
  flowId?: string | null;

  @Column({ name: 'system_prompt', type: 'text', nullable: true })
  systemPrompt?: string | null;

  @Column({ type: 'simple-array', nullable: true })
  functions?: string[] | null;

  @Column({ name: 'function_config', type: 'jsonb', nullable: true })
  functionConfig?: Record<string, any> | null;

  @Column({ name: 'ai_provider_id', type: 'uuid', nullable: true })
  aiProviderId?: string | null;

  @Column({ name: 'ai_model_name', type: String, nullable: true })
  aiModelName?: string | null;

  @Column({ name: 'ai_parameters', type: 'jsonb', nullable: true })
  aiParameters?: Record<string, any> | null;

  @Column({ name: 'enable_auto_learn', type: Boolean, default: false })
  enableAutoLearn: boolean;

  @Column({ name: 'allowed_origins', type: 'jsonb', nullable: true })
  allowedOrigins?: string[] | null;

  @Column({ name: 'welcome_message', type: String, nullable: true })
  welcomeMessage?: string | null;

  @Column({ name: 'placeholder_text', type: String, nullable: true })
  placeholderText?: string | null;

  @Column({ name: 'primary_color', type: String, nullable: true })
  primaryColor?: string | null;

  @Column({
    name: 'widget_position',
    type: String,
    default: BotWidgetPosition.BOTTOM_RIGHT,
  })
  widgetPosition: BotWidgetPosition;

  @Column({
    name: 'widget_button_size',
    type: String,
    default: BotWidgetButtonSize.MEDIUM,
  })
  widgetButtonSize: BotWidgetButtonSize;

  @Column({ name: 'show_avatar', type: Boolean, default: true })
  showAvatar: boolean;

  @Column({ name: 'show_timestamp', type: Boolean, default: true })
  showTimestamp: boolean;

  @Column({ name: 'widget_enabled', type: Boolean, default: true })
  widgetEnabled: boolean;

  @Column({ name: 'active_version_id', type: 'uuid', nullable: true })
  activeVersionId?: string | null;

  // @ManyToOne(() => FlowVersionEntity, { nullable: true })
  // @JoinColumn({ name: 'active_version_id' })
  // activeVersion?: FlowVersionEntity;

  // @OneToMany(() => FlowVersionEntity, (version) => version.bot)
  // flowVersions?: FlowVersionEntity[];

  @OneToMany(() => BotKnowledgeBaseEntity, (bkb) => bkb.bot)
  knowledgeBases?: BotKnowledgeBaseEntity[];

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;
}

@Entity({ name: 'bot_knowledge_base' })
@Index(['botId', 'knowledgeBaseId'], { unique: true })
export class BotKnowledgeBaseEntity extends WorkspaceOwnedEntity {
  @Column({ name: 'bot_id', type: 'uuid', primary: true })
  botId: string;

  @Column({ name: 'knowledge_base_id', type: 'uuid', primary: true })
  knowledgeBaseId: string;

  @Column({ type: 'int', default: 1 })
  priority: number;

  @Column({ name: 'rag_settings', type: 'jsonb', nullable: true })
  ragSettings?: Record<string, any> | null;

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  @ManyToOne(() => BotEntity, (bot) => bot.knowledgeBases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bot_id' })
  bot?: BotEntity;
}
