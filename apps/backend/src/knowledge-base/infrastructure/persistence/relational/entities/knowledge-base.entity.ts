import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { WorkspaceEntity } from '../../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Entity({ name: 'knowledge_base' })
export class KnowledgeBaseEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  @Index()
  workspaceId?: string | null;

  @Column({ type: String })
  name: string;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @Column({ name: 'chunk_size', type: 'int', default: 1000 })
  chunkSize: number;

  @Column({ name: 'chunk_overlap', type: 'int', default: 200 })
  chunkOverlap: number;

  @Column({
    name: 'embedding_model',
    type: String,
    default: 'text-embedding-004',
  })
  embeddingModel: string;

  @Column({ name: 'ai_provider_id', type: 'uuid', nullable: true })
  @Index()
  aiProviderId?: string | null;

  @Column({ name: 'rag_model', type: String, nullable: true })
  ragModel?: string | null;

  @Column({ name: 'similarity_threshold', type: 'float', default: 0.7 })
  similarityThreshold: number;

  @Column({ name: 'top_k', type: 'int', default: 5 })
  topK: number;

  @Column({ name: 'live_version_id', type: 'uuid', nullable: true })
  liveVersionId?: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ type: String, nullable: true })
  icon?: string | null;

  @Column({ type: String, default: '#3B82F6' })
  color: string;

  @Column({ name: 'is_public', type: Boolean, default: false })
  isPublic: boolean;

  @Column({ name: 'total_documents', type: 'int', default: 0 })
  totalDocuments: number;

  @Column({ name: 'total_size', type: 'bigint', default: '0' })
  totalSize: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[] | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  creator?: UserEntity;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: WorkspaceEntity;

  @OneToMany(() => KbFolderEntity, (folder) => folder.knowledgeBase)
  folders?: KbFolderEntity[];

  @OneToMany(() => KbDocumentEntity, (doc) => doc.knowledgeBase)
  documents?: KbDocumentEntity[];

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'kb_folder' })
export class KbFolderEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'knowledge_base_id', type: 'uuid' })
  @Index()
  knowledgeBaseId: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  @Index()
  parentId?: string | null;

  @Column({ type: String })
  name: string;

  @Column({ type: String, nullable: true })
  path?: string | null;

  @ManyToOne(() => KnowledgeBaseEntity, (kb) => kb.folders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'knowledge_base_id' })
  knowledgeBase?: KnowledgeBaseEntity;

  @ManyToOne(() => KbFolderEntity, (folder) => folder.subFolders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parentFolder?: KbFolderEntity;

  @OneToMany(() => KbFolderEntity, (folder) => folder.parentFolder)
  subFolders?: KbFolderEntity[];

  @OneToMany(() => KbDocumentEntity, (doc) => doc.folder)
  documents?: KbDocumentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'kb_document' })
export class KbDocumentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'knowledge_base_id', type: 'uuid' })
  @Index()
  knowledgeBaseId: string;

  @Column({ name: 'folder_id', type: 'uuid', nullable: true })
  @Index()
  folderId?: string | null;

  @Column({ type: String })
  title: string;

  @Column({ type: String, nullable: true })
  slug?: string | null;

  @Column({ type: String, default: 'file' })
  type: 'file' | 'url' | 'text';

  @Column({ name: 'source_url', type: String, nullable: true })
  sourceUrl?: string | null;

  @Column({ name: 'file_url', type: String, nullable: true })
  fileUrl?: string | null;

  @Column({ name: 'file_type', type: String, nullable: true })
  fileType?: string | null;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize?: string | null;

  @Column({ name: 'current_version_id', type: 'uuid', nullable: true })
  currentVersionId?: string | null;

  @Column({ type: String, default: 'pending' })
  @Index()
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ type: String, nullable: true })
  name?: string | null;

  @Column({ type: 'text', nullable: true })
  content?: string | null;

  @Column({ name: 'mime_type', type: String, nullable: true })
  mimeType?: string | null;

  @Column({ name: 'processing_status', type: String, nullable: true })
  processingStatus?: string | null;

  @Column({ name: 'processing_error', type: 'text', nullable: true })
  processingError?: string | null;

  @Column({ name: 'chunk_count', type: 'int', default: 0 })
  chunkCount: number;

  @ManyToOne(() => KnowledgeBaseEntity, (kb) => kb.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'knowledge_base_id' })
  knowledgeBase?: KnowledgeBaseEntity;

  @ManyToOne(() => KbFolderEntity, (folder) => folder.documents, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'folder_id' })
  folder?: KbFolderEntity;

  @OneToMany(() => KbDocumentVersionEntity, (version) => version.document)
  versions?: KbDocumentVersionEntity[];

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  creator?: UserEntity;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'kb_document_version' })
@Index(['documentId', 'version'], { unique: true })
export class KbDocumentVersionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'document_id', type: 'uuid' })
  @Index()
  documentId: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ name: 'version_label', type: String, nullable: true })
  versionLabel?: string | null;

  @Column({ name: 'content_text', type: 'text', nullable: true })
  contentText?: string | null;

  @Column({ name: 'content_html', type: 'text', nullable: true })
  contentHtml?: string | null;

  @Column({ name: 'token_count', type: 'int', default: 0 })
  tokenCount: number;

  @Column({ name: 'chunk_count', type: 'int', default: 0 })
  chunkCount: number;

  @Column({ type: String, default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ name: 'is_live', type: Boolean, default: false })
  isLive: boolean;

  @Column({ name: 'qdrant_collection', type: String, nullable: true })
  qdrantCollection?: string | null;

  @Column({ name: 'embedding_model', type: String, nullable: true })
  embeddingModel?: string | null;

  @Column({ name: 'processing_started_at', type: 'timestamp', nullable: true })
  processingStartedAt?: Date | null;

  @Column({
    name: 'processing_completed_at',
    type: 'timestamp',
    nullable: true,
  })
  processingCompletedAt?: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => KbDocumentEntity, (doc) => doc.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_id' })
  document?: KbDocumentEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  creator?: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'rag_feedback' })
export class RagFeedbackEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id', type: 'uuid' })
  @Index()
  messageId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  creator?: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

export const KnowledgeBaseFolderEntity = KbFolderEntity;
export const KnowledgeBaseDocumentEntity = KbDocumentEntity;
export const AgentKnowledgeBaseEntity = RagFeedbackEntity;
