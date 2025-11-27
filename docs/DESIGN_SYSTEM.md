# WataOmi Design System

## 🎨 Overview

Design System chuẩn cho WataOmi - tất cả components đều được build bằng Tailwind CSS, đảm bảo consistency và maintainability.

## 📦 Component Library Structure

```
packages/ui/src/
├── index.tsx                 # Main export
├── globals.css              # Global styles
├── lib/
│   └── utils.ts            # Utility functions
│
├── button.tsx              # ✅ Existing
├── input.tsx               # 🆕 New
├── textarea.tsx            # 🆕 New
├── select.tsx              # 🆕 New
├── checkbox.tsx            # 🆕 New
├── radio.tsx               # 🆕 New
├── switch.tsx              # 🆕 New
├── badge.tsx               # 🆕 New
├── card.tsx                # 🆕 New
├── modal.tsx               # 🆕 New
├── dropdown.tsx            # 🆕 New
├── tabs.tsx                # 🆕 New
├── tooltip.tsx             # 🆕 New
├── alert.tsx               # 🆕 New
├── spinner.tsx             # 🆕 New
└── avatar.tsx              # 🆕 New
```

## 🎯 Design Principles

1. **Consistency**: Tất cả components follow cùng một design language
2. **Accessibility**: WCAG 2.1 AA compliant
3. **Customizable**: Dễ dàng customize với Tailwind variants
4. **Type-safe**: Full TypeScript support
5. **Performance**: Lightweight, no heavy dependencies

## 🎨 Color Palette

```css
/* Primary Colors */
--primary: 239 84% 67%;        /* #6366f1 - Indigo */
--primary-foreground: 0 0% 100%;

/* Secondary Colors */
--secondary: 240 5% 96%;
--secondary-foreground: 240 6% 10%;

/* Accent Colors */
--accent: 240 5% 96%;
--accent-foreground: 240 6% 10%;

/* Status Colors */
--success: 142 71% 45%;        /* Green */
--warning: 38 92% 50%;         /* Orange */
--error: 0 84% 60%;            /* Red */
--info: 199 89% 48%;           /* Blue */

/* Neutral Colors */
--background: 0 0% 100%;
--foreground: 240 10% 4%;
--muted: 240 5% 96%;
--muted-foreground: 240 4% 46%;
--border: 240 6% 90%;
```

## 📐 Spacing Scale

```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
```

## 🔤 Typography

```
/* Font Sizes */
xs:   12px (0.75rem)
sm:   14px (0.875rem)
base: 16px (1rem)
lg:   18px (1.125rem)
xl:   20px (1.25rem)
2xl:  24px (1.5rem)
3xl:  30px (1.875rem)
4xl:  36px (2.25rem)

/* Font Weights */
normal:    400
medium:    500
semibold:  600
bold:      700
```

## 📏 Border Radius

```
sm:   4px  (0.25rem)
md:   6px  (0.375rem)
lg:   8px  (0.5rem)
xl:   12px (0.75rem)
2xl:  16px (1rem)
full: 9999px
```

## 🎭 Component Variants

### Button Variants
- `default`: Primary action button
- `secondary`: Secondary action
- `outline`: Outlined button
- `ghost`: Transparent button
- `destructive`: Dangerous action
- `link`: Link-styled button

### Input Variants
- `default`: Standard input
- `error`: Error state
- `success`: Success state

### Badge Variants
- `default`: Neutral badge
- `success`: Success badge
- `warning`: Warning badge
- `error`: Error badge
- `info`: Info badge

## 🚀 Usage Guidelines

### Import Pattern
```typescript
// ✅ Correct - Import from @wataomi/ui
import { Button, Input, Card } from '@wataomi/ui'

// ❌ Wrong - Don't import from other libraries
import { Button } from 'some-other-library'
```

### Component Usage
```typescript
// Button
<Button variant="default" size="md">Click me</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="destructive">Delete</Button>

// Input
<Input placeholder="Enter text" />
<Input type="email" error="Invalid email" />

// Card
<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

## 🔧 Customization

All components support className prop for custom styling:

```typescript
<Button className="w-full mt-4">
  Full width button
</Button>

<Input className="max-w-md" />
```

## 📱 Responsive Design

Components are mobile-first and responsive by default:

```typescript
<Button className="w-full md:w-auto">
  Responsive button
</Button>
```

## ♿ Accessibility

All components include:
- Proper ARIA labels
- Keyboard navigation
- Focus indicators
- Screen reader support

## 🎨 Dark Mode Support

All components support dark mode via Tailwind's dark mode:

```typescript
// Automatically adapts to dark mode
<Card className="bg-white dark:bg-gray-800">
  Content
</Card>
```
