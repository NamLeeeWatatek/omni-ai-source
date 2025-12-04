import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import { KbDocumentEntity } from './knowledge-base.entity';

@Entity({ name: 'kb_chunk' })
export class KBChunkEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'document_id', type: 'uuid' })
  @Index()
  documentId: string;

  @Column({ name: 'knowledge_base_id', type: 'uuid' })
  @Index()
  knowledgeBaseId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex: number;

  @Column({ name: 'start_char', type: 'int' })
  startChar: number;

  @Column({ name: 'end_char', type: 'int' })
  endChar: number;

  @Column({ name: 'token_count', type: 'int', nullable: true })
  tokenCount?: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @Column({ name: 'vector_id', type: String, nullable: true })
  @Index()
  vectorId?: string | null;

  @Column({ name: 'embedding_status', type: String, default: 'pending' })
  @Index()
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ name: 'embedding_error', type: 'text', nullable: true })
  embeddingError?: string | null;

  @ManyToOne(() => KbDocumentEntity, { onDelete: 'CASCADE' })
  document?: KbDocumentEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
