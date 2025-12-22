import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkspaceOwnedEntity } from '../../../../../utils/workspace-owned.entity';
import { NodeExecutionEntity } from './node-execution.entity';
import { ExecutionArtifactEntity } from './execution-artifact.entity';

@Entity({ name: 'flow_execution' })
export class FlowExecutionEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: String, unique: true })
  executionId: string;

  @Index()
  @Column({ name: 'flow_id', type: 'uuid', nullable: false })
  flowId: string;

  @ManyToOne('FlowEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flow_id' })
  flow?: any;

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

  @Index()
  @Column({ name: 'workspace_id', type: 'uuid', nullable: false })
  workspaceId: string;

  @ManyToOne('WorkspaceEntity', { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'workspace_id' })
  workspace: any;

  @OneToMany(() => NodeExecutionEntity, (node) => node.execution, {
    cascade: true,
  })
  nodeExecutions?: NodeExecutionEntity[];

  @OneToMany(() => ExecutionArtifactEntity, (artifact) => artifact.execution, {
    cascade: true,
  })
  artifacts?: ExecutionArtifactEntity[];
}
