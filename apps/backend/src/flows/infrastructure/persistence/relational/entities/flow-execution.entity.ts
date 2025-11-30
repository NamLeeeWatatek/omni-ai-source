import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { NodeExecutionEntity } from './node-execution.entity';

/**
 * Stores flow execution history
 */
@Entity({ name: 'flow_execution' })
export class FlowExecutionEntity extends EntityRelationalHelper {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: String, unique: true })
    executionId: string; // exec-timestamp-random

    @Index()
    @Column({ type: 'int' })
    flowId: number;

    @Column({ type: String })
    status: string; // running, completed, failed

    @Column({ type: 'bigint' })
    startTime: number;

    @Column({ type: 'bigint', nullable: true })
    endTime?: number | null;

    @Column({ type: 'jsonb', nullable: true })
    result?: Record<string, any> | null;

    @Column({ type: String, nullable: true })
    error?: string | null;

    @Column({ type: 'int', nullable: true })
    workspaceId?: number | null;

    @OneToMany(() => NodeExecutionEntity, (node) => node.execution, {
        cascade: true,
    })
    nodeExecutions?: NodeExecutionEntity[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
