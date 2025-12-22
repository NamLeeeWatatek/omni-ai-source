import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { WorkspaceOwnedEntity } from '../../../../../utils/workspace-owned.entity';
import { ChannelCredentialEntity } from './channel-credential.entity';
import { EncryptionTransformer } from '../../../../../utils/transformers/encryption.transformer';

@Entity({ name: 'channel_connection' })
export class ChannelConnectionEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string;

  @Index()
  @Column({ type: String })
  type: string;

  @Index()
  @Column({ name: 'credential_id', type: 'uuid', nullable: true })
  credentialId?: string | null;

  @ManyToOne(() => ChannelCredentialEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'credential_id' })
  credential?: ChannelCredentialEntity | null;

  @Index()
  @Column({ type: 'uuid', nullable: true, name: 'bot_id' })
  botId?: string | null;

  @Column({
    type: String,
    nullable: true,
    transformer: new EncryptionTransformer(),
  })
  accessToken?: string | null;

  @Column({
    type: String,
    nullable: true,
    transformer: new EncryptionTransformer(),
  })
  refreshToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata?: Record<string, any>;

  @Column({ type: String, default: 'active' })
  status: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'connected_at',
  })
  connectedAt: Date;
}
