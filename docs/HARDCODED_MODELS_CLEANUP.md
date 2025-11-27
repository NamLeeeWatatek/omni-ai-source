# Hardcoded Models Cleanup

## Problem
Có 16+ nơi hardcode model names cũ (`gemini-pro`, `gpt-4`, `gpt-3.5-turbo`) trong codebase.

## Solution
Đã update tất cả default values sang models mới nhất.

## Changes Summary

### Default Model: `gemini-2.5-flash`
Lý do chọn:
- ✅ Cân bằng giữa giá và hiệu suất
- ✅ Stable (GA)
- ✅ Fast inference
- ✅ 16K tokens context

### Files Updated (16 files)

#### Backend Models
1. `app/models/agent_config.py` - Default model
2. `app/models/ai_conversation.py` - Default model (2 places)

#### Backend Services
3. `app/services/gemini.py` - Default model (2 places)
4. `app/services/flow_executor.py` - Default models (2 places)

#### Backend APIs
5. `app/api/v1/ai/models.py` - ChatRequest default
6. `app/api/v1/ai/chat.py` - Default models (2 places)
7. `app/api/v1/ai/suggestions.py` - Example workflow (2 places)

#### Backend Data
8. `app/data/workflow_templates.py` - Template default
9. `app/data/node_types.py` - Node default + dynamic options

#### Frontend Components
10. `components/features/agent/agent-config-panel.tsx` - Default + fallback (2 places)
11. `components/features/ai-assistant/ai-floating-button.tsx` - Default model
12. `app/(dashboard)/ai-assistant/page.tsx` - Fallback model

## New Defaults

### Primary Default
```
gemini-2.5-flash
```

### Secondary Defaults (by provider)
- **Gemini**: `gemini-2.5-flash`
- **OpenAI**: `gpt-4o`
- **Anthropic**: `claude-3-sonnet`

## Dynamic Loading
Node types now use dynamic options:
```python
"options": "dynamic:ai-models:gemini"  # Load from API
```

## Fallback Models
Frontend components have fallback arrays if API fails:
```typescript
const models = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' }
]
```

## Result
✅ No more outdated model references
✅ All defaults use latest models
✅ Dynamic loading from API
✅ Consistent across entire codebase
