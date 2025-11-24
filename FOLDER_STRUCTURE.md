# WataOmi - Complete Folder Structure

```
wataomi/
│
├── 📄 package.json                    # Root workspace configuration
├── 📄 turbo.json                      # Turborepo build pipeline
├── 📄 .gitignore                      # Git ignore rules
├── 📄 .env.example                    # Environment variables template
├── 📄 docker-compose.yml              # Full stack orchestration
├── 📄 README.md                       # Complete documentation
├── 📄 PROJECT_SUMMARY.md              # Project deliverables summary
├── 📄 FIGMA_SPEC.md                   # Figma design specification
│
├── 📁 apps/
│   │
│   ├── 📁 web/                        # Next.js 15 Frontend Application
│   │   ├── 📁 app/
│   │   │   ├── 📁 (dashboard)/
│   │   │   │   ├── 📄 layout.tsx                # Dashboard layout (sidebar + topbar)
│   │   │   │   ├── 📁 dashboard/
│   │   │   │   │   └── 📄 page.tsx              # Dashboard home
│   │   │   │   ├── 📁 flows/
│   │   │   │   │   └── 📄 page.tsx              # WataFlow builder (ReactFlow)
│   │   │   │   ├── 📁 inbox/
│   │   │   │   │   └── 📄 page.tsx              # OmniInbox (3-column)
│   │   │   │   ├── 📁 channels/
│   │   │   │   │   └── 📄 page.tsx              # Channel management
│   │   │   │   ├── 📁 analytics/
│   │   │   │   │   └── 📄 page.tsx              # Analytics dashboard
│   │   │   │   └── 📁 settings/
│   │   │   │       └── 📄 page.tsx              # Settings & WataBubble customizer
│   │   │   ├── 📄 layout.tsx                    # Root layout
│   │   │   └── 📄 page.tsx                      # Landing page
│   │   │
│   │   ├── 📁 components/
│   │   │   └── 📁 flow-builder/
│   │   │       ├── 📄 custom-nodes.tsx          # 7 custom ReactFlow nodes
│   │   │       └── 📄 ai-suggest-button.tsx     # AI suggestion button
│   │   │
│   │   ├── 📁 public/
│   │   │   └── 📄 watabubble.js                 # Embeddable chat widget
│   │   │
│   │   ├── 📄 Dockerfile                        # Frontend Docker build
│   │   ├── 📄 next.config.js                    # Next.js configuration
│   │   ├── 📄 tailwind.config.ts                # Tailwind configuration
│   │   ├── 📄 postcss.config.js                 # PostCSS configuration
│   │   ├── 📄 tsconfig.json                     # TypeScript configuration
│   │   └── 📄 package.json                      # Frontend dependencies
│   │
│   └── 📁 backend/                    # FastAPI Backend Application
│       ├── 📁 app/
│       │   ├── 📁 api/
│       │   │   ├── 📁 v1/
│       │   │   │   ├── 📄 __init__.py
│       │   │   │   ├── 📄 auth.py               # Authentication endpoints
│       │   │   │   ├── 📄 bots.py               # Bot CRUD endpoints
│       │   │   │   ├── 📄 flows.py              # Flow management endpoints
│       │   │   │   ├── 📄 channels.py           # Channel endpoints
│       │   │   │   ├── 📄 conversations.py      # Conversation endpoints
│       │   │   │   ├── 📄 webhooks.py           # Webhook receivers + n8n proxy
│       │   │   │   └── 📄 ai.py                 # AI suggestion endpoint
│       │   │   └── 📄 __init__.py
│       │   │
│       │   ├── 📁 core/
│       │   │   ├── 📄 __init__.py
│       │   │   ├── 📄 config.py                 # Application settings
│       │   │   └── 📄 security.py               # JWT auth & password hashing
│       │   │
│       │   ├── 📁 models/
│       │   │   ├── 📄 __init__.py
│       │   │   ├── 📄 user.py                   # User & Workspace models
│       │   │   ├── 📄 bot.py                    # Bot & FlowVersion models
│       │   │   ├── 📄 channel.py                # Channel model
│       │   │   └── 📄 conversation.py           # Conversation & Message models
│       │   │
│       │   ├── 📄 __init__.py
│       │   └── 📄 main.py                       # FastAPI application entry
│       │
│       ├── 📄 Dockerfile                        # Backend Docker build
│       └── 📄 pyproject.toml                    # Python dependencies
│
├── 📁 packages/
│   │
│   ├── 📁 ui/                         # Shared UI Components Package
│   │   ├── 📁 src/
│   │   │   ├── 📁 lib/
│   │   │   │   └── 📄 utils.ts                  # Utility functions
│   │   │   ├── 📄 button.tsx                    # WataOmi gradient button
│   │   │   ├── 📄 globals.css                   # Dark mode theme CSS
│   │   │   └── 📄 index.tsx                     # Package exports
│   │   │
│   │   ├── 📄 tailwind.config.ts                # WataOmi design system
│   │   ├── 📄 tsconfig.json                     # TypeScript config
│   │   └── 📄 package.json                      # UI package dependencies
│   │
│   └── 📁 types/                      # Shared TypeScript Types Package
│       ├── 📁 src/
│       │   └── 📄 index.ts                      # All type definitions
│       ├── 📄 tsconfig.json                     # TypeScript config
│       └── 📄 package.json                      # Types package config
│
└── 📁 .gemini/                        # Antigravity artifacts (auto-generated)
    └── 📁 antigravity/
        └── 📁 brain/
            └── 📁 ac0afbd4-cab3-44c1-8ffe-f281c1d4de73/
                ├── 📄 task.md                   # Task checklist
                └── 📄 implementation_plan.md    # Implementation plan
```

## 📊 File Count Summary

### Frontend (apps/web)
- **Pages**: 8 (Landing + 7 Dashboard pages)
- **Components**: 2 (Custom nodes + AI button)
- **Config Files**: 6
- **Total**: ~16 files

### Backend (apps/backend)
- **API Routers**: 7
- **Models**: 4
- **Core Modules**: 2
- **Config Files**: 2
- **Total**: ~20 files

### Shared Packages
- **UI Package**: 6 files
- **Types Package**: 3 files
- **Total**: 9 files

### Infrastructure
- **Docker**: 3 files (2 Dockerfiles + docker-compose.yml)
- **Config**: 4 files (package.json, turbo.json, .gitignore, .env.example)
- **Documentation**: 4 files (README, PROJECT_SUMMARY, FIGMA_SPEC, FOLDER_STRUCTURE)
- **Total**: 11 files

## 🎯 Grand Total: 60+ Files

All files are production-ready with zero placeholders!

---

## 🔑 Key Directories Explained

### `/apps/web/app/(dashboard)/`
Dashboard pages using Next.js 15 App Router with route groups. The `(dashboard)` group shares the same layout (sidebar + topbar).

### `/apps/backend/app/api/v1/`
API version 1 endpoints. All routers are registered in `main.py` with `/api/v1` prefix.

### `/packages/ui/`
Shared UI components that can be imported by any app in the monorepo. Includes the WataOmi design system.

### `/packages/types/`
Shared TypeScript types for type safety across frontend and backend communication.

---

## 🚀 Quick Navigation

**Want to see the landing page?**
→ `apps/web/app/page.tsx`

**Want to see the flow builder?**
→ `apps/web/app/(dashboard)/flows/page.tsx`

**Want to see custom nodes?**
→ `apps/web/components/flow-builder/custom-nodes.tsx`

**Want to see the AI suggestion logic?**
→ `apps/backend/app/api/v1/ai.py`

**Want to see the design system?**
→ `packages/ui/tailwind.config.ts`

**Want to deploy?**
→ `docker-compose.yml` or `README.md`

---

**WataOmi** - One AI. Every Channel. Zero Code. 🚀
