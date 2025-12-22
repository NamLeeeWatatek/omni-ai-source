import {
  Column,
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NodeCategoryId, NodeProperty } from '../../../../types';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'node_type' })
export class NodeTypeEntity extends EntityRelationalHelper {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'varchar' })
  category: NodeCategoryId;

  @Column({ type: 'varchar' })
  color: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  isPremium: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isTrigger: boolean;

  @Column({ type: 'jsonb', default: [] })
  properties: NodeProperty[];

  @Column({ type: 'varchar', nullable: true })
  executor?: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  outputSchema?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'varchar', default: '1.0.0' })
  version: string;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId?: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
