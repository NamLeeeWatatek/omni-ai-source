import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';

@Entity({ name: 'knowledge_documents' })
export class KnowledgeDocumentEntity extends EntityRelationalHelper {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 500 })
    @Index()
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'varchar', length: 100, default: 'manual' })
    source: string;

    @Column({ type: 'uuid', nullable: true })
    @Index()
    botId: string | null;

    @Column({
        type: 'varchar',
        length: 20,
        default: 'pending',
    })
    @Index()
    embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed';

    @Column({ type: 'text', nullable: true })
    embeddingError: string | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any> | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
