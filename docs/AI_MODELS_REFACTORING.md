# AI Models Refactoring

## Problem
Có 4 nơi khác nhau implement AI model loading với logic khác nhau:
1. `node-properties.tsx` - Split by provider (gemini/openai)
2. `agent-config-panel.tsx` - Flatten to {value, label}
3. `settings/page.tsx` - Keep full provider structure
4. `ai-assistant/page.tsx` - Flatten all models

## Solution
Tạo **reusable hook** `useAIModels()` - Single source of truth

### Hook Location
```
apps/web/lib/hooks/use-ai-models.ts
```

### Hook API
```typescript
const {
    models,              // All models (flattened)
    providers,           // Full provider structure
    loading,             // Loading state
    error,               // Error message
    getModelsByProvider, // Get models by provider name
    getAvailableModels,  // Get only available models
    getModelOptions      // Get as select options {value, label, description}
} = useAIModels()
```

### Updated Files
✅ `apps/web/components/features/workflow/node-properties.tsx`
✅ `apps/web/components/features/agent/agent-config-panel.tsx`
✅ `apps/web/app/(dashboard)/ai-assistant/page.tsx`

### Benefits
- ✅ Single source of truth
- ✅ Consistent API across app
- ✅ Easier to maintain
- ✅ Type-safe
- ✅ Reusable

## Updated Model List

### Google Gemini (7 models)
- gemini-3-pro-preview
- gemini-2.5-pro
- gemini-2.5-flash
- gemini-2.5-flash-lite
- gemini-2.5-flash-image
- gemini-2.0-flash
- gemini-2.0-flash-lite

### OpenAI (6 models)
- gpt-5
- gpt-5.1
- gpt-5-mini
- gpt-4o
- gpt-4o-mini
- gpt-3.5-turbo

### Anthropic (3 models)
- claude-3-opus
- claude-3-sonnet
- claude-3-haiku

## Backend
Models defined in: `apps/backend/app/api/v1/ai/models.py`
- Centralized `AVAILABLE_MODELS` dictionary
- Each model has: name, display_name, capabilities, max_tokens, description
