import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';

@Entity({ name: 'template' })
export class TemplateEntity extends EntityRelationalHelper {
  @PrimaryColumn({ type: String })
  id: string;

  @Column({ type: String })
  name: string;

  @Column({ type: String })
  description: string;

  @Column({ type: String })
  category: string;

  @Column({ type: String, nullable: true })
  thumbnail?: string | null;

  @Column({ type: 'simple-array' })
  tags: string[];

  @Column({ type: Boolean, default: false })
  isPremium: boolean;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'jsonb' })
  nodes: any[];

  @Column({ type: 'jsonb' })
  edges: any[];

  @Column({ type: Boolean, default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
