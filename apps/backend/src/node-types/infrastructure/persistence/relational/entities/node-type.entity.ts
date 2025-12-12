import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NodeCategoryId, NodeProperty } from '../../../../types';

@Entity({ name: 'node_type' })
export class NodeTypeEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'varchar' })
  category: NodeCategoryId;

  @Column({ type: 'varchar' })
  icon: string;

  @Column({ type: 'varchar' })
  color: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: [] })
  properties: NodeProperty[];

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  outputSchema?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
