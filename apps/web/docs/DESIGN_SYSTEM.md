# Design System Guidelines

## Overview
This document outlines the design system standards for WataOmi frontend to ensure consistency across all pages.

## Color System

### Primary Colors
- **Primary**: `hsl(217 91% 60%)` - Main brand color (Blue)
- **Success**: `hsl(142 71% 45%)` - Success states (Green)
- **Warning**: `hsl(38 92% 50%)` - Warning states (Orange)
- **Destructive**: `hsl(0 84% 60%)` - Error/Delete states (Red)
- **Info**: `hsl(199 89% 48%)` - Info states (Cyan)

### Neutral Colors
- **Background**: `hsl(230 35% 7%)` - Main background
- **Card**: `hsl(230 30% 11%)` - Card background
- **Border**: `hsl(230 25% 18%)` - Border color
- **Muted**: `hsl(230 25% 15%)` - Muted background
- **Muted Foreground**: `hsl(220 9% 65%)` - Muted text

### Usage
```tsx
// ✅ CORRECT - Use Tailwind classes
<div className="bg-card border border-border text-foreground">

// ❌ WRONG - Don't use custom colors
<div className="bg-[#1a1f2e] border-[#2a3f5e] text-white">
```

## Spacing System

### Standard Spacing
Use Tailwind's spacing scale (4px base):
- `p-2` = 8px
- `p-4` = 16px
- `p-6` = 24px
- `p-8` = 32px

### Page Layout
```tsx
// ✅ CORRECT - Standard page layout
<div className="h-full p-6 space-y-6">
  <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold">Page Title</h1>
  </div>
  {/* Content */}
</div>

// ❌ WRONG - Custom spacing
<div style={{ padding: '25px' }}>
```

## Typography

### Headings
```tsx
// Page Title
<h1 className="text-3xl font-bold mb-2">Title</h1>

// Section Title
<h2 className="text-xl font-semibold mb-4">Section</h2>

// Subsection
<h3 className="text-lg font-semibold">Subsection</h3>
```

### Body Text
```tsx
// Regular text
<p className="text-base text-foreground">Content</p>

// Muted text
<p className="text-sm text-muted-foreground">Description</p>
```

## Components

### Cards
```tsx
// ✅ CORRECT - Use dashboard-card class
<div className="dashboard-card p-5">
  {/* Content */}
</div>

// ❌ WRONG - Custom card styling
<div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
```

### Buttons
```tsx
// Primary action
<Button>Action</Button>

// Secondary action
<Button variant="outline">Action</Button>

// Destructive action
<Button variant="destructive">Delete</Button>
```

### Status Indicators
```tsx
// ✅ CORRECT - Use semantic colors
<span className="text-success">Active</span>
<span className="text-warning">Pending</span>
<span className="text-destructive">Error</span>

// ❌ WRONG - Custom colors
<span className="text-green-500">Active</span>
```

## Grid Layouts

### Standard Grid
```tsx
// ✅ CORRECT - Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// ❌ WRONG - Fixed columns
<div className="grid grid-cols-3 gap-6">
```

## Platform Colors

For platform-specific colors (Facebook, Instagram, etc.), use predefined classes:

```tsx
// ✅ CORRECT
<div className="platform-facebook">
<div className="platform-instagram">
<div className="platform-whatsapp">

// ❌ WRONG
<div className="text-[#1877F2] bg-[#1877F2]/10">
```

## API Calls

### HTTP Methods
```tsx
// ✅ CORRECT - Use PATCH for updates
await fetchAPI(`/resource/${id}`, {
  method: 'PATCH',
  body: JSON.stringify(data)
})

// ❌ WRONG - Don't use PUT
await fetchAPI(`/resource/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
})
```

### Error Handling
```tsx
// ✅ CORRECT
try {
  const data = await fetchAPI('/endpoint')
  toast.success('Success message')
} catch (error) {
  console.error(error)
  toast.error('Failed to load data')
}
```

## Type Management

### Centralized Types
```tsx
// ✅ CORRECT - Import from types folder
import type { NodeType, NodeCategory } from '@/lib/types/node'

// ❌ WRONG - Define inline
interface NodeType {
  id: string
  // ...
}
```

### Type Location
- **Domain types**: `lib/types/[domain].ts`
- **API types**: Use domain types
- **Component props**: Define in component file

## File Organization

```
lib/
├── api/           # API calls
│   └── nodes.ts
├── types/         # Type definitions
│   └── node.ts
├── hooks/         # Custom hooks
├── store/         # Redux store
└── utils/         # Utilities

app/(dashboard)/
├── nodes/         # Feature pages
│   └── page.tsx
└── layout.tsx
```

## Common Mistakes to Avoid

### ❌ Don't Do This
```tsx
// Custom colors
<div className="bg-[#1a1f2e] text-[#60a5fa]">

// Inline styles
<div style={{ padding: '20px', margin: '10px' }}>

// PUT requests
method: 'PUT'

// Inline types
interface MyType { ... }

// Custom spacing
<div className="p-[25px] m-[15px]">
```

### ✅ Do This Instead
```tsx
// Use design system colors
<div className="bg-card text-primary">

// Use Tailwind classes
<div className="p-6 space-y-4">

// Use PATCH for updates
method: 'PATCH'

// Import types
import type { MyType } from '@/lib/types/domain'

// Use standard spacing
<div className="p-6 space-y-6">
```

## Page Template

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import toast from '@/lib/toast'
import type { MyType } from '@/lib/types/domain'
import { getItems } from '@/lib/api/domain'

export default function MyPage() {
  const [items, setItems] = useState<MyType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getItems()
      setItems(data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Page Title</h1>
          <p className="text-muted-foreground">Description</p>
        </div>
        <Button>Action</Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-8" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="dashboard-card p-5">
              {/* Card content */}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## References

- Tailwind CSS: https://tailwindcss.com/docs
- Design tokens: `app/globals.css`
- Components: `components/ui/`
