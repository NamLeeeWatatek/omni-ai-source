import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FlowEntity } from './flow.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity('flow_version')
export class FlowVersionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  bot_id: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Column({ type: 'jsonb' })
  flow: any;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'uuid' })
  flowId: string;

  @ManyToOne(() => FlowEntity, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'flowId' })
  flowEntity: FlowEntity;

  @Column({ type: 'jsonb' })
  data: any;

  @Column({ type: 'int' })
  versionNumber: number;

  @CreateDateColumn()
  createdAt: Date;
}
