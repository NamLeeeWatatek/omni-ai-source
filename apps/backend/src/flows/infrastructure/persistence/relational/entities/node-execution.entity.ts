import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { FlowExecutionEntity } from './flow-execution.entity';

/**
 * Stores individual node execution details
 */
@Entity({ name: 'node_execution' })
export class NodeExecutionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  executionId: string;

  @ManyToOne(
    () => FlowExecutionEntity,
    (execution) => execution.nodeExecutions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'executionId' })
  execution?: FlowExecutionEntity;

  @Column({ type: String })
  nodeId: string;

  @Column({ type: String })
  nodeName: string;

  @Column({ type: String })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  input?: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  output?: Record<string, any> | null;

  @Column({ type: String, nullable: true })
  error?: string | null;

  @Column({ type: 'bigint' })
  startTime: number;

  @Column({ type: 'bigint', nullable: true })
  endTime?: number | null;

  @Column({ type: String })
  status: string; // pending, running, success, error

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
