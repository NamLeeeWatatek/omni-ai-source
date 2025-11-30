# Database Seed Data Guide

## Tổng quan

Hệ thống seed data giúp bạn khởi tạo dữ liệu cơ bản cho database mà **không cần hardcode** trong code. Tất cả data được lưu trong database và có thể quản lý qua API.

## Cấu trúc Seed Data

```
apps/backend/src/database/seeds/relational/
├── role/                    # Roles (Admin, User)
├── status/                  # User statuses (Active, Inactive)
├── permission/              # ✨ NEW: Permissions (flow:create, bot:read, etc.)
├── node-type/               # ✨ NEW: Node types (Webhook, HTTP Request, etc.)
├── integration/             # ✨ NEW: Available integrations (Facebook, Telegram, etc.)
├── user/                    # Default users
├── seed.module.ts           # Module configuration
└── run-seed.ts              # Seed runner script
```

## Seed Data Đã Tạo

### 1. ✅ Permissions (60+ permissions)

**File:** `permission/permission-seed.service.ts`

**Permissions được tạo:**
- **Flow:** create, read, update, delete, execute
- **Bot:** create, read, update, delete
- **Channel:** create, read, update, delete
- **Template:** create, read, update, delete
- **Integration:** create, read, update, delete
- **User:** create, read, update, delete
- **Workspace:** create, read, update, delete
- **Settings:** read, update

**Format:** `resource:action` (ví dụ: `flow:create`, `bot:read`)

### 2. ✅ Node Types (12 node types)

**File:** `node-type/node-type-seed.service.ts`

**Categories:**
- **Trigger:** Webhook, Schedule
- **Action:** HTTP Request, Send Email
- **AI:** OpenAI Chat, Google AI (Premium)
- **Data:** Filter, Transform
- **Integration:** Facebook Messenger, Telegram

**Mỗi node type có:**
- ID, label, category
- Icon, color
- Description
- Properties (configuration fields)
- isPremium flag

### 3. ✅ Integrations (12 integrations)

**File:** `integration/integration-seed.service.ts`

**Messaging:**
- Facebook Messenger
- Telegram
- WhatsApp Business
- Instagram

**AI Services:**
- OpenAI
- Google AI (Gemini)
- Anthropic Claude

**Storage & Database:**
- Supabase
- Qdrant
- Cloudinary

**Automation:**
- n8n

**Email:**
- SMTP Email

**Mỗi integration có:**
- Name, type, icon, color
- Description
- Auth type (oauth, api_key, token, credentials)
- Required fields

## Cách Chạy Seed

### 1. Chạy tất cả seeds

```bash
cd apps/backend
npm run seed:run:relational
```

Output:
```
🌱 Starting database seeding...

📝 Seeding roles...
✅ Seeded 2 roles

📝 Seeding statuses...
✅ Seeded statuses

📝 Seeding permissions...
✅ Seeded 60 permissions

📝 Seeding node types...
✅ Seeded 12 node types

📝 Seeding integrations...
✅ Seeded 12 integrations

📝 Seeding users...
✅ Seeded users

✅ Database seeding completed!
```

### 2. Seed sẽ tự động:
- ✅ Check xem data đã tồn tại chưa
- ✅ Chỉ insert data mới (không duplicate)
- ✅ Có thể chạy nhiều lần an toàn

## Cách Sử dụng Seed Data

### Frontend gọi API để lấy data:

```typescript
// Get all node types
const nodeTypes = await fetchNodeTypes()

// Get all integrations
const integrations = await axiosClient.get('/integrations/')

// Get user permissions
const permissions = await axiosClient.get('/permissions/me/capabilities')
```

### Backend trả về data từ database:

```typescript
// Node Types Controller
@Get()
async findAll() {
  return this.nodeTypesService.findAll()
}

// Integrations Controller
@Get()
async findAll() {
  return this.integrationsService.findAll()
}
```

## Cách Thêm Seed Data Mới

### Ví dụ: Thêm AI Models

**1. Tạo folder:**
```bash
mkdir apps/backend/src/database/seeds/relational/ai-model
```

**2. Tạo service:**
```typescript
// ai-model-seed.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiModelEntity } from '../../../../ai/infrastructure/persistence/relational/entities/ai-model.entity';

@Injectable()
export class AiModelSeedService {
  constructor(
    @InjectRepository(AiModelEntity)
    private repository: Repository<AiModelEntity>,
  ) {}

  async run() {
    const models = [
      {
        name: 'GPT-4',
        provider: 'openai',
        modelId: 'gpt-4',
        description: 'Most capable GPT-4 model',
        maxTokens: 8192,
        costPer1kTokens: 0.03,
      },
      {
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        description: 'Fast and efficient',
        maxTokens: 4096,
        costPer1kTokens: 0.002,
      },
      {
        name: 'Gemini Pro',
        provider: 'google',
        modelId: 'gemini-pro',
        description: 'Google\'s most capable model',
        maxTokens: 32768,
        costPer1kTokens: 0.00025,
      },
    ];

    for (const model of models) {
      const exists = await this.repository.findOne({
        where: { modelId: model.modelId },
      });

      if (!exists) {
        await this.repository.save(this.repository.create(model));
      }
    }

    console.log(`✅ Seeded ${models.length} AI models`);
  }
}
```

**3. Tạo module:**
```typescript
// ai-model-seed.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModelSeedService } from './ai-model-seed.service';
import { AiModelEntity } from '../../../../ai/infrastructure/persistence/relational/entities/ai-model.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiModelEntity])],
  providers: [AiModelSeedService],
  exports: [AiModelSeedService],
})
export class AiModelSeedModule {}
```

**4. Update seed.module.ts:**
```typescript
import { AiModelSeedModule } from './ai-model/ai-model-seed.module';

@Module({
  imports: [
    // ... existing modules
    AiModelSeedModule,
    // ...
  ],
})
```

**5. Update run-seed.ts:**
```typescript
import { AiModelSeedService } from './ai-model/ai-model-seed.service';

const runSeed = async () => {
  // ... existing seeds
  
  console.log('📝 Seeding AI models...');
  await app.get(AiModelSeedService).run();
  
  // ...
};
```

## Cách Update Seed Data

### Option 1: Update trong seed file

```typescript
// Thay đổi data trong seed service
const nodeTypes = [
  {
    id: 'webhook',
    label: 'Webhook', // Changed label
    // ... other fields
  },
];

// Chạy lại seed
npm run seed:run:relational
```

### Option 2: Update qua API

```typescript
// Frontend hoặc admin panel
await axiosClient.patch('/node-types/webhook', {
  label: 'New Webhook Label',
  description: 'Updated description',
})
```

### Option 3: Update trực tiếp database

```sql
UPDATE node_types 
SET label = 'New Webhook Label' 
WHERE id = 'webhook';
```

## Best Practices

### ✅ DO:
- Dùng seed data cho **reference data** (node types, integrations, permissions)
- Dùng seed data cho **default configuration**
- Check existence trước khi insert
- Log kết quả seed rõ ràng

### ❌ DON'T:
- Hardcode data trong code
- Seed user-generated data (flows, bots của user)
- Seed sensitive data (passwords, API keys)
- Overwrite existing data without checking

## Troubleshooting

### Lỗi: "Entity not found"

**Nguyên nhân:** Entity chưa được tạo

**Fix:**
1. Tạo entity trong `src/{module}/infrastructure/persistence/relational/entities/`
2. Add entity vào `TypeOrmModule.forFeature([YourEntity])`

### Lỗi: "Duplicate key"

**Nguyên nhân:** Seed đang cố insert data đã tồn tại

**Fix:**
```typescript
// Thêm check existence
const exists = await this.repository.findOne({
  where: { id: item.id },
});

if (!exists) {
  await this.repository.save(this.repository.create(item));
}
```

### Lỗi: "Cannot connect to database"

**Nguyên nhân:** Database chưa chạy hoặc config sai

**Fix:**
1. Check database đang chạy
2. Check `.env` file có đúng config không
3. Check `DATABASE_TYPE`, `DATABASE_HOST`, `DATABASE_PORT`

## Migration vs Seed

### Migration:
- Thay đổi **schema** (tables, columns, indexes)
- Chạy tự động khi deploy
- Không thể rollback dễ dàng

### Seed:
- Thêm **data** vào tables
- Chạy manual hoặc trong setup
- Có thể chạy lại nhiều lần

## Next Steps

1. ✅ Chạy seed: `npm run seed:run:relational`
2. ✅ Verify data trong database
3. ✅ Test API endpoints
4. ✅ Update frontend để fetch data từ API
5. ✅ Thêm seed data mới nếu cần

## Summary

- ✅ **Không hardcode** - Tất cả data trong database
- ✅ **Dễ quản lý** - Update qua API hoặc seed file
- ✅ **Scalable** - Thêm seed mới dễ dàng
- ✅ **Safe** - Check existence, không duplicate
- ✅ **Flexible** - Có thể customize cho từng environment
