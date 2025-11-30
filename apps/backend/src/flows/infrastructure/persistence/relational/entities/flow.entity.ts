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

  @Column({ type: String, nullable: true })
  templateId?: string | null;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, any>;

  @Column({ type: String, nullable: true })
  userId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  channelId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  ownerId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  teamId?: string | null;

  @Column({ type: String, default: 'private' })
  visibility: string;

  @ManyToOne(() => UserEntity)
  owner?: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
