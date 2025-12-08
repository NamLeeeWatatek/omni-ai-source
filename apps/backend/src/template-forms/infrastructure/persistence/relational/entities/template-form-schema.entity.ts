import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { FlowEntity } from '../../../../../flows/infrastructure/persistence/relational/entities/flow.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity('template_form_schemas')
export class TemplateFormSchemaEntity extends EntityRelationalHelper {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 50 })
    category: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    icon?: string;

    // UI Form Schema - defines input fields for users
    @Column({ type: 'jsonb' })
    formSchema: any; // FormField[]

    // Link to Flow Template that will be instantiated and executed
    @Column({ type: 'uuid' })
    flowTemplateId: string;

    @ManyToOne(() => FlowEntity, { nullable: true })
    @JoinColumn({ name: 'flowTemplateId' })
    flowTemplate?: FlowEntity;

    // Mapping from form field IDs to flow input parameters
    // Example: { "video_description": "prompt", "product_images": "images" }
    @Column({ type: 'jsonb' })
    inputMapping: Record<string, string>;

    @Column({ type: 'jsonb', nullable: true })
    uiConfig?: any;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdBy?: UserEntity;

    @Column({ type: 'uuid', nullable: true })
    createdById?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
