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
  id: string;

  @Column()
  label: string;

  @Column()
  category: string;

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  properties: NodeProperty[];

  @Column({ default: false })
  isPremium: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

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
  accept?: string;
  multiple?: boolean;
}
