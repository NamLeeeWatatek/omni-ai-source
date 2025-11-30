import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

/**
 * Stores API credentials for channel providers (Facebook, Google, etc.)
 * One credential configuration can be used to connect multiple accounts
 */
@Entity({ name: 'channel_credential' })
export class ChannelCredentialEntity extends EntityRelationalHelper {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: String })
    provider: string; // facebook, google, omi, etc.

    @Index()
    @Column({ type: 'int', nullable: true })
    workspaceId?: number | null;

    @Column({ type: String, nullable: true })
    name?: string | null; // Display name for this config (e.g., "Production App")

    @Column({ type: String })
    clientId: string;

    @Column({ type: String })
    clientSecret: string; // Should be encrypted in production

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
