import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
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
  icon: string; // Icon name (e.g., 'Webhook', 'Globe', 'Bot')

  @Column()
  color: string; // Hex color (e.g., '#10b981')

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  properties: NodeProperty[]; // Configuration fields for this node type

  @Column({ default: false })
  isPremium: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // For ordering in UI

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Type definition for node properties
export interface NodeProperty {
  name: string;
  label: string;
  type:
    | 'text'
    | 'url'
    | 'textarea'
    | 'json'
    | 'select'
    | 'boolean'
    | 'number'
    | 'file'
    | 'image'
    | 'key-value'
    | 'multi-select'
    | 'dynamic-form';
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: Array<{ value: string; label: string } | string>;
  default?: any;
  showWhen?: Record<string, any>;
  accept?: string; // For file/image upload
  multiple?: boolean;
}
