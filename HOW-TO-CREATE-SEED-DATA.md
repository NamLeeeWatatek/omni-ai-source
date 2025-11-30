# How to Create Seed Data - Step by Step

## ⚠️ Important: Create Entity First!

Trước khi tạo seed data, bạn **PHẢI** tạo entity trước. Seed data cần entity để lưu vào database.

## Step-by-Step Guide

### Step 1: Create Entity

Ví dụ: Tạo Permission entity

```bash
# 1. Tạo folder structure
mkdir -p apps/backend/src/permissions/infrastructure/persistence/relational/entities
```

```typescript
// apps/backend/src/permissions/infrastructure/persistence/relational/entities/permission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'permission' })
export class PermissionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  resource: string;

  @Column()
  action: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Step 2: Create Migration

```bash
cd apps/backend
npm run migration:generate -- src/database/migrations/CreatePermission
```

### Step 3: Run Migration

```bash
npm run migration:run
```

### Step 4: Create Seed Service

```bash
mkdir -p apps/backend/src/database/seeds/relational/permission
```

```typescript
// permission-seed.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionEntity } from '../../../../permissions/infrastructure/persistence/relational/entities/permission.entity';

@Injectable()
export class PermissionSeedService {
  constructor(
    @InjectRepository(PermissionEntity)
    private repository: Repository<PermissionEntity>,
  ) {}

  async run() {
    const permissions = [
      { name: 'flow:create', description: 'Create flows', resource: 'flow', action: 'create' },
      { name: 'flow:read', description: 'View flows', resource: 'flow', action: 'read' },
      // ... more permissions
    ];

    for (const permission of permissions) {
      const exists = await this.repository.findOne({
        where: { name: permission.name },
      });

      if (!exists) {
        await this.repository.save(this.repository.create(permission));
      }
    }

    console.log(`✅ Seeded ${permissions.length} permissions`);
  }
}
```

### Step 5: Create Seed Module

```typescript
// permission-seed.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionSeedService } from './permission-seed.service';
import { PermissionEntity } from '../../../../permissions/infrastructure/persistence/relational/entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionEntity])],
  providers: [PermissionSeedService],
  exports: [PermissionSeedService],
})
export class PermissionSeedModule {}
```

### Step 6: Add to Seed Module

```typescript
// apps/backend/src/database/seeds/relational/seed.module.ts
import { PermissionSeedModule } from './permission/permission-seed.module';

@Module({
  imports: [
    RoleSeedModule,
    StatusSeedModule,
    UserSeedModule,
    PermissionSeedModule, // ← Add this
    // ...
  ],
})
export class SeedModule {}
```

### Step 7: Add to Run Seed

```typescript
// apps/backend/src/database/seeds/relational/run-seed.ts
import { PermissionSeedService } from './permission/permission-seed.service';

const runSeed = async () => {
  // ...
  
  console.log('📝 Seeding permissions...');
  await app.get(PermissionSeedService).run();
  
  // ...
};
```

### Step 8: Run Seed

```bash
npm run seed:run:relational
```

## Quick Reference: Entity Templates

### Simple Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'table_name' })
export class MyEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;
}
```

### Entity with Relations

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity({ name: 'table_name' })
export class MyEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
```

### Entity with JSON Column

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'table_name' })
export class MyEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;
}
```

## Common Entities to Create

### 1. Permission Entity

```typescript
@Entity({ name: 'permission' })
export class PermissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // format: "resource:action"

  @Column()
  resource: string; // flow, bot, user, etc.

  @Column()
  action: string; // create, read, update, delete

  @Column({ nullable: true })
  description: string;
}
```

### 2. Node Type Entity

```typescript
@Entity({ name: 'node_type' })
export class NodeTypeEntity {
  @Column({ primary: true })
  id: string; // webhook, http-request, etc.

  @Column()
  label: string;

  @Column()
  category: string; // trigger, action, ai, data

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  properties: any[];

  @Column({ default: false })
  isPremium: boolean;
}
```

### 3. Integration Entity

```typescript
@Entity({ name: 'integration' })
export class IntegrationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  type: string; // facebook, telegram, openai, etc.

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;
}
```

### 4. AI Model Entity

```typescript
@Entity({ name: 'ai_model' })
export class AiModelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  provider: string; // openai, google, anthropic

  @Column({ unique: true })
  modelId: string; // gpt-4, gemini-pro

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  maxTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  costPer1kTokens: number;

  @Column({ default: true })
  isActive: boolean;
}
```

## Troubleshooting

### Error: "Cannot find name 'XEntity'"

**Solution:** Create the entity file first (Step 1)

### Error: "Table doesn't exist"

**Solution:** Run migration (Step 3)

### Error: "Duplicate key"

**Solution:** Add existence check in seed service:

```typescript
const exists = await this.repository.findOne({
  where: { id: item.id },
});

if (!exists) {
  await this.repository.save(this.repository.create(item));
}
```

## Best Practices

1. ✅ Always create entity before seed
2. ✅ Run migration before seed
3. ✅ Check existence before insert
4. ✅ Use meaningful names
5. ✅ Add descriptions
6. ✅ Log seed results
7. ❌ Don't seed user-generated data
8. ❌ Don't seed sensitive data

## Next Steps

After creating entities and seeds:

1. Run seed: `npm run seed:run:relational`
2. Create API endpoints to fetch data
3. Update frontend to call APIs
4. Test the flow

See `SEED-DATA-GUIDE.md` for more details.
