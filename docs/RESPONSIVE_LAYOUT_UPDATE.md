# Cập Nhật Layout Responsive & Typography

## ✅ Hoàn Thành

### 1. Font & Typography
- ✅ **Font chính**: Times New Roman cho toàn bộ ứng dụng
- ✅ **Kích thước chuẩn**: 16px base với line-height 1.6
- ✅ **Responsive headings**: Tự động scale theo màn hình
  - h1: text-3xl md:text-4xl
  - h2: text-2xl md:text-3xl
  - h3: text-xl md:text-2xl
  - p: text-base với leading-relaxed

### 2. Container & Spacing Đồng Bộ
- ✅ **page-container**: `px-4 py-6 sm:px-6 md:px-8 lg:px-10 max-w-7xl mx-auto`
- ✅ **content-wrapper**: `px-4 py-6 sm:px-6 md:px-8`
- ✅ **page-header**: `mb-6 md:mb-8`
- ✅ **Margin/Padding**: Scale đồng bộ (4→6→8→10)

### 3. Sidebar Responsive với Toggle
- ✅ **Desktop (≥1024px)**: 
  - Sidebar hiển thị mặc định (w-64)
  - Click icon để thu gọn/mở rộng
  - Smooth animation 300ms
- ✅ **Mobile (<1024px)**: 
  - Sidebar ẩn mặc định
  - Fixed position với overlay
  - Click hamburger menu để mở
  - Click overlay để đóng
- ✅ **Animation**: `transition-transform duration-300 ease-in-out`

### 4. Breakpoints Tailwind
- **sm**: 640px (tablet nhỏ)
- **md**: 768px (tablet)
- **lg**: 1024px (desktop - sidebar breakpoint)
- **xl**: 1280px (desktop lớn)

## 📁 Files Đã Cập Nhật

1. ✅ `apps/web/app/globals.css` - Typography, utilities, responsive classes
2. ✅ `apps/web/app/(dashboard)/layout.tsx` - Sidebar responsive + toggle
3. ✅ `apps/web/app/(dashboard)/dashboard/page.tsx` - Container đồng bộ
4. ✅ `apps/web/app/(dashboard)/ai-assistant/page.tsx` - Full-screen layout
5. ✅ `apps/web/app/(dashboard)/flows/[id]/edit/page.tsx` - Canvas full-screen fix
6. ✅ `apps/web/tailwind.config.ts` - Font Times New Roman
7. ✅ `apps/web/app/(dashboard)/test-responsive/page.tsx` - Test page

## 🎯 Cách Sử Dụng

### Trang thông thường (có padding):
```tsx
export default function MyPage() {
  return (
    <div className="content-wrapper h-full">
      <div className="page-container max-w-7xl mx-auto">
        <div className="page-header">
          <h1>Tiêu đề trang</h1>
          <p className="text-muted-foreground mt-2">Mô tả</p>
        </div>
        
        {/* Nội dung */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Cards */}
        </div>
      </div>
    </div>
  )
}
```

### Trang full-screen (không padding - như workflow editor, inbox):
```tsx
export default function FullScreenPage() {
  return (
    <div className="full-screen-page flex flex-col">
      {/* Header */}
      <header className="h-16 border-b">...</header>
      
      {/* Content full height */}
      <div className="flex-1">...</div>
    </div>
  )
}
```

### Typography responsive:
```tsx
<h1>Heading 1</h1>  {/* text-3xl md:text-4xl */}
<h2>Heading 2</h2>  {/* text-2xl md:text-3xl */}
<p>Paragraph</p>   {/* text-base leading-relaxed */}
```

### Grid responsive:
```tsx
{/* Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols */}
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

## 🧪 Test

Truy cập `/dashboard/test-responsive` để xem demo và test:
- Typography scale
- Container spacing
- Sidebar toggle
- Grid responsive
- Breakpoints

## 📱 Sidebar Toggle

**Desktop (≥1024px)**:
- Click icon ⇄ để thu gọn/mở rộng
- Sidebar luôn visible

**Mobile (<1024px)**:
- Click ☰ hamburger menu để mở
- Click overlay (màu đen mờ) để đóng
- Sidebar slide từ trái sang

## 🎨 Utility Classes Mới

```css
.sidebar-transition      /* Smooth sidebar animation */
.text-responsive-sm      /* text-sm sm:text-base */
.text-responsive-base    /* text-base sm:text-lg */
.text-responsive-lg      /* text-lg sm:text-xl md:text-2xl */
.container-padding       /* px-4 sm:px-6 md:px-8 lg:px-10 */
.container-padding-y     /* py-4 sm:py-6 md:py-8 */
```
