# UI Rules - Quy Tắc Giao Diện

## 1. Màu Sắc (Color Scheme)

### ⚠️ QUAN TRỌNG: Sử dụng Theme Colors

**LUÔN LUÔN** dùng theme colors thay vì hardcode màu:

```tsx
// ✅ ĐÚNG - Dùng theme colors
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
<div className="text-destructive">Error message</div>
<Badge variant="success">Success</Badge>

// ❌ SAI - Hardcode màu
<Button className="bg-blue-500 text-white hover:bg-blue-600">
<div className="text-red-500">Error message</div>
```

### Primary Colors (Màu Chính)

-   **Primary**: `bg-primary`, `text-primary`, `border-primary`
    -   Value: `blue-600` (#2563eb) - HSL: `217 91% 52%`
    -   Softer, less bright - comfortable for eyes
    -   Hover: `hover:bg-primary/90`
    -   Light: `bg-primary/10`, `bg-primary/15`
    -   Border: `border-primary`, `border-primary/50`
-   **Primary Foreground**: `text-primary-foreground`
    -   Dùng cho text trên background primary

**⚠️ Lưu ý:** Dùng blue-600 thay vì blue-500 để giảm độ chói, dễ nhìn hơn

### Success Colors (Màu Thành Công)

-   **Success**: Dùng `green-500` (#22c55e) cho trạng thái thành công
    -   `text-green-500`, `text-green-600`
    -   `bg-green-500`, `bg-green-50`, `bg-green-100`
    -   `border-green-500`
-   **Use cases**: Published status, completed executions, success messages

### Warning Colors (Màu Cảnh Báo)

-   **Warning**: Dùng `yellow-500`, `amber-500`, `orange-500`
    -   `text-yellow-500`, `text-amber-500`
    -   `bg-yellow-50`, `bg-amber-50`
    -   `border-yellow-500`
-   **Use cases**: Draft status, pending executions, warnings

### Error/Danger Colors (Màu Lỗi/Nguy Hiểm)

-   **Destructive**: `bg-destructive`, `text-destructive`
    -   Value: `red-500` (#ef4444)
    -   Hover: `hover:bg-destructive/90`
    -   Light: `bg-destructive/10`
-   **Use cases**: Delete buttons, error messages, failed executions

### Neutral Colors (Màu Trung Tính)

-   **Background**: `bg-background` - Main page background
-   **Foreground**: `text-foreground` - Main text color
-   **Card**: `bg-card` - Card backgrounds
-   **Muted**: `bg-muted`, `text-muted-foreground` - Secondary text, disabled states
-   **Border**: `border-border` - Default borders
-   **Accent**: `bg-accent` - Hover states, highlights

### Status Colors (Màu Trạng Thái)

```tsx
// Flow Status
draft: 'bg-yellow-500 text-white'        // Draft flows
published: 'bg-green-500 text-white'     // Published flows
archived: 'bg-orange-500 text-white'     // Archived flows

// Execution Status
running: 'bg-blue-500 text-white'        // Running
completed: 'bg-green-500 text-white'     // Completed
failed: 'bg-red-500 text-white'          // Failed
pending: 'bg-yellow-500 text-white'      // Pending
```

### Background Colors

-   **Main Background**: `bg-background` (white in light, dark in dark mode)
-   **Card Background**: `bg-card`
-   **Backdrop**: `bg-black/50` with `backdrop-blur-sm` - modal overlays
-   **Glass Effect**: `.glass` class - glassmorphism effect
-   **Muted Background**: `bg-muted` - disabled states, secondary areas

### Linear Gradient Backgrounds

**Gradient Palette (Blue Theme - Softer Tones):**

-   **Primary Gradient**: `bg-gradient-wata` 
    -   `linear-gradient(135deg, #1e40af 0%, #0e7490 50%, #4f46e5 100%)`
    -   Blue-800 → Cyan-700 → Indigo-600
    -   Darker, more comfortable for eyes
    -   Use for: Headers, hero sections, main branding

-   **Blue Gradient**: `bg-gradient-blue`
    -   `linear-gradient(135deg, #2563eb 0%, #1e40af 100%)`
    -   Blue-600 → Blue-800
    -   Use for: Primary buttons, important CTAs

-   **Blue-Cyan Gradient**: `bg-gradient-blue-cyan`
    -   `linear-gradient(135deg, #1d4ed8 0%, #0e7490 100%)`
    -   Blue-700 → Cyan-700
    -   Use for: User avatars, secondary elements

-   **Blue-Indigo Gradient**: `bg-gradient-blue-indigo`
    -   `linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)`
    -   Blue-600 → Indigo-600
    -   Use for: AI/Assistant avatars, special features

**Inline Gradients (Softer):**

```tsx
// AI Assistant avatar - darker, less bright
<div className="bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-600/30">

// User avatar - darker, less bright
<div className="bg-gradient-to-br from-cyan-600 to-blue-700 shadow-md shadow-cyan-600/30">

// Stat card glow - reduced opacity
<div className="bg-blue-600/8 group-hover:bg-blue-600/15">

// Light backgrounds
<div className="bg-gradient-to-br from-blue-50 to-indigo-50">
```

**💡 Tip:** Dùng blue-600/700 thay vì blue-500 để giảm độ sáng, thoải mái cho mắt hơn

## 2. Typography (Kiểu Chữ)

### Font Family

-   **Primary Font**: "Times New Roman", Times, serif
-   Được định nghĩa trong `globals.css`

### Font Sizes (Responsive)

```css
h1: text-3xl md:text-4xl font-bold
h2: text-2xl md:text-3xl font-semibold
h3: text-xl md:text-2xl font-semibold
h4: text-lg md:text-xl font-semibold
h5: text-base md:text-lg font-semibold
h6: text-sm md:text-base font-semibold
p: text-base leading-relaxed
```

### Text Colors

-   **Primary Text**: `text-foreground` (default)
-   **Secondary Text**: `text-muted-foreground`
-   **Link**: `text-primary hover:underline`
-   **Error**: `text-destructive`
-   **Success**: `text-green-600`

## 3. Spacing & Layout

### Container Classes

```tsx
.page-container: px-4 py-6 sm:px-6 md:px-8 lg:px-10 max-w-7xl mx-auto
.page-header: mb-6 md:mb-8
.content-wrapper: px-4 py-6 sm:px-6 md:px-8
.full-screen-page: absolute inset-0 overflow-hidden
```

### Responsive Padding

```tsx
.container-padding: px-4 sm:px-6 md:px-8 lg:px-10
.container-padding-y: py-4 sm:py-6 md:py-8
```

## 4. Components

### Buttons

```tsx
// Primary button
<Button>Primary Action</Button>

// Secondary button
<Button variant="outline">Secondary</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Ghost button
<Button variant="ghost">Cancel</Button>
```

### Badges

```tsx
<Badge>Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Cards

```tsx
<Card className="p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Glass Effect

```tsx
<div className="glass p-4 rounded-lg">
  Glassmorphism content
</div>
```

## 5. Dark Mode Support

Tất cả colors đều support dark mode tự động thông qua CSS variables:

-   Light mode: `html.light`
-   Dark mode: `.dark` hoặc `:root` (default)

Không cần thêm `dark:` prefix khi dùng theme colors.

## 6. Shadows & Effects

### Box Shadows

```tsx
// Subtle shadow
shadow-sm

// Default shadow
shadow-md

// Large shadow
shadow-lg

// Extra large shadow
shadow-xl

// Colored shadows (for gradients)
shadow-lg shadow-blue-500/20
shadow-md shadow-cyan-500/20
shadow-lg shadow-indigo-500/20
```

### Glassmorphism

```tsx
// Glass effect (auto dark mode support)
<div className="glass p-6 rounded-xl">
  Content with glass effect
</div>

// Custom glass
<div className="backdrop-blur-md bg-white/10 border border-white/20">
  Custom glass
</div>
```

### Glow Effects

```tsx
// Stat card glow
<div className="relative">
  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
  <div className="relative z-10">Content</div>
</div>

// Hover glow
<div className="group">
  <div className="bg-blue-500/10 group-hover:bg-blue-500/20 transition-all" />
</div>
```

## 7. Animation & Transitions

```css
/* Smooth transitions */
transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

/* Hover effects */
hover:bg-primary/90
hover:border-primary/50
hover:text-primary
hover:scale-[1.02]

/* Focus states */
focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50

/* Transform transitions */
transition-transform duration-300
transition-all duration-200
```

## 8. Color Combinations

### Recommended Pairings

```tsx
// Primary action
bg-primary text-primary-foreground hover:bg-primary/90

// Success state
bg-green-500 text-white hover:bg-green-600

// Warning state
bg-yellow-500 text-white hover:bg-yellow-600

// Error state
bg-destructive text-destructive-foreground hover:bg-destructive/90

// Info state
bg-blue-500 text-white hover:bg-blue-600

// Neutral state
bg-muted text-muted-foreground hover:bg-muted/80
```

### Status Badges

```tsx
// Draft
<Badge className="bg-yellow-500 text-white">Draft</Badge>

// Published
<Badge className="bg-green-500 text-white">Published</Badge>

// Archived
<Badge className="bg-orange-500 text-white">Archived</Badge>

// Running
<Badge className="bg-blue-500 text-white">Running</Badge>

// Failed
<Badge className="bg-red-500 text-white">Failed</Badge>
```

## 9. Checklist

Khi tạo component mới:

-   [ ] Dùng theme colors (`bg-primary`, `text-destructive`, etc.)
-   [ ] Không hardcode màu (`bg-blue-500`, `text-red-500`)
-   [ ] Support dark mode (dùng CSS variables)
-   [ ] Responsive typography và spacing
-   [ ] Smooth transitions cho hover/focus states
-   [ ] Accessible contrast ratios
-   [ ] Consistent với design system
