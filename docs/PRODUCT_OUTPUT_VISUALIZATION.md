# Smart Output Visualization

## Feature
Tự động detect và hiển thị output data theo format phù hợp:
1. **Text Response** - AI responses, text content
2. **Product Card** - E-commerce products, media
3. **JSON** - Fallback cho data khác

## Implementation

### 1. Text Response Detection
Ưu tiên cao nhất - check nếu có field `response` với string value:

```typescript
if (data.response && typeof data.response === 'string') {
    // Render as text
}
```

### 2. Product Detection
Check nếu có image + name/description:

```typescript
const isProduct = 
    data.image || 
    data.image_url || 
    data.thumbnail || 
    (data.name && data.description) ||
    (data.title && (data.image || data.url))
```

### 3. JSON Fallback
Mọi data khác hiển thị dạng JSON

### Supported Fields

#### Image (ưu tiên theo thứ tự)
- `image`
- `image_url`
- `thumbnail`
- `url`

#### Name/Title
- `name`
- `title`

#### Description
- `description`
- `caption`

#### Optional Fields
- `price` / `cost` - Hiển thị với badge màu primary
- `category` / `type` - Hiển thị với badge màu muted

## Product Card Layout

```
┌─────────────────────────┐
│                         │
│    Product Image        │
│    (h-48, cover)        │
│                         │
├─────────────────────────┤
│ Product Name            │
│ Description (2 lines)   │
│ [Price] [Category]      │
│ ▼ View Raw JSON         │
└─────────────────────────┘
```

### Features
- ✅ **Responsive image**: Full width, 192px height, object-cover
- ✅ **Fallback image**: SVG placeholder nếu image load fail
- ✅ **Line clamp**: Description giới hạn 2 dòng
- ✅ **Price badge**: Primary color, prominent
- ✅ **Category badge**: Muted color, subtle
- ✅ **Collapsible JSON**: Click "View Raw JSON" để xem full data

## Example Data Formats

### Format 1: Text Response (AI Output)
```json
{
  "response": "{{trigger.message}} is a placeholder variable...",
  "model": "gemini-2.5-pro",
  "tokens_used": 150
}
```

**Renders as:**
```
┌─────────────────────────────────────┐
│ {{trigger.message}} is a            │
│ placeholder variable...             │
│                                     │
│ [Model: gemini-2.5-pro] [Tokens: 150] │
│ ▼ View Raw JSON                     │
└─────────────────────────────────────┘
```

### Format 2: E-commerce Product
```json
{
  "name": "Chuối Nano",
  "description": "Chuối ngon, giá rẻ",
  "image": "https://example.com/banana.jpg",
  "price": 25000,
  "category": "Trái cây"
}
```

### Format 3: Social Media Post
```json
{
  "title": "Summer Sale",
  "caption": "Get 50% off all items",
  "image_url": "https://example.com/sale.jpg",
  "type": "promotion"
}
```

### Format 4: Content with Thumbnail
```json
{
  "name": "Blog Post",
  "description": "How to grow bananas",
  "thumbnail": "https://example.com/thumb.jpg"
}
```

## Fallback Behavior

Nếu data **không** match product format:
- Hiển thị dạng JSON như cũ
- Syntax highlighting
- Scrollable với max-height

## Rendering Priority

1. **Text Response** (highest priority)
   - Has `response` field with string value
   - Renders as formatted text with metadata

2. **Product Card**
   - Has image + name/title
   - Renders as visual card

3. **JSON** (fallback)
   - Everything else
   - Syntax highlighted JSON

## User Experience

### AI Response Output
**Before (JSON):**
```json
{
  "response": "Hello world",
  "model": "gemini-2.5-pro"
}
```

**After (Text):**
```
Hello world

[Model: gemini-2.5-pro]
```

### Product Output
**Before (JSON):**
```json
{
  "name": "Chuối Nano",
  "image": "https://...",
  "price": 25000
}
```

**After (Product Card):**
```
┌─────────────────────────┐
│   [Banana Image]        │
├─────────────────────────┤
│ Chuối Nano              │
│ Chuối ngon, giá rẻ      │
│ [$25,000] [Trái cây]    │
└─────────────────────────┘
```

## Benefits

✅ **Smart Detection**: Tự động chọn format phù hợp
✅ **Readable**: Text responses dễ đọc hơn JSON
✅ **Visual**: Product cards đẹp và professional
✅ **Flexible**: Support nhiều data formats
✅ **Metadata**: Hiển thị model, tokens, etc.
✅ **Fallback**: Vẫn có thể xem raw JSON
✅ **Error handling**: Placeholder nếu image fail

## Use Cases

### Text Response
- 🤖 AI chatbot responses
- 📝 Content generation
- 💬 Message templates
- 🔍 Text analysis results

### Product Card
- 🛒 E-commerce workflows
- 📱 Social media content
- 🖼️ Image processing
- 🎨 Design assets

### JSON Fallback
- 📊 Analytics data
- ⚙️ Configuration objects
- 🔢 Numerical results
- 📋 Structured data
