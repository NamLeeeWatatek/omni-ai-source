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
import { ChannelCredentialEntity } from './channel-credential.entity';

@Entity({ name: 'channel_connection' })
export class ChannelConnectionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string;

  @Index()
  @Column({ type: String })
  type: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  credentialId?: string | null;

  @ManyToOne(() => ChannelCredentialEntity, { nullable: true })
  @JoinColumn({ name: 'credentialId' })
  credential?: ChannelCredentialEntity | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  workspaceId?: string | null;

  @Column({ type: String, nullable: true })
  accessToken?: string | null;

  @Column({ type: String, nullable: true })
  refreshToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata?: Record<string, any>;

  @Column({ type: String, default: 'active' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  connectedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
