# 🎨 Shadcn/UI Migration Guide

## ✅ Setup Complete

Shadcn/UI đã được setup thành công với:
- ✅ Style: New York (Recommended)
- ✅ Base Color: Neutral (customized to Purple primary)
- ✅ Dark mode: Enabled (default)
- ✅ Glass effect: Preserved
- ✅ Custom gradients: Preserved

## 📦 Components Available

Đã install các components:
- `button` - Button component
- `input` - Input field
- `textarea` - Textarea
- `select` - Select dropdown
- `label` - Form label
- `card` - Card component
- `badge` - Badge/Status indicator
- `dialog` - Modal/Dialog
- `dropdown-menu` - Dropdown menu
- `spinner` - Loading spinner

## 🔄 Migration Pattern

### Old (@wataomi/ui) → New (Shadcn)

#### 1. Button
```tsx
// Old
import { Button } from '@wataomi/ui'

// New - SAME!
import { Button } from '@/components/ui/button'
```

#### 2. Input
```tsx
// Old
import { Input, FormField } from '@wataomi/ui'
<FormField label="Name" required>
    <Input />
</FormField>

// New
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
<div className="space-y-2">
    <Label htmlFor="name">Name *</Label>
    <Input id="name" />
</div>
```

#### 3. Card
```tsx
// Old
import { Card } from '@wataomi/ui'
<Card className="p-6">Content</Card>

// New - SAME!
import { Card } from '@/components/ui/card'
<Card className="p-6">Content</Card>
```

#### 4. Badge
```tsx
// Old
import { Badge } from '@wataomi/ui'
<Badge variant="success">Active</Badge>

// New - SAME!
import { Badge } from '@/components/ui/badge'
<Badge variant="success">Active</Badge>
```

#### 5. Modal/Dialog
```tsx
// Old
import { Modal, ModalBody, ModalFooter } from '@wataomi/ui'
<Modal isOpen={open} onClose={setOpen} title="Title">
    <ModalBody>Content</ModalBody>
    <ModalFooter>
        <Button>Save</Button>
    </ModalFooter>
</Modal>

// New
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

<Dialog open={open} onOpenChange={setOpen}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Title</DialogTitle>
        </DialogHeader>
        <div>Content</div>
        <DialogFooter>
            <Button>Save</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

#### 6. Dropdown Menu
```tsx
// Old
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@wataomi/ui'
<Dropdown>
    <DropdownTrigger><Button>Menu</Button></DropdownTrigger>
    <DropdownMenu>
        <DropdownItem>Edit</DropdownItem>
    </DropdownMenu>
</Dropdown>

// New - SAME!
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

<DropdownMenu>
    <DropdownMenuTrigger><Button>Menu</Button></DropdownMenuTrigger>
    <DropdownMenuContent>
        <DropdownMenuItem>Edit</DropdownMenuItem>
    </DropdownMenuContent>
</DropdownMenu>
```

#### 7. Spinner
```tsx
// Old
import { Spinner } from '@wataomi/ui'
<Spinner size="lg" />

// New - SAME!
import { Spinner } from '@/components/ui/spinner'
<Spinner size="lg" />
```

## 🎯 Quick Replace Guide

### Step 1: Update Imports
```tsx
// Find & Replace in each file:

// Old imports
import { Button, Card, Badge, Modal, Input, Textarea, Select } from '@wataomi/ui'

// New imports
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
```

### Step 2: Update Modal Usage
```tsx
// Old Modal pattern
<Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Bot">
    <ModalBody>
        <FormField label="Name" required>
            <Input />
        </FormField>
    </ModalBody>
    <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onSave}>Save</Button>
    </ModalFooter>
</Modal>

// New Dialog pattern
<Dialog open={showModal} onOpenChange={setShowModal}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Create Bot</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" />
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={onSave}>Save</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

### Step 3: Update FormField Pattern
```tsx
// Old
<FormField label="Name" required error={error}>
    <Input value={value} onChange={onChange} />
</FormField>

// New
<div className="space-y-2">
    <Label htmlFor="name">Name *</Label>
    <Input id="name" value={value} onChange={onChange} />
    {error && <p className="text-sm text-destructive">{error}</p>}
</div>
```

## 📝 Migration Checklist

### For Each Page:

- [ ] Update imports from `@wataomi/ui` to `@/components/ui/*`
- [ ] Replace `Modal` with `Dialog`
- [ ] Replace `ModalBody` with `<div>` inside `DialogContent`
- [ ] Replace `ModalFooter` with `DialogFooter`
- [ ] Replace `FormField` with `Label` + component
- [ ] Replace `isOpen/onClose` with `open/onOpenChange`
- [ ] Test the page

## 🎨 Styling Notes

### Glass Effect
Glass effect vẫn hoạt động với class `.glass`:
```tsx
<Card className="glass p-6">
    Content with glass effect
</Card>
```

### Custom Variants
Shadcn components support custom className:
```tsx
<Button className="bg-gradient-wata">
    Gradient Button
</Button>

<Badge className="bg-green-500/10 text-green-500">
    Custom Badge
</Badge>
```

### Dark Mode
Dark mode tự động hoạt động với class `dark`:
```tsx
// Automatically adapts
<Card>Content</Card>
```

## 🚀 Benefits of Shadcn

1. **Well Maintained** - Actively maintained by Vercel
2. **More Components** - 50+ components available
3. **Better Documentation** - Comprehensive docs
4. **Customizable** - Full control over code
5. **Type Safe** - Full TypeScript support
6. **Accessible** - WCAG compliant
7. **No Package** - Components copied to your project
8. **Flexible** - Easy to customize

## 📦 Available Components

Can add more components anytime:
```bash
npx shadcn@latest add [component-name]
```

Available components:
- accordion
- alert
- alert-dialog
- aspect-ratio
- avatar
- breadcrumb
- calendar
- checkbox
- collapsible
- combobox
- command
- context-menu
- data-table
- date-picker
- form
- hover-card
- menubar
- navigation-menu
- popover
- progress
- radio-group
- scroll-area
- separator
- sheet
- skeleton
- slider
- switch
- table
- tabs
- toast
- toggle
- tooltip
- ... and more!

## 🎯 Priority Pages to Migrate

1. ✅ **Bots** - Simple forms
2. ✅ **Settings** - Display only
3. ✅ **Archives** - Simple table
4. **Flows** - Complex, many modals
5. **Channels** - Many forms and modals
6. **Dashboard** - Stats display
7. **Inbox** - Chat interface
8. **Team** - User management
9. **AI Assistant** - Chat interface

## 📊 Expected Results

- **Same visual appearance** - No UI changes
- **Better DX** - Easier to use
- **More features** - Access to 50+ components
- **Better maintained** - Regular updates
- **Smaller bundle** - Tree-shakeable
- **Type safe** - Full TypeScript

## 🎉 Next Steps

1. Migrate all pages to use Shadcn components
2. Remove `@wataomi/ui` package
3. Add more Shadcn components as needed
4. Customize components for brand
5. Add Storybook for documentation
