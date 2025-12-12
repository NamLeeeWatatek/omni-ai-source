import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { WorkspaceEntity } from '../../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity({ name: 'ai_providers' })
export class AiProviderEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'key', type: String, unique: true })
  key: string; // 'openai', 'gemini', 'claude', 'ollama', 'custom'

  @Column({ name: 'label', type: String })
  label: string; // 'OpenAI GPT', 'Google Gemini', etc.

  @Column({ name: 'icon', type: String, nullable: true })
  icon?: string; // React icon component name

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'required_fields', type: 'jsonb', default: [] })
  requiredFields: string[];

  @Column({ name: 'optional_fields', type: 'jsonb', default: [] })
  optionalFields: string[];

  @Column({ name: 'default_values', type: 'jsonb', default: {} })
  defaultValues: Record<string, any>;

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  @OneToMany(() => AiProviderConfigEntity, (config) => config.provider)
  configs?: AiProviderConfigEntity[];

  @OneToMany(() => UserAiProviderConfigEntity, (config) => config.provider)
  userConfigs?: UserAiProviderConfigEntity[];

  @OneToMany(() => WorkspaceAiProviderConfigEntity, (config) => config.provider)
  workspaceConfigs?: WorkspaceAiProviderConfigEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'ai_provider_configs' })
export class AiProviderConfigEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provider_id', type: 'uuid' })
  @Index()
  providerId: string;

  @Column({ name: 'model', type: String })
  model: string; // 'gpt-4.1', 'llama3', 'gemini-2.0-pro'

  @Column({ name: 'api_key', type: String })
  apiKey: string; // encrypted/hashed

  @Column({ name: 'base_url', type: String, nullable: true })
  baseUrl?: string;

  @Column({ name: 'api_version', type: String, nullable: true })
  apiVersion?: string;

  @Column({ name: 'timeout', type: 'int', nullable: true })
  timeout?: number;

  @Column({ name: 'use_stream', type: Boolean, default: true })
  useStream: boolean;

  @Column({
    name: 'owner_type',
    type: String,
    enum: ['system', 'user', 'workspace'],
  })
  @Index()
  ownerType: 'system' | 'user' | 'workspace';

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  @Index()
  ownerId?: string; // null for system configs, user_id/workspace_id otherwise

  @Column({ name: 'is_default', type: Boolean, default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => AiProviderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider?: AiProviderEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'user_ai_provider_configs' })
export class UserAiProviderConfigEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'provider_id', type: 'uuid' })
  @Index()
  providerId: string;

  @Column({ name: 'display_name', type: String })
  displayName: string;

  @Column({ name: 'config', type: 'jsonb' })
  config: Record<string, any>;

  @Column({ name: 'model_list', type: 'jsonb', default: [] })
  modelList: string[];

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @ManyToOne(() => AiProviderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider?: AiProviderEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'workspace_ai_provider_configs' })
export class WorkspaceAiProviderConfigEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  @Index()
  workspaceId: string;

  @Column({ name: 'provider_id', type: 'uuid' })
  @Index()
  providerId: string;

  @Column({ name: 'display_name', type: String })
  displayName: string;

  @Column({ name: 'config', type: 'jsonb' })
  config: Record<string, any>;

  @Column({ name: 'model_list', type: 'jsonb', default: [] })
  modelList: string[];

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: WorkspaceEntity;

  @ManyToOne(() => AiProviderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider?: AiProviderEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'ai_usage_log' })
export class AiUsageLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  @Index()
  workspaceId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: String })
  provider: string;

  @Column({ type: String })
  model: string;

  @Column({ name: 'input_tokens', type: 'int' })
  inputTokens: number;

  @Column({ name: 'output_tokens', type: 'int' })
  outputTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  cost: number;

  @Column({
    name: 'requested_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Index()
  requestedAt: Date;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: WorkspaceEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;
}
