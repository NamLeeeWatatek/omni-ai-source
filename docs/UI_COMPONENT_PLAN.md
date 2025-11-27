# WataOmi UI Component Standardization Plan

## 🎯 Mục tiêu

Tạo một Design System hoàn chỉnh cho WataOmi, giữ nguyên style hiện tại (glass effect, gradients, dark mode) nhưng componentize để dùng nhất quán.

## 📊 Phân tích hiện tại

### ✅ Đã có & Đẹp:
- **Tailwind Config**: Custom colors, gradients, animations
- **CSS Variables**: Design tokens chuẩn (--primary, --background, etc.)
- **Glass Effect**: `.glass` class với backdrop-filter
- **Brand Gradients**: `bg-gradient-wata` (purple → blue → cyan)
- **Dark Mode**: Hỗ trợ dark/light mode
- **Button Component**: Đã có trong @wataomi/ui

### ❌ Vấn đề cần fix:

#### 1. Input Fields - Lộn xộn
```tsx
// ❌ Hiện tại - mỗi nơi tự code
<input
    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
    // ... className dài 100 ký tự
/>
```

#### 2. Modals - Không nhất quán
```tsx
// ❌ Hiện tại - mỗi page tự code modal
{showModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            {/* ... */}
        </div>
    </div>
)}
```

#### 3. Cards - Tự code khắp nơi
```tsx
// ❌ Hiện tại
<div className="glass p-5 rounded-xl hover:border-primary/50 transition-all group relative">
    {/* ... */}
</div>
```

#### 4. Select/Textarea - Không có component
```tsx
// ❌ Hiện tại
<select className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20">
    {/* ... */}
</select>
```

## 🎨 Components cần tạo

### 1. Input Component
```tsx
// ✅ Mục tiêu
import { Input } from '@wataomi/ui'

<Input 
    placeholder="Enter text"
    error="This field is required"
/>
```

**Features:**
- Glass effect mặc định
- Error state với message
- Success state
- Icon support (left/right)
- Sizes: sm, md, lg

### 2. Textarea Component
```tsx
// ✅ Mục tiêu
import { Textarea } from '@wataomi/ui'

<Textarea 
    placeholder="Enter description"
    rows={4}
    error="Too short"
/>
```

### 3. Select Component
```tsx
// ✅ Mục tiêu
import { Select } from '@wataomi/ui'

<Select 
    options={[
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' }
    ]}
    placeholder="Select..."
/>
```

### 4. Modal Component
```tsx
// ✅ Mục tiêu
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@wataomi/ui'

<Modal isOpen={showModal} onClose={() => setShowModal(false)}>
    <ModalHeader>Create Bot</ModalHeader>
    <ModalBody>
        <Input label="Name" />
    </ModalBody>
    <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onSave}>Save</Button>
    </ModalFooter>
</Modal>
```

### 5. Card Component
```tsx
// ✅ Mục tiêu
import { Card, CardHeader, CardContent, CardFooter } from '@wataomi/ui'

<Card>
    <CardHeader>
        <h3>Title</h3>
    </CardHeader>
    <CardContent>
        Content here
    </CardContent>
    <CardFooter>
        <Button>Action</Button>
    </CardFooter>
</Card>
```

### 6. Badge Component
```tsx
// ✅ Mục tiêu
import { Badge } from '@wataomi/ui'

<Badge variant="success">Active</Badge>
<Badge variant="error">Inactive</Badge>
<Badge variant="warning">Pending</Badge>
```

### 7. Label Component
```tsx
// ✅ Mục tiêu
import { Label } from '@wataomi/ui'

<Label htmlFor="name" required>
    Bot Name
</Label>
<Input id="name" />
```

### 8. FormField Component (Wrapper)
```tsx
// ✅ Mục tiêu
import { FormField } from '@wataomi/ui'

<FormField 
    label="Bot Name"
    required
    error="Name is required"
>
    <Input />
</FormField>
```

### 9. Dropdown Component
```tsx
// ✅ Mục tiêu
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@wataomi/ui'

<Dropdown>
    <DropdownTrigger>
        <Button variant="ghost"><FiMoreVertical /></Button>
    </DropdownTrigger>
    <DropdownMenu>
        <DropdownItem onClick={onEdit}>Edit</DropdownItem>
        <DropdownItem onClick={onDelete}>Delete</DropdownItem>
    </DropdownMenu>
</Dropdown>
```

### 10. Spinner Component
```tsx
// ✅ Mục tiêu
import { Spinner } from '@wataomi/ui'

<Spinner size="sm" />
<Spinner size="lg" className="text-primary" />
```

## 🎨 Design Tokens (Giữ nguyên)

```css
/* Colors - Giữ nguyên từ tailwind.config.ts */
--primary: 262 83% 58%;           /* Purple */
--background: 240 10% 3.9%;       /* Dark */
--foreground: 0 0% 98%;           /* Light text */
--border: 240 3.7% 15.9%;         /* Border */
--muted: 240 3.7% 15.9%;          /* Muted bg */

/* Glass Effect - Giữ nguyên */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Gradients - Giữ nguyên */
bg-gradient-wata: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #06B6D4 100%)
```

## 📝 Component Styling Rules

### 1. Base Input Style (Chuẩn hóa)
```tsx
const baseInputClasses = cn(
    "w-full glass rounded-lg px-3 py-2",
    "border border-border/40",
    "focus:outline-none focus:ring-2 focus:ring-primary/20",
    "transition-all duration-200",
    "placeholder:text-muted-foreground/50"
)
```

### 2. Base Card Style
```tsx
const baseCardClasses = cn(
    "glass rounded-xl",
    "border border-border/40",
    "hover:border-primary/50",
    "transition-all duration-200"
)
```

### 3. Base Modal Style
```tsx
const baseModalClasses = cn(
    "fixed inset-0 z-50",
    "flex items-center justify-center",
    "bg-black/50 backdrop-blur-sm"
)
```

## 🚀 Migration Strategy

### Phase 1: Tạo Components (1-2 giờ)
1. ✅ Input, Textarea, Select
2. ✅ Modal (với Header, Body, Footer)
3. ✅ Card (với Header, Content, Footer)
4. ✅ Badge, Label, FormField
5. ✅ Dropdown, Spinner

### Phase 2: Update @wataomi/ui package
1. Export tất cả components mới
2. Update index.tsx
3. Test components

### Phase 3: Migrate Pages (2-3 giờ)
1. Bots page - thay inputs, modal
2. Channels page - thay inputs, cards
3. Flows page - thay cards, dropdowns
4. Settings page - thay forms
5. Các pages còn lại

### Phase 4: Cleanup
1. Xóa code cũ
2. Remove duplicate styles
3. Update documentation

## 📊 Expected Results

### Before:
```tsx
// 15 dòng code cho 1 input
<div>
    <label className="block text-sm font-medium mb-2">Bot Name *</label>
    <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder="My Awesome Bot"
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
</div>
```

### After:
```tsx
// 3 dòng code
<FormField label="Bot Name" required error={error}>
    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
</FormField>
```

### Benefits:
- ✅ **80% less code** trong pages
- ✅ **100% consistent** styling
- ✅ **Easy to maintain** - chỉ update 1 nơi
- ✅ **Type-safe** với TypeScript
- ✅ **Accessible** - ARIA labels built-in
- ✅ **Responsive** - mobile-first
- ✅ **Dark mode** - tự động support

## 🎯 Success Metrics

- [ ] Tất cả inputs dùng `<Input>` component
- [ ] Tất cả modals dùng `<Modal>` component
- [ ] Tất cả cards dùng `<Card>` component
- [ ] Không còn className dài > 50 ký tự
- [ ] Không còn duplicate modal code
- [ ] Build success without errors
- [ ] UI giống y hệt như cũ (chỉ refactor code)
