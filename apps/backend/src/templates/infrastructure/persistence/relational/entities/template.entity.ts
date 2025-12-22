import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'template' })
export class TemplateEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  @Index()
  name: string;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @Column({ type: 'text', nullable: true })
  prompt?: string | null;

  @Column({ name: 'media_files', type: 'jsonb', nullable: true })
  mediaFiles?: string[] | null;

  @Column({ name: 'style_config', type: 'jsonb', nullable: true })
  styleConfig?: Record<string, any> | null;

  @Column({ type: String, nullable: true })
  @Index()
  category?: string | null;

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  @Column({ name: 'created_by', type: String, nullable: true })
  @Index()
  createdBy?: string | null;

  @Column({ name: 'workspace_id', type: String, nullable: true })
  @Index()
  workspaceId?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;
}
