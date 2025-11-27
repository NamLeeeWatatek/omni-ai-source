# UI Component Migration Guide

## 🔄 Automatic Replacements

### 1. Replace Custom Inputs
```tsx
// Find & Replace Pattern 1: Input with label
<div>
    <label className="block text-sm font-medium mb-2">{LABEL_TEXT}</label>
    <input
        {PROPS}
        className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
</div>

// Replace with:
<FormField label="{LABEL_TEXT}">
    <Input {PROPS} />
</FormField>
```

### 2. Replace Custom Textareas
```tsx
// Find:
<textarea
    {PROPS}
    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
/>

// Replace with:
<Textarea {PROPS} />
```

### 3. Replace Custom Selects
```tsx
// Find:
<select
    {PROPS}
    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
>
    {OPTIONS}
</select>

// Replace with:
<Select {PROPS}>
    {OPTIONS}
</Select>
```

### 4. Replace Glass Cards
```tsx
// Find:
<div className="glass rounded-xl p-6 border border-border/40">
    {CONTENT}
</div>

// Replace with:
<Card className="p-6">
    {CONTENT}
</Card>
```

### 5. Replace Custom Modals
```tsx
// Find:
{showModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">{TITLE}</h3>
                <button onClick={closeModal}>
                    <FiX />
                </button>
            </div>
            {CONTENT}
        </div>
    </div>
)}

// Replace with:
<Modal isOpen={showModal} onClose={closeModal} title={TITLE}>
    <ModalBody>
        {CONTENT}
    </ModalBody>
</Modal>
```

### 6. Replace Status Badges
```tsx
// Find:
<span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
    Active
</span>

// Replace with:
<Badge variant="success">Active</Badge>
```

### 7. Replace Loading Spinners
```tsx
// Find:
<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>

// Replace with:
<Spinner size="lg" />
```

## 📝 Import Updates

### Add to imports:
```tsx
import {
    Button,
    Card,
    Badge,
    Modal,
    ModalBody,
    ModalFooter,
    FormField,
    Input,
    Textarea,
    Select,
    Spinner
} from '@wataomi/ui'
```

### Remove from imports:
```tsx
// Remove FiX if only used for modal close button
```

## 🎯 Priority Pages to Migrate

1. ✅ **Bots** - DONE
2. **Settings** - Simple, no forms
3. **Team** - Has input fields
4. **Archives** - Similar to Bots
5. **Dashboard** - Mostly display
6. **Inbox** - Has textarea
7. **Channels** - Complex, many modals
8. **Flows** - Very complex
9. **AI Assistant** - Has forms

## 📊 Expected Results Per Page

- **Code reduction**: 10-20%
- **Readability**: Much better
- **Maintainability**: Significantly improved
- **Consistency**: 100%
