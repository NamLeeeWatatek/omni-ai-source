import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { FlowExecutionEntity } from './flow-execution.entity';

@Entity({ name: 'execution_artifact' })
export class ExecutionArtifactEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  executionId: string;

  @Column({ type: 'uuid' })
  fileId: string;

  @Column({ type: String })
  artifactType: 'image' | 'video' | 'audio' | 'document' | 'text' | 'other';

  @Column({ type: String })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'bigint', nullable: true })
  size?: number; // File size in bytes

  @Column({ type: String, nullable: true })
  mimeType?: string;

  @ManyToOne(() => FlowExecutionEntity, (execution) => execution.artifacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'executionId' })
  execution?: FlowExecutionEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
