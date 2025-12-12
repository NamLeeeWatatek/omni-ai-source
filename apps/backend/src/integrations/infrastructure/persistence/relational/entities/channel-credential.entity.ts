import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'channel_credential' })
export class ChannelCredentialEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: String })
  provider: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  workspaceId?: string | null;

  @Column({ type: String, nullable: true })
  name?: string | null;

  @Column({ type: String, nullable: true })
  clientId?: string | null;

  @Column({ type: String, nullable: true })
  clientSecret?: string | null;

  @Column({ type: String, nullable: true })
  scopes?: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
