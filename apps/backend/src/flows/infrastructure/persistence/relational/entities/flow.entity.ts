import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity({ name: 'flow' })
export class FlowEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @Column({ type: String, default: 'draft' })
  status: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  // Nodes + Edges (core workflow data)
  @Column({ type: 'jsonb', default: { nodes: [], edges: [] } })
  nodes: Array<{
    id: string;
    type: string; // Reference to NodeType.id
    position: { x: number; y: number };
    data?: Record<string, any>; // User input data for this node instance
  }>;

  @Column({ type: 'jsonb', default: [] })
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;

  @Column({ type: 'uuid', nullable: true })
  ownerId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  teamId?: string | null;

  @Column({ type: String, default: 'private' })
  visibility: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[] | null;

  @Column({ type: String, nullable: true })
  category?: string | null;

  @Column({ type: String, nullable: true })
  icon?: string | null;

  @ManyToOne(() => UserEntity)
  owner?: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
