import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { TemplateFormSchemaEntity } from './template-form-schema.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { WorkspaceEntity } from '../../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity('template_executions')
export class TemplateExecutionEntity extends EntityRelationalHelper {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => TemplateFormSchemaEntity)
    @JoinColumn({ name: 'templateSchemaId' })
    templateSchema: TemplateFormSchemaEntity;

    @Column({ type: 'uuid' })
    templateSchemaId: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => WorkspaceEntity)
    @JoinColumn({ name: 'workspaceId' })
    workspace: WorkspaceEntity;

    @Column({ type: 'uuid' })
    workspaceId: string;

    @Column({ type: 'jsonb' })
    inputData: any;

    @Column({ type: 'varchar', length: 50, default: 'pending' })
    status: string; // pending, processing, completed, failed

    @Column({ type: 'int', default: 0 })
    progress: number;

    @Column({ type: 'jsonb', nullable: true })
    resultData?: any;

    @Column({ type: 'text', nullable: true })
    errorMessage?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    externalExecutionId?: string;

    @Column({ type: 'jsonb', nullable: true })
    webhookResponse?: any;

    @CreateDateColumn()
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedAt?: Date;

    @CreateDateColumn()
    createdAt: Date;
}
