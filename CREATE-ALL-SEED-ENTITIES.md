# Create All Seed Entities - Complete Guide

## Overview

Tạo tất cả entities và seeds cần thiết cho hệ thống WataOmi:

1. ✅ **Permissions** - Done
2. ✅ **Roles** - Done (with Casdoor integration)
3. 🔄 **Node Types** - Các loại nodes trong workflow
4. 🔄 **AI Models** - Các AI models available
5. 🔄 **Integrations** - Các integrations có sẵn
6. 🔄 **Channel Types** - Các loại channels (Facebook, Telegram, etc.)

## Quick Commands

```bash
# 1. Tạo tất cả entities
cd apps/backend

# 2. Generate migration
npm run migration:generate -- src/database/migrations/CreateReferenceData

# 3. Run migration
npm run migration:run

# 4. Run seeds
npm run seed:run:relational
```

## 1. Node Types

### Entity Structure

```typescript
// apps/backend/src/node-types/infrastructure/persistence/relational/entities/node-type.entity.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'node_type' })
export class NodeTypeEntity extends EntityRelationalHelper {
  @PrimaryColumn()
  id: string; // webhook, http-request, openai-chat, etc.

  @Column()
  label: string;

  @Column()
  category: string; // trigger, action, ai, data, integration

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  properties: any[]; // Configuration fields

  @Column({ default: false })
  isPremium: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Seed Data

```typescript
const nodeTypes = [
  // Triggers
  { id: 'webhook', label: 'Webhook', category: 'trigger', icon: 'Webhook', color: '#10b981' },
  { id: 'schedule', label: 'Schedule', category: 'trigger', icon: 'Clock', color: '#8b5cf6' },
  { id: 'manual', label: 'Manual Trigger', category: 'trigger', icon: 'Play', color: '#3b82f6' },
  
  // Actions
  { id: 'http-request', label: 'HTTP Request', category: 'action', icon: 'Globe', color: '#3b82f6' },
  { id: 'send-email', label: 'Send Email', category: 'action', icon: 'Mail', color: '#ef4444' },
  { id: 'delay', label: 'Delay', category: 'action', icon: 'Clock', color: '#f59e0b' },
  
  // AI
  { id: 'openai-chat', label: 'OpenAI Chat', category: 'ai', icon: 'Bot', color: '#10b981', isPremium: true },
  { id: 'google-ai', label: 'Google AI', category: 'ai', icon: 'Sparkles', color: '#f59e0b', isPremium: true },
  { id: 'anthropic-claude', label: 'Claude AI', category: 'ai', icon: 'Brain', color: '#8b5cf6', isPremium: true },
  
  // Data
  { id: 'filter', label: 'Filter', category: 'data', icon: 'Filter', color: '#6366f1' },
  { id: 'transform', label: 'Transform', category: 'data', icon: 'Shuffle', color: '#8b5cf6' },
  { id: 'merge', label: 'Merge', category: 'data', icon: 'Merge', color: '#06b6d4' },
  
  // Integrations
  { id: 'facebook-messenger', label: 'Facebook Messenger', category: 'integration', icon: 'MessageCircle', color: '#0084ff' },
  { id: 'telegram', label: 'Telegram', category: 'integration', icon: 'Send', color: '#0088cc' },
  { id: 'whatsapp', label: 'WhatsApp', category: 'integration', icon: 'MessageSquare', color: '#25d366' },
];
```

## 2. AI Models

### Entity Structure

```typescript
// apps/backend/src/ai/infrastructure/persistence/relational/entities/ai-model.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'ai_model' })
export class AiModelEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  provider: string; // openai, google, anthropic, etc.

  @Column({ unique: true })
  modelId: string; // gpt-4, gemini-pro, claude-3-opus

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  maxTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  costPer1kTokens: number;

  @Column({ type: 'jsonb', nullable: true })
  capabilities: string[]; // ['text', 'vision', 'function-calling']

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPremium: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Seed Data

```typescript
const aiModels = [
  // OpenAI
  { name: 'GPT-4 Turbo', provider: 'openai', modelId: 'gpt-4-turbo-preview', maxTokens: 128000, costPer1kTokens: 0.01, capabilities: ['text', 'vision', 'function-calling'], isPremium: true },
  { name: 'GPT-4', provider: 'openai', modelId: 'gpt-4', maxTokens: 8192, costPer1kTokens: 0.03, capabilities: ['text', 'function-calling'], isPremium: true },
  { name: 'GPT-3.5 Turbo', provider: 'openai', modelId: 'gpt-3.5-turbo', maxTokens: 16385, costPer1kTokens: 0.0015, capabilities: ['text', 'function-calling'] },
  
  // Google
  { name: 'Gemini Pro', provider: 'google', modelId: 'gemini-pro', maxTokens: 32768, costPer1kTokens: 0.00025, capabilities: ['text'] },
  { name: 'Gemini Pro Vision', provider: 'google', modelId: 'gemini-pro-vision', maxTokens: 16384, costPer1kTokens: 0.00025, capabilities: ['text', 'vision'] },
  
  // Anthropic
  { name: 'Claude 3 Opus', provider: 'anthropic', modelId: 'claude-3-opus-20240229', maxTokens: 200000, costPer1kTokens: 0.015, capabilities: ['text', 'vision'], isPremium: true },
  { name: 'Claude 3 Sonnet', provider: 'anthropic', modelId: 'claude-3-sonnet-20240229', maxTokens: 200000, costPer1kTokens: 0.003, capabilities: ['text', 'vision'] },
  { name: 'Claude 3 Haiku', provider: 'anthropic', modelId: 'claude-3-haiku-20240307', maxTokens: 200000, costPer1kTokens: 0.00025, capabilities: ['text', 'vision'] },
];
```

## 3. Integrations

### Entity Structure

```typescript
// apps/backend/src/integrations/infrastructure/persistence/relational/entities/integration-type.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'integration_type' })
export class IntegrationTypeEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  type: string; // facebook, telegram, openai, etc.

  @Column()
  category: string; // messaging, ai, storage, automation

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  config: {
    authType: 'oauth' | 'api_key' | 'token' | 'credentials';
    requiredFields: string[];
    optionalFields?: string[];
    webhookSupport?: boolean;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPremium: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Seed Data

```typescript
const integrations = [
  // Messaging
  { name: 'Facebook Messenger', type: 'facebook', category: 'messaging', icon: 'MessageCircle', color: '#0084ff', config: { authType: 'oauth', requiredFields: ['app_id', 'app_secret', 'page_access_token'], webhookSupport: true } },
  { name: 'Telegram', type: 'telegram', category: 'messaging', icon: 'Send', color: '#0088cc', config: { authType: 'token', requiredFields: ['bot_token'], webhookSupport: true } },
  { name: 'WhatsApp Business', type: 'whatsapp', category: 'messaging', icon: 'MessageSquare', color: '#25d366', config: { authType: 'token', requiredFields: ['phone_number_id', 'access_token'], webhookSupport: true }, isPremium: true },
  { name: 'Instagram', type: 'instagram', category: 'messaging', icon: 'Instagram', color: '#e4405f', config: { authType: 'oauth', requiredFields: ['app_id', 'app_secret'], webhookSupport: true } },
  
  // AI
  { name: 'OpenAI', type: 'openai', category: 'ai', icon: 'Bot', color: '#10b981', config: { authType: 'api_key', requiredFields: ['api_key'] }, isPremium: true },
  { name: 'Google AI', type: 'google_ai', category: 'ai', icon: 'Sparkles', color: '#f59e0b', config: { authType: 'api_key', requiredFields: ['api_key'] } },
  { name: 'Anthropic Claude', type: 'anthropic', category: 'ai', icon: 'Brain', color: '#8b5cf6', config: { authType: 'api_key', requiredFields: ['api_key'] }, isPremium: true },
  
  // Storage
  { name: 'Supabase', type: 'supabase', category: 'storage', icon: 'Database', color: '#3ecf8e', config: { authType: 'api_key', requiredFields: ['url', 'anon_key'] } },
  { name: 'Qdrant', type: 'qdrant', category: 'storage', icon: 'Search', color: '#dc2626', config: { authType: 'api_key', requiredFields: ['url', 'api_key'] } },
  { name: 'Cloudinary', type: 'cloudinary', category: 'storage', icon: 'Cloud', color: '#3448c5', config: { authType: 'credentials', requiredFields: ['cloud_name', 'api_key', 'api_secret'] } },
  
  // Automation
  { name: 'n8n', type: 'n8n', category: 'automation', icon: 'Workflow', color: '#ff6d5a', config: { authType: 'api_key', requiredFields: ['url', 'api_key'] } },
  { name: 'Zapier', type: 'zapier', category: 'automation', icon: 'Zap', color: '#ff4a00', config: { authType: 'api_key', requiredFields: ['api_key'] }, isPremium: true },
];
```

## 4. Channel Types

### Entity Structure

```typescript
// apps/backend/src/channels/infrastructure/persistence/relational/entities/channel-type.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'channel_type' })
export class ChannelTypeEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  type: string; // facebook, telegram, whatsapp, etc.

  @Column()
  name: string;

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  features: {
    supportsText: boolean;
    supportsImages: boolean;
    supportsVideos: boolean;
    supportsFiles: boolean;
    supportsButtons: boolean;
    supportsCarousels: boolean;
    supportsQuickReplies: boolean;
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Seed Data

```typescript
const channelTypes = [
  {
    type: 'facebook',
    name: 'Facebook Messenger',
    icon: 'MessageCircle',
    color: '#0084ff',
    features: {
      supportsText: true,
      supportsImages: true,
      supportsVideos: true,
      supportsFiles: true,
      supportsButtons: true,
      supportsCarousels: true,
      supportsQuickReplies: true,
    },
  },
  {
    type: 'telegram',
    name: 'Telegram',
    icon: 'Send',
    color: '#0088cc',
    features: {
      supportsText: true,
      supportsImages: true,
      supportsVideos: true,
      supportsFiles: true,
      supportsButtons: true,
      supportsCarousels: false,
      supportsQuickReplies: true,
    },
  },
  {
    type: 'whatsapp',
    name: 'WhatsApp Business',
    icon: 'MessageSquare',
    color: '#25d366',
    features: {
      supportsText: true,
      supportsImages: true,
      supportsVideos: true,
      supportsFiles: true,
      supportsButtons: true,
      supportsCarousels: false,
      supportsQuickReplies: true,
    },
  },
  {
    type: 'instagram',
    name: 'Instagram Direct',
    icon: 'Instagram',
    color: '#e4405f',
    features: {
      supportsText: true,
      supportsImages: true,
      supportsVideos: true,
      supportsFiles: false,
      supportsButtons: true,
      supportsCarousels: false,
      supportsQuickReplies: true,
    },
  },
  {
    type: 'web',
    name: 'Web Chat',
    icon: 'Globe',
    color: '#3b82f6',
    features: {
      supportsText: true,
      supportsImages: true,
      supportsVideos: true,
      supportsFiles: true,
      supportsButtons: true,
      supportsCarousels: true,
      supportsQuickReplies: true,
    },
  },
];
```

## Migration Script

Tạo một migration duy nhất cho tất cả:

```typescript
// apps/backend/src/database/migrations/XXXXXX-CreateReferenceData.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateReferenceData1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Node Types
    await queryRunner.createTable(
      new Table({
        name: 'node_type',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'label', type: 'varchar' },
          { name: 'category', type: 'varchar' },
          { name: 'icon', type: 'varchar' },
          { name: 'color', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'properties', type: 'jsonb', isNullable: true },
          { name: 'isPremium', type: 'boolean', default: false },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // AI Models
    await queryRunner.createTable(
      new Table({
        name: 'ai_model',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'name', type: 'varchar' },
          { name: 'provider', type: 'varchar' },
          { name: 'modelId', type: 'varchar', isUnique: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'maxTokens', type: 'integer', isNullable: true },
          { name: 'costPer1kTokens', type: 'decimal', precision: 10, scale: 6, isNullable: true },
          { name: 'capabilities', type: 'jsonb', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'isPremium', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Integration Types
    await queryRunner.createTable(
      new Table({
        name: 'integration_type',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'name', type: 'varchar' },
          { name: 'type', type: 'varchar', isUnique: true },
          { name: 'category', type: 'varchar' },
          { name: 'icon', type: 'varchar' },
          { name: 'color', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'config', type: 'jsonb' },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'isPremium', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Channel Types
    await queryRunner.createTable(
      new Table({
        name: 'channel_type',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'type', type: 'varchar', isUnique: true },
          { name: 'name', type: 'varchar' },
          { name: 'icon', type: 'varchar' },
          { name: 'color', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'features', type: 'jsonb' },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('channel_type');
    await queryRunner.dropTable('integration_type');
    await queryRunner.dropTable('ai_model');
    await queryRunner.dropTable('node_type');
  }
}
```

## Summary

Sau khi tạo xong tất cả:

```bash
# Run migration
npm run migration:run

# Run seeds
npm run seed:run:relational
```

Bạn sẽ có:
- ✅ 15+ node types
- ✅ 8+ AI models
- ✅ 12+ integration types
- ✅ 5+ channel types
- ✅ 31 permissions
- ✅ 2 roles (with Casdoor mapping)

Tất cả data này sẽ được lưu trong database và frontend có thể fetch qua API!
