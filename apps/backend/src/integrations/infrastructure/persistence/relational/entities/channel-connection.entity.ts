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

/**
 * Stores actual connected channel instances (e.g., specific Facebook pages)
 * Each connection uses credentials from ChannelCredentialEntity
 */
@Entity({ name: 'channel_connection' })
export class ChannelConnectionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string; // User-friendly name

  @Index()
  @Column({ type: String })
  type: string; // facebook, messenger, instagram, etc.

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
  accessToken?: string | null; // Should be encrypted in production

  @Column({ type: String, nullable: true })
  refreshToken?: string | null; // Should be encrypted in production

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata?: Record<string, any>; // Channel-specific data (page ID, etc.)

  @Column({ type: String, default: 'active' })
  status: string; // active, expired, error

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  connectedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
