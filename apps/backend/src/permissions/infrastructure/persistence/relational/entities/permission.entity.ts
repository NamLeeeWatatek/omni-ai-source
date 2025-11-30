import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { RoleEntity } from '../../../../../roles/infrastructure/persistence/relational/entities/role.entity';

@Entity({ name: 'permission' })
export class PermissionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // Format: "resource:action" (e.g., "flow:create")

  @Column({ nullable: true })
  description: string;

  @Column()
  resource: string; // flow, bot, user, channel, etc.

  @Column()
  action: string; // create, read, update, delete, execute

  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles: RoleEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
