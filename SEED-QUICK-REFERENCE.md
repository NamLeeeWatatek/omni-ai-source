# Seed Data - Quick Reference

## 🚀 Quick Start

```bash
# Chạy tất cả seeds
cd apps/backend
npm run seed:run:relational
```

## 📦 Seed Data Available

| Type | Count | File |
|------|-------|------|
| **Permissions** | 60+ | `permission/permission-seed.service.ts` |
| **Node Types** | 12 | `node-type/node-type-seed.service.ts` |
| **Integrations** | 12 | `integration/integration-seed.service.ts` |
| **Roles** | 2 | `role/role-seed.service.ts` |
| **Statuses** | 2 | `status/status-seed.service.ts` |

## 🎯 Permissions Format

```
resource:action
```

**Examples:**
- `flow:create` - Create flows
- `bot:read` - View bots
- `user:delete` - Delete users

**Resources:**
- flow, bot, channel, template
- integration, user, workspace, settings

**Actions:**
- create, read, update, delete, execute

## 🔧 Node Types Categories

| Category | Node Types |
|----------|------------|
| **trigger** | Webhook, Schedule |
| **action** | HTTP Request, Send Email |
| **ai** | OpenAI Chat, Google AI |
| **data** | Filter, Transform |
| **integration** | Facebook Messenger, Telegram |

## 🔌 Integrations

**Messaging:**
- Facebook Messenger, Telegram, WhatsApp, Instagram

**AI:**
- OpenAI, Google AI, Anthropic Claude

**Storage:**
- Supabase, Qdrant, Cloudinary

**Automation:**
- n8n

**Email:**
- SMTP

## 📝 Add New Seed

```typescript
// 1. Create folder
mkdir apps/backend/src/database/seeds/relational/my-seed

// 2. Create service
// my-seed-seed.service.ts
@Injectable()
export class MySeedSeedService {
  constructor(
    @InjectRepository(MyEntity)
    private repository: Repository<MyEntity>,
  ) {}

  async run() {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];

    for (const item of items) {
      const exists = await this.repository.findOne({
        where: { id: item.id },
      });

      if (!exists) {
        await this.repository.save(this.repository.create(item));
      }
    }

    console.log(`✅ Seeded ${items.length} items`);
  }
}

// 3. Create module
// my-seed-seed.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([MyEntity])],
  providers: [MySeedSeedService],
  exports: [MySeedSeedService],
})
export class MySeedSeedModule {}

// 4. Add to seed.module.ts
import { MySeedSeedModule } from './my-seed/my-seed-seed.module';

@Module({
  imports: [
    // ...
    MySeedSeedModule,
  ],
})

// 5. Add to run-seed.ts
import { MySeedSeedService } from './my-seed/my-seed-seed.service';

await app.get(MySeedSeedService).run();
```

## 🔄 Frontend Usage

```typescript
// Get node types
const nodeTypes = await fetchNodeTypes()

// Get integrations
const integrations = await axiosClient.get('/integrations/')

// Get permissions
const permissions = await axiosClient.get('/permissions/me/capabilities')
```

## ⚠️ Important

- ✅ Seeds check existence before insert
- ✅ Safe to run multiple times
- ✅ No hardcoded data in code
- ✅ All data in database
- ❌ Don't seed user-generated data
- ❌ Don't seed sensitive data

## 🐛 Troubleshooting

```bash
# Entity not found
# → Create entity first

# Duplicate key
# → Add existence check

# Cannot connect
# → Check database running
# → Check .env config
```

## 📚 Full Guide

See `SEED-DATA-GUIDE.md` for detailed documentation.
