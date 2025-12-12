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

@Entity({ name: 'bot' })
export class BotEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  @Index()
  workspaceId: string;

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

  @Column({ type: String, default: 'draft' })
  status: 'draft' | 'active' | 'paused' | 'archived';

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

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

  @Column({ name: 'knowledge_base_ids', type: 'simple-array', nullable: true })
  knowledgeBaseIds?: string[] | null;

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

  @Column({ name: 'widget_position', type: String, default: 'bottom-right' })
  widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  @Column({ name: 'widget_button_size', type: String, default: 'medium' })
  widgetButtonSize: 'small' | 'medium' | 'large';

  @Column({ name: 'show_avatar', type: Boolean, default: true })
  showAvatar: boolean;

  @Column({ name: 'show_timestamp', type: Boolean, default: true })
  showTimestamp: boolean;

  @Column({ name: 'widget_enabled', type: Boolean, default: true })
  widgetEnabled: boolean;

  @Column({ name: 'widget_config', type: 'jsonb', nullable: true })
  widgetConfig?: Record<string, any> | null;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: WorkspaceEntity;

  @OneToMany(() => FlowVersionEntity, (version) => version.bot)
  flowVersions?: FlowVersionEntity[];

  @OneToMany(() => BotKnowledgeBaseEntity, (bkb) => bkb.bot)
  knowledgeBases?: BotKnowledgeBaseEntity[];

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'flow_version' })
@Index(['botId', 'version'], { unique: true })
export class FlowVersionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bot_id', type: 'uuid' })
  @Index()
  botId: string;

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

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ type: 'jsonb' })
  flow: Record<string, any>;

  @Column({ name: 'is_published', type: Boolean, default: false })
  isPublished: boolean;

  @ManyToOne(() => BotEntity, (bot) => bot.flowVersions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bot_id' })
  bot?: BotEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'bot_knowledge_base' })
@Index(['botId', 'knowledgeBaseId'], { unique: true })
export class BotKnowledgeBaseEntity extends EntityRelationalHelper {
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
