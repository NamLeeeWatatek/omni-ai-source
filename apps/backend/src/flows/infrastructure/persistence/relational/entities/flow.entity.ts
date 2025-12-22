import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { WorkspaceOwnedEntity } from 'src/utils/workspace-owned.entity';
import { NodeProperty } from 'src/node-types/types';

@Entity({ name: 'flow' })
export class FlowEntity extends WorkspaceOwnedEntity {
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

  @Column({ type: 'jsonb', default: [] })
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data?: Record<string, any>;
  }>;

  @Column({ type: 'jsonb', default: [] })
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  inputs?: NodeProperty[];

  @Column({ type: 'jsonb', nullable: true, default: {} })
  outputSchema?: Record<string, any>;

  @Column({ type: String, default: 'private' })
  visibility: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[] | null;

  @Column({ type: String, nullable: true })
  category?: string | null;

  @Column({ type: String, nullable: true })
  icon?: string | null;

  @Column({ type: 'uuid', nullable: true })
  ownerId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  teamId?: string | null;
}
