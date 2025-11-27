# Quy chuẩn đặt tên File và Component

## 📋 Tổng quan vấn đề hiện tại

Sau khi kiểm tra source code, phát hiện các vấn đề về đặt tên:

### ❌ Vấn đề Backend (Python/FastAPI)
1. **API routes không nhất quán**:
   - Có file trong `api/v1/` (snake_case): `agent_configs.py`, `ai_models.py`, `ai_suggest.py`
   - Có file trong `api/v1/endpoints/` (snake_case): `ai_config.py`, `ai_conversations.py`
   - **Vấn đề**: Không rõ tiêu chí phân chia giữa 2 thư mục

2. **Models đặt tên đúng** (snake_case): ✅
   - `agent_config.py`, `ai_conversation.py`, `flow_template.py`

3. **Services đặt tên đúng** (snake_case): ✅
   - `bot_executor.py`, `flow_executor.py`

### ❌ Vấn đề Frontend (Next.js/React)
1. **Components không nhất quán**:
   - PascalCase: `AgentConfigPanel.tsx`, `MediaUploader.tsx`, `TemplateSelector.tsx` ✅
   - kebab-case: `ai-suggest-button.tsx`, `custom-nodes.tsx` ✅
   - kebab-case: `execution-status-badge.tsx`, `workflow-card.tsx` ✅
   - **Vấn đề**: Cả 2 convention đều được dùng lẫn lộn

2. **Thư mục components không có cấu trúc rõ ràng**:
   ```
   components/
   ├── agent/              (có 1 file)
   ├── ai/                 (có 1 file)
   ├── flow-builder/       (có 2 files)
   ├── workflow/           (có 7 files)
   ├── workflows/          (có 7 files)  ← Trùng tên với workflow
   └── ai-suggest-workflow.tsx  ← File lẻ ngoài folder
   ```

3. **Lib/API không nhất quán**:
   - `lib/api.ts` và `lib/api/nodeTypes.ts` - cấu trúc lộn xộn

---

## ✅ Quy chuẩn đề xuất

### Backend (Python/FastAPI)

#### 1. File và Module
- **Convention**: `snake_case` (chuẩn Python PEP 8)
- **Ví dụ**: `user_service.py`, `flow_executor.py`, `ai_conversation.py`

#### 2. Cấu trúc API Routes
```
app/api/v1/
├── __init__.py
├── auth.py              # Authentication routes
├── users.py             # User management
├── flows.py             # Flow CRUD
├── executions.py        # Execution management
├── bots.py              # Bot management
├── integrations.py      # Integration management
├── media.py             # Media upload
├── webhooks.py          # Webhook handlers
└── ai/                  # AI-related endpoints (nhóm lại)
    ├── __init__.py
    ├── suggestions.py   # AI suggestions
    ├── conversations.py # AI conversations
    ├── models.py        # AI model configs
    └── configs.py       # AI agent configs
```

**Nguyên tắc**:
- Mỗi file = 1 resource chính (users, flows, bots...)
- Nhóm các endpoint liên quan vào subfolder nếu > 3 files
- Không tạo folder `endpoints/` riêng - gây nhầm lẫn

#### 3. Models
```python
# ✅ Đúng
app/models/
├── user.py              # class User
├── flow.py              # class Flow
├── flow_template.py     # class FlowTemplate
├── ai_conversation.py   # class AIConversation
└── agent_config.py      # class AgentConfig
```

#### 4. Services
```python
# ✅ Đúng
app/services/
├── flow_executor.py     # FlowExecutor class
├── bot_executor.py      # BotExecutor class
├── gemini.py            # GeminiService class
└── cloudinary.py        # CloudinaryService class
```

---

### Frontend (Next.js/React/TypeScript)

#### 1. Components
**Convention**: `kebab-case.tsx` (chuẩn Next.js App Router)

**Lý do**:
- Next.js App Router khuyến nghị kebab-case
- Dễ đọc, tránh conflict với class names
- Nhất quán với routing (URL-friendly)

```
components/
├── ui/                          # Shared UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── modal.tsx
│   └── card.tsx
│
├── layout/                      # Layout components
│   ├── sidebar.tsx
│   ├── header.tsx
│   └── footer.tsx
│
├── features/                    # Feature-specific components
│   ├── workflow/
│   │   ├── workflow-card.tsx
│   │   ├── workflow-stats.tsx
│   │   ├── node-palette.tsx
│   │   ├── node-properties.tsx
│   │   └── custom-node.tsx
│   │
│   ├── flow-builder/
│   │   ├── flow-canvas.tsx
│   │   ├── ai-suggest-button.tsx
│   │   └── dynamic-form-field.tsx
│   │
│   ├── execution/
│   │   ├── execution-status-badge.tsx
│   │   ├── execution-timeline.tsx
│   │   └── node-execution-card.tsx
│   │
│   ├── ai-assistant/
│   │   ├── ai-floating-button.tsx
│   │   ├── ai-suggest-workflow.tsx
│   │   └── ai-conversation-panel.tsx
│   │
│   ├── agent/
│   │   └── agent-config-panel.tsx
│   │
│   ├── media/
│   │   └── media-uploader.tsx
│   │
│   └── templates/
│       └── template-selector.tsx
│
└── shared/                      # Shared business components
    ├── search-bar.tsx
    ├── filter-bar.tsx
    └── key-value-editor.tsx
```

#### 2. Pages (App Router)
```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── callback/
│       └── page.tsx
│
├── (dashboard)/
│   ├── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── flows/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/
│   │           └── page.tsx
│   ├── bots/
│   │   └── page.tsx
│   ├── integrations/
│   │   └── page.tsx
│   └── ai-assistant/
│       └── page.tsx
│
└── api/                         # API routes
    └── webhooks/
        └── route.ts
```

#### 3. Lib/Utils
```
lib/
├── api/                         # API client functions
│   ├── flows.ts
│   ├── bots.ts
│   ├── integrations.ts
│   ├── node-types.ts
│   └── ai.ts
│
├── utils/                       # Utility functions
│   ├── format.ts
│   ├── validation.ts
│   └── date.ts
│
├── hooks/                       # Custom hooks
│   ├── use-auth.ts
│   ├── use-flows.ts
│   └── use-node-types.ts
│
├── context/                     # React contexts
│   ├── auth-context.tsx
│   └── node-types-context.tsx
│
└── types/                       # TypeScript types
    ├── flow.ts
    ├── bot.ts
    └── node.ts
```

#### 4. Naming Rules
- **Files**: `kebab-case.tsx`
- **Components**: `PascalCase` (export default)
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

```typescript
// ✅ Đúng: file workflow-card.tsx
export default function WorkflowCard() { ... }

// ✅ Đúng: file use-auth.ts
export function useAuth() { ... }

// ✅ Đúng: file api-client.ts
export const API_BASE_URL = "...";
export function fetchFlows() { ... }
```

---

## 🔄 Migration Plan

### Phase 1: Backend Cleanup
1. **Reorganize API routes**:
   ```bash
   # Di chuyển các file AI vào subfolder
   mkdir app/api/v1/ai
   mv app/api/v1/ai_*.py app/api/v1/ai/
   mv app/api/v1/endpoints/ai_*.py app/api/v1/ai/
   
   # Xóa folder endpoints (merge vào v1)
   mv app/api/v1/endpoints/*.py app/api/v1/
   rmdir app/api/v1/endpoints
   ```

2. **Rename inconsistent files**:
   - `agent_configs.py` → `agents.py` (ngắn gọn hơn)
   - Đảm bảo tất cả file API đều snake_case

### Phase 2: Frontend Cleanup
1. **Rename PascalCase components → kebab-case**:
   ```bash
   # Components
   mv components/agent/AgentConfigPanel.tsx components/agent/agent-config-panel.tsx
   mv components/ai/AIFloatingButton.tsx components/ai/ai-floating-button.tsx
   mv components/media/MediaUploader.tsx components/media/media-uploader.tsx
   mv components/templates/TemplateSelector.tsx components/templates/template-selector.tsx
   ```

2. **Reorganize component structure**:
   ```bash
   # Tạo features folder
   mkdir components/features
   
   # Di chuyển workflow components
   mkdir components/features/workflow
   mv components/workflow/* components/features/workflow/
   mv components/workflows/* components/features/workflow/
   
   # Di chuyển các feature khác
   mv components/agent components/features/
   mv components/ai components/features/ai-assistant
   mv components/flow-builder components/features/
   mv components/templates components/features/
   mv components/media components/features/
   
   # Di chuyển file lẻ
   mv components/ai-suggest-workflow.tsx components/features/ai-assistant/
   ```

3. **Reorganize lib structure**:
   ```bash
   # Tạo cấu trúc mới
   mkdir lib/hooks lib/context lib/types
   
   # Di chuyển files
   mv hooks/* lib/hooks/
   mv context/* lib/context/
   
   # Rename hooks
   mv lib/hooks/useAuth.ts lib/hooks/use-auth.ts
   ```

### Phase 3: Update Imports
- Sử dụng find & replace để update tất cả imports
- Test kỹ sau mỗi bước migration

---

## 📝 Checklist

### Backend
- [ ] Reorganize API routes (remove endpoints folder)
- [ ] Group AI-related endpoints into subfolder
- [ ] Ensure all files use snake_case
- [ ] Update imports in __init__.py files

### Frontend
- [ ] Rename all PascalCase components to kebab-case
- [ ] Reorganize components into features/ structure
- [ ] Merge workflow/ and workflows/ folders
- [ ] Move standalone component files into appropriate folders
- [ ] Reorganize lib/ structure (api, hooks, context, types)
- [ ] Rename hooks to use-* pattern
- [ ] Update all imports across the codebase
- [ ] Test build and runtime

---

## 🎯 Expected Benefits

1. **Consistency**: Một convention duy nhất, dễ nhớ
2. **Scalability**: Cấu trúc rõ ràng, dễ mở rộng
3. **Developer Experience**: Dễ tìm file, dễ navigate
4. **Maintainability**: Code dễ maintain hơn
5. **Onboarding**: Dev mới dễ hiểu cấu trúc hơn
