# WataOmi - Complete Figma Design Specification

This document provides a comprehensive specification for creating the WataOmi design in Figma. Any AI or designer can use this to generate an exact Figma file.

## Design System

### Colors

#### Primary Palette
- **Wata Purple**: `#8B5CF6` (Primary brand color)
- **Wata Blue**: `#3B82F6` (Secondary accent)
- **Wata Cyan**: `#06B6D4` (Tertiary accent)
- **Wata Pink**: `#EC4899` (Highlight color)

#### Dark Mode Theme
- **Background**: `hsl(240, 10%, 3.9%)` - `#0A0A0B`
- **Foreground**: `hsl(0, 0%, 98%)` - `#FAFAFA`
- **Card**: `hsl(240, 10%, 5%)` - `#0D0D0F`
- **Border**: `hsl(240, 3.7%, 15.9%)` - `#262629`
- **Muted**: `hsl(240, 3.7%, 15.9%)` - `#262629`
- **Muted Foreground**: `hsl(240, 5%, 64.9%)` - `#9FA0A6`
- **Accent**: `hsl(240, 3.7%, 15.9%)` - `#262629`

#### Gradients
- **Primary Gradient**: Linear gradient 135deg from `#8B5CF6` → `#3B82F6` → `#06B6D4`
- **Hover Gradient**: Linear gradient 135deg from `#7C3AED` → `#2563EB` → `#0891B2`

### Typography

#### Font Family
- **Primary**: Inter (Google Fonts)
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

#### Type Scale
- **H1**: 48px / Bold / Line height 1.2
- **H2**: 36px / Bold / Line height 1.3
- **H3**: 24px / Semibold / Line height 1.4
- **H4**: 20px / Semibold / Line height 1.5
- **Body Large**: 16px / Regular / Line height 1.6
- **Body**: 14px / Regular / Line height 1.6
- **Body Small**: 12px / Regular / Line height 1.5
- **Caption**: 11px / Medium / Line height 1.4

### Spacing System

Use 8px grid system:
- **XS**: 4px
- **SM**: 8px
- **MD**: 16px
- **LG**: 24px
- **XL**: 32px
- **2XL**: 48px
- **3XL**: 64px

### Border Radius

- **SM**: 4px
- **MD**: 8px
- **LG**: 12px
- **XL**: 16px
- **2XL**: 24px
- **Full**: 9999px (circular)

### Shadows

- **SM**: `0 1px 2px rgba(0, 0, 0, 0.05)`
- **MD**: `0 4px 6px rgba(0, 0, 0, 0.1)`
- **LG**: `0 10px 15px rgba(0, 0, 0, 0.15)`
- **XL**: `0 20px 25px rgba(0, 0, 0, 0.2)`
- **Glow Purple**: `0 8px 32px rgba(139, 92, 246, 0.2)`

---

## Component Library

### 1. Button Component

**Variants:**
- Default (Gradient)
- Outline
- Ghost
- Destructive
- Link

**Sizes:**
- Small: Height 36px, Padding 12px 16px, Text 14px
- Medium: Height 40px, Padding 16px 20px, Text 14px
- Large: Height 44px, Padding 20px 32px, Text 16px

**States:**
- Default
- Hover (scale 1.05, shadow increase)
- Active (scale 0.98)
- Disabled (opacity 0.5)

**Auto Layout:**
- Direction: Horizontal
- Spacing: 8px
- Padding: As per size
- Alignment: Center

### 2. Input Field

**Variants:**
- Default
- Error
- Disabled

**Structure:**
- Height: 40px
- Padding: 12px 16px
- Background: Muted color
- Border: 1px solid Border color
- Border Radius: 8px
- Text: Body size

### 3. Card Component

**Structure:**
- Background: Card color with glassmorphism effect
- Border: 1px solid Border color (40% opacity)
- Border Radius: 16px
- Padding: 24px
- Shadow: MD shadow

**Glassmorphism Effect:**
- Background: `rgba(255, 255, 255, 0.05)`
- Backdrop blur: 10px
- Border: `1px solid rgba(255, 255, 255, 0.1)`

### 4. Navigation Sidebar

**Dimensions:**
- Width: 256px
- Height: 100vh

**Sections:**
1. Logo area (64px height)
2. Workspace selector (auto height + 16px padding)
3. Navigation items (flex-grow)
4. User menu (auto height + 16px padding)

**Navigation Item:**
- Height: 40px
- Padding: 12px 16px
- Border Radius: 8px
- Active state: Gradient background + white text
- Inactive state: Transparent + muted text

### 5. Flow Node Components

**Base Node Structure:**
- Min Width: 180px
- Padding: 12px 16px
- Border Radius: 8px
- Border: 2px solid (color varies by type)
- Shadow: LG shadow

**Node Types & Colors:**
- Start: Purple (`#8B5CF6`)
- Message: Blue (`#3B82F6`)
- AI Reply: Cyan (`#06B6D4`)
- Condition: Amber (`#F59E0B`)
- n8n Trigger: Pink (`#EC4899`)
- Human Handover: Green (`#10B981`)
- End: Red (`#EF4444`)

**Node Content:**
- Icon (16px) + Label (14px semibold)
- Optional description (12px muted)
- Connection handles (12px circles)

---

## Page Layouts

### Page 1: Landing Page

**Sections:**

1. **Navigation Bar** (Fixed, 64px height)
   - Logo + "WataOmi" text (left)
   - Navigation links: Features, Pricing, Docs (center)
   - Sign In button (outline) + Get Started button (gradient) (right)
   - Background: Glassmorphism card
   - Border bottom: 1px solid border/40

2. **Hero Section** (100vh)
   - Badge: "Powered by AI & n8n" (purple background/10, purple border/20)
   - H1: "One AI. Every Channel. Zero Code." (gradient text)
   - Subtitle: Description text (20px, muted)
   - CTA buttons: "Start Building Free" + "Watch Demo"
   - Hero visual: 3-column grid showing Bot, Flow, Inbox cards

3. **Features Section**
   - Title: "Everything you need to engage customers"
   - 3-column grid (6 feature cards)
   - Each card: Icon (gradient background) + Title + Description
   - Hover effect: Border color change + shadow increase

4. **Pricing Section**
   - Title: "Simple, transparent pricing"
   - 3-column grid (Starter, Pro, Enterprise)
   - Pro plan: Featured with purple border + scale 1.05
   - Each plan: Name, Price, Description, CTA, Feature list with checkmarks

5. **CTA Section**
   - Glassmorphism card with purple border
   - Title + Description + CTA button
   - Centered content

6. **Footer**
   - 4-column grid: Brand, Product, Resources, Company
   - Copyright text (centered)

### Page 2: Dashboard Home

**Layout:**
- Sidebar (256px) + Main content (flex-1)
- Top bar (64px height)

**Content:**
1. Stats Grid (4 columns)
   - Each stat: Icon, Value, Title, Change percentage
   - Gradient icon background

2. Quick Actions (3 columns)
   - Create Flow, Connect Channel, View Inbox
   - Hover effect: Border color + icon scale

3. Recent Conversations
   - Table/list view
   - Each row: Avatar, Name, Message, Time, Status badge

### Page 3: WataFlow Builder

**Layout:**
- Toolbar (top, 64px)
- Node palette (right, 256px)
- Canvas (flex-1)
- Properties panel (right, 320px, conditional)

**Toolbar:**
- Save button + Test Flow button (left)
- AI Suggest Next Node button (gradient)

**Node Palette:**
- Title: "Add Node"
- 2-column grid of node type buttons

**Canvas:**
- ReactFlow background (dots pattern)
- Minimap (bottom right)
- Controls (bottom left)

**Properties Panel:**
- Node properties form
- Input fields for configuration
- Delete button (destructive variant)

### Page 4: OmniInbox

**3-Column Layout:**

1. **Channels List** (256px)
   - Search bar
   - Channel cards with icon, name, active count

2. **Conversations List** (320px)
   - Filter button
   - Conversation items: Avatar, Name, Last message, Time, Unread badge

3. **Chat Thread** (flex-1)
   - Header: Customer info + action buttons
   - Messages area: Scrollable, customer (left) vs bot (right) alignment
   - Input area: Attachment + Text input + Emoji + Send button

### Page 5: Channels

**Layout:**
- Header with title + "Add Channel" button
- 3-column grid of channel platform cards

**Channel Card:**
- Platform icon (colored background)
- Connection status badge
- Platform name + description
- Stats (if connected) or Connect button

### Page 6: Analytics

**Layout:**
- Key metrics (4 columns)
- Charts section (2 columns):
  - Conversation volume (bar chart)
  - Channel distribution (progress bars)
- Bot performance table

### Page 7: Settings

**Layout:**
- WataBubble Customizer (2 columns):
  - Configuration form (left)
  - Live preview (right)
- Bot Settings form

### Page 8: WataBubble Widget Customizer

**Live Preview:**
- Website mockup with chat bubble
- Bubble position: Dynamic based on selection
- Bubble color: Dynamic based on color picker

---

## Component Properties & Variants

### Auto Layout Rules

All components should use Figma's Auto Layout with:
- Proper spacing between elements
- Responsive resizing (hug/fill)
- Alignment (center, space-between, etc.)

### Component Variants

Create component sets with properties:
- **Button**: variant (default/outline/ghost), size (sm/md/lg), state (default/hover/disabled)
- **Input**: state (default/error/disabled)
- **Card**: variant (default/glassmorphism)
- **Badge**: variant (default/success/warning/error)
- **Node**: type (start/message/ai-reply/etc)

### Interactive Components

Use Figma's interactive components for:
- Button hover states
- Input focus states
- Navigation active states
- Modal open/close
- Dropdown expand/collapse

---

## Design Tokens

Export as Figma variables:

**Colors:**
- All color values from design system

**Typography:**
- Font families, sizes, weights, line heights

**Spacing:**
- All spacing values (4px to 64px)

**Radius:**
- All border radius values

**Shadows:**
- All shadow styles

---

## Export Specifications

### For Development:
- Export icons as SVG
- Export images as WebP (2x resolution)
- Use CSS variables for colors
- Use Tailwind classes for spacing/sizing

### For Handoff:
- Use Figma Dev Mode
- Annotate component properties
- Document interaction states
- Provide code snippets for complex components

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Focus indicators on all interactive elements
- Keyboard navigation support
- Screen reader friendly labels
- Touch target minimum: 44x44px

---

This specification provides everything needed to create a pixel-perfect Figma design for WataOmi. All measurements, colors, and component structures are production-ready and follow modern design best practices.
