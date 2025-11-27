# New Workflow Quick Save

## Feature
Khi tạo workflow mới, auto-focus vào input name để user nhập tên và Enter để save nhanh.

## Implementation

### 1. Auto-focus Input
Khi route là `/flows/new/edit`:
```typescript
const [workflowName, setWorkflowName] = useState('')

<input
    autoFocus={params.id === 'new'}
    placeholder="Enter workflow name and press Enter to save"
/>
```

### 2. Header Input Enhancement

**Features:**
- Auto-focus khi là workflow mới
- Press Enter để save nhanh
- Placeholder hướng dẫn: "Enter workflow name and press Enter"
- Track unsaved changes khi đổi tên

```typescript
<input
    value={workflowName}
    onChange={(e) => {
        setWorkflowName(e.target.value)
        setHasUnsavedChanges(true)
    }}
    onKeyDown={(e) => {
        if (e.key === 'Enter' && params.id === 'new') {
            handleSave()
        }
    }}
    autoFocus={params.id === 'new'}
/>
```

## User Flow

### Quick Save Flow
```
1. Click "Create New Workflow"
2. Page loads, input auto-focused
3. Type "Customer Support Bot"
4. Press Enter
5. ✅ Workflow saved with name
6. Input blurs, ready to build
```

### Rename Anytime
```
1. Click on workflow name in header
2. Edit name
3. Press Enter to save
4. Continue working
```

## Benefits

✅ **No popup**: Không có modal làm gián đoạn
✅ **Auto-focus**: Cursor sẵn sàng để nhập
✅ **Quick save**: Enter key để save nhanh
✅ **Clear placeholder**: Hướng dẫn rõ ràng
✅ **Blur after save**: Input blur sau khi save
✅ **Simple UX**: Workflow tự nhiên, không phức tạp

## Technical Details

### State Management
```typescript
const [workflowName, setWorkflowName] = useState('')
```
Empty string cho workflow mới

### Enter Key Handler
```typescript
onKeyDown={(e) => {
    if (e.key === 'Enter' && workflowName.trim()) {
        e.preventDefault()
        e.currentTarget.blur() // Remove focus
        handleSave()
    }
}}
```

### Dynamic Placeholder
```typescript
placeholder={
    params.id === 'new' 
        ? 'Enter workflow name and press Enter to save' 
        : 'Workflow name'
}
```

## Future Enhancements

- [ ] Auto-suggest names based on template
- [ ] Show recent workflow names as suggestions
- [ ] Validate name uniqueness
- [ ] Auto-save on blur (not just Enter)
- [ ] Show save indicator after Enter
