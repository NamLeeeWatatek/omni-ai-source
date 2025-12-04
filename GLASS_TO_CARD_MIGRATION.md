# 🔄 .glass → Card Migration Plan

## 📊 TỔNG HỢP

Đã tìm thấy **~80+ instances** của `.glass` class trong hệ thống.

### **Files cần refactor (grouped by priority):**

#### **Priority 1: Dashboard Pages** (7 files)
1. `app/(dashboard)/dashboard/page.tsx` - ✅ **DONE**
2. `app/(dashboard)/flows/page.tsx` - 2 instances
3. `app/(dashboard)/flows/[id]/page.tsx` - 13 instances
4. `app/(dashboard)/flows/[id]/executions/page.tsx` - 5 instances  
5. `app/(dashboard)/flows/[id]/executions/[executionId]/page.tsx` - 18 instances
6. `app/(dashboard)/templates/page.tsx` - 1 instance
7. `app/(dashboard)/channels/page.tsx` - 4 instances
8. `app/(dashboard)/knowledge-base/collections/page.tsx` - 1 instance
9. `app/(dashboard)/knowledge-base/collections/[id]/page.tsx` - 1 instance

#### **Priority 2: Workflow Components** (10 files)
1. `components/features/workflow/workflow-stats.tsx` - 1 instance
2. `components/features/workflow/workflow-card.tsx` - 2 instances
3. `components/features/workflow/workflow-run-modal.tsx` - 2 instances (input fields)
4. `components/features/workflow/test-node-panel.tsx` - 3 instances
5. `components/features/workflow/test-node-modal.tsx` - 3 instances
6. `components/features/workflow/node-execution-card.tsx` - 1 instance
7. `components/features/workflow/search-bar.tsx` - 1 instance (input)
8. `components/features/workflow/node-context-menu.tsx` - 1 instance
9. `components/features/workflow/key-value-editor.tsx` - 2 instances (inputs)
10. `components/features/workflow/filter-bar.tsx` - 1 instance
11. `components/features/workflow/dynamic-form-field.tsx` - 7 instances (mostly inputs)

#### **Priority 3: Flow Builder & AI** (3 files)
1.  `components/features/flow-builder/custom-nodes.tsx` - 1 instance
2. `components/features/ai-assistant/ai-suggest-workflow.tsx` - 2 instances
3. `components/features/ai-assistant/ai-floating-button.tsx` - 3 instances

#### **Priority 4: Auth Pages** (2 files)
1. `app/oauth/callback/[provider]/page.tsx` - 1 instance
2. `app/callback/page.tsx` - 1 instance

#### **Priority 5: UI Components** (1 file)
1. `components/ui/json-editor.tsx` - 1 instance (textarea)

---

## 📋 MIGRATION STRATEGY

### **1. Card-suitable elements:**
Dùng `<Card>` component cho:
-✅ Content containers (đa phần các `.glass p-6 rounded-xl`)
- ✅ Info boxes
- ✅ Stat boxes
- ✅ Section wrappers

### **2. Keep `.glass` for:**
- ⚠️ **Form inputs** (input, textarea, select) - keep `.glass` vì dynamic
- ⚠️ **Dropdown menus** - specialized components
- ⚠️ **Search bars** - specialized
- ⚠️ **Context menus** - positioned dynamically
- ⚠️ **Small UI elements** (badges, pills < p-2)

---

## 🎯 ACTION PLAN

### **Phase 1: Core Dashboard Pages** (Priority 1)
- Impact: High - Most visible to users
- Files: 9 files
- Instances: ~45

### **Phase 2: Workflow Components** (Priority 2)
- Impact: Medium - Workflow builder users
- Files: 11 files  
- Instances: ~24
- Note: Skip form inputs, keep only container cards

### **Phase 3: Flow Builder & AI** (Priority 3)
- Impact: Medium
- Files: 3 files
- Instances: ~6

### **Phase 4: Auth Pages** (Priority 4)
- Impact: Low - Infrequent usage
- Files: 2 files
- Instances: 2

---

## ⚙️ IMPLEMENTATION APPROACH

### **Option A: Manual (Recommended for accuracy)**
Refactor files one-by-one:
- More control
- Can preserve specific styling
- Better for complex layouts

### **Option B: Automated with script**
Bulk find-replace with rules:
- Faster for simple cases
- Risk of breaking layouts

**Recommendation: Option A cho Dashboard pages, Option B cho simple cases**

---

## 🚀 START NOW?

Bạn muốn tôi:
1. ✨ **Bắt đầu với Priority 1** (Dashboard pages) - refactor từng file?
2. 📝 **Tạo script** để automate cho các cases đơn giản?
3. 🎯 **Focus vào specific file** mà bạn quan tâm nhất?

Gợi ý: Tôi sẽ bắt đầu với **flows pages** vì chúng có nhiều `.glass` nhất và là features chính!
