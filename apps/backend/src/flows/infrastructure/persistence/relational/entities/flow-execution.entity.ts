import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { NodeExecutionEntity } from './node-execution.entity';

@Entity({ name: 'flow_execution' })
export class FlowExecutionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: String, unique: true })
  executionId: string;

  @Index()
  @Column({ type: 'uuid' })
  flowId: string;

  @Column({ type: String })
  status: string;

  @Column({ type: 'bigint' })
  startTime: number;

  @Column({ type: 'bigint', nullable: true })
  endTime?: number | null;

  @Column({ type: 'jsonb', nullable: true })
  result?: Record<string, any> | null;

  @Column({ type: String, nullable: true })
  error?: string | null;

  @Column({ type: 'uuid', nullable: true })
  workspaceId?: string | null;

  @OneToMany(() => NodeExecutionEntity, (node) => node.execution, {
    cascade: true,
  })
  nodeExecutions?: NodeExecutionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
